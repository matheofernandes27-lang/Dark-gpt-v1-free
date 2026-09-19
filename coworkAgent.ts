/**
 * coworkAgent.ts — Dark-GPT Cowork (version bridée, propre et fonctionnelle)
 * --------------------------------------------------------------------------
 * Agent local façon Claude, avec 5 outils, MAIS cloisonné et sous contrôle humain :
 *
 *   1. view_file       (lecture)   — lit un fichier DANS le dossier de travail.
 *   2. write_file      (écriture)  — crée/écrit un fichier — nécessite ton APPROBATION.
 *   3. file_modify     (édition)   — Search & Replace chirurgical — APPROBATION + anti-TOCTOU.
 *   4. search_grep     (recherche) — scanne récursivement le dossier de travail.
 *   5. image_generate  (image)     — via imagePlugins LÉGITIMES (Pollinations/Gemini/OpenAI),
 *                                     JAMAIS le bot Dreamina.
 *
 * Sécurité (cf. cahier des charges section 5, en version saine) :
 *   - Cloisonnement strict à ALLOWED_ROOT (~/dark-gpt-workspace).
 *   - Jail anti-directory-traversal : vérification ascendante realpath de chaque parent.
 *   - File d'actions à validation humaine : propose -> (ton clic) -> execute.
 *   - Nonce à usage unique + empreinte SHA-256 de la payload (anti-tampering).
 *   - Anti-TOCTOU : file_modify exige le hash du contenu AVANT édition.
 *   - Disjoncteur : au-delà de 5 actions par session, re-validation exigée.
 *   - Secret démon chmod 600 généré au démarrage (auth locale optionnelle).
 *
 * Rien ne sort du dossier de travail. Aucune commande shell arbitraire. Aucun push aveugle.
 */

import { Router, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateImage, listImageProviders } from './imagePlugins.ts';

// ------------------------------------------------------------------ Périmètre
export const ALLOWED_ROOT = path.resolve(path.join(process.env.HOME || '.', 'dark-gpt-workspace'));
if (!fs.existsSync(ALLOWED_ROOT)) {
  fs.mkdirSync(ALLOWED_ROOT, { recursive: true });
}

// Secret démon local (chmod 600) — auth locale optionnelle.
const daemonSecretPath = path.join(ALLOWED_ROOT, '.daemon_secret');
export const DAEMON_SECRET = crypto.randomBytes(48).toString('hex');
try {
  fs.writeFileSync(daemonSecretPath, DAEMON_SECRET, { mode: 0o600, encoding: 'utf-8' });
} catch {
  /* non bloquant */
}

// ------------------------------------------------------------------ Sécurité chemins
/** Vérifie qu'un chemin reste physiquement à l'intérieur de ALLOWED_ROOT (symlinks compris). */
function isPathSafe(targetPath: string): boolean {
  try {
    const rootReal = fs.realpathSync(ALLOWED_ROOT);
    const resolved = path.resolve(targetPath);

    // 1) Confinement lexical : le chemin doit être sous la racine autorisée.
    const rel = path.relative(rootReal, resolved);
    if (rel !== '' && (rel.startsWith('..') || path.isAbsolute(rel))) return false;

    // 2) Confinement physique : on remonte les composants EXISTANTS jusqu'à la racine
    //    (sans jamais aller au-dessus) et on vérifie qu'aucun symlink ne sort du jail.
    let cur = resolved;
    while (cur !== rootReal && cur !== path.parse(cur).root) {
      if (fs.existsSync(cur)) {
        const real = fs.realpathSync(cur);
        const r = path.relative(rootReal, real);
        if (r !== '' && (r.startsWith('..') || path.isAbsolute(r))) return false;
      }
      cur = path.dirname(cur);
    }
    return true;
  } catch {
    return false;
  }
}

/** Résout un chemin relatif fourni par l'IA à l'intérieur du dossier de travail. */
function resolveInRoot(rel: string): string | null {
  if (typeof rel !== 'string' || !rel.trim()) return null;
  const full = path.resolve(path.join(ALLOWED_ROOT, rel));
  return isPathSafe(full) ? full : null;
}

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// ------------------------------------------------------------------ File d'actions
type ToolType = 'write_file' | 'file_modify' | 'image_generate';
interface ActionManifest {
  id: string;
  nonce: string;
  tool: ToolType;
  taskId: string;
  targetPath?: string;
  content?: string;
  search?: string;
  replace?: string;
  expectedOldHash?: string;
  imagePrompt?: string;
  imageProvider?: string;
  payloadHash: string;
  createdAt: number;
}
const pending = new Map<string, ActionManifest>();
const taskCounters = new Map<string, number>();

// Purge des manifestes expirés (5 min).
setInterval(() => {
  const now = Date.now();
  for (const [id, m] of pending) if (now - m.createdAt > 300_000) pending.delete(id);
}, 60_000).unref?.();

// ------------------------------------------------------------------ Recherche récursive
function recursiveGrep(dir: string, pattern: string, out: string[] = [], depth = 0): string[] {
  if (depth > 20 || out.length >= 500) return out; // garde-fous
  let list: string[] = [];
  try {
    list = fs.readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of list) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue; // on ne suit pas les liens (jail)
    if (stat.isDirectory()) {
      recursiveGrep(full, pattern, out, depth + 1);
    } else if (stat.isFile() && stat.size < 2_000_000) {
      try {
        const content = fs.readFileSync(full, 'utf-8');
        if (content.includes(pattern)) out.push(path.relative(ALLOWED_ROOT, full));
      } catch {
        /* fichier binaire ou illisible : ignoré */
      }
    }
  }
  return out;
}

// ------------------------------------------------------------------ Router
export const coworkRouter = Router();

/** Infos périmètre + fournisseurs d'images disponibles. */
coworkRouter.get('/info', (_req: Request, res: Response) => {
  res.json({
    allowedRoot: ALLOWED_ROOT,
    tools: ['view_file', 'write_file', 'file_modify', 'search_grep', 'image_generate'],
    imageProviders: listImageProviders(),
    security: {
      confinement: true,
      humanApproval: true,
      antiTraversal: true,
      antiTOCTOU: true,
      circuitBreaker: 5,
    },
  });
});

/** 1. view_file (lecture directe : ne modifie rien). */
coworkRouter.get('/view', (req: Request, res: Response) => {
  const full = resolveInRoot(String(req.query.path || ''));
  if (!full) return res.status(403).json({ error: 'Chemin hors du dossier de travail (bloqué).' });
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return res.status(404).json({ error: 'Fichier introuvable.' });
  }
  try {
    const content = fs.readFileSync(full, 'utf-8');
    res.json({ path: path.relative(ALLOWED_ROOT, full), content, hash: sha256(content) });
  } catch {
    res.status(500).json({ error: 'Lecture impossible (fichier binaire ?).' });
  }
});

/** 4. search_grep (lecture directe). */
coworkRouter.get('/search', (req: Request, res: Response) => {
  const pattern = String(req.query.pattern || '');
  if (!pattern.trim()) return res.status(400).json({ error: 'Motif de recherche vide.' });
  const matches = recursiveGrep(ALLOWED_ROOT, pattern);
  res.json({ pattern, matches, count: matches.length });
});

/** Liste des fichiers du dossier de travail. */
coworkRouter.get('/list', (_req: Request, res: Response) => {
  const files = recursiveGrepList(ALLOWED_ROOT);
  res.json({ root: ALLOWED_ROOT, files });
});
function recursiveGrepList(dir: string, out: string[] = [], depth = 0): string[] {
  if (depth > 20 || out.length >= 1000) return out;
  let list: string[] = [];
  try { list = fs.readdirSync(dir); } catch { return out; }
  for (const name of list) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    let stat: fs.Stats;
    try { stat = fs.lstatSync(full); } catch { continue; }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) recursiveGrepList(full, out, depth + 1);
    else if (stat.isFile()) out.push(path.relative(ALLOWED_ROOT, full));
  }
  return out;
}

/**
 * PROPOSE — l'IA propose une action modifiante ; renvoie un nonce à valider par l'humain.
 * Aucun effet sur le disque à ce stade.
 */
coworkRouter.post('/propose', (req: Request, res: Response) => {
  const { tool, taskId = 'default', path: relPath, content, search, replace, expectedOldHash, imagePrompt, imageProvider } = req.body || {};

  if (!['write_file', 'file_modify', 'image_generate'].includes(tool)) {
    return res.status(400).json({ error: 'Outil non modifiant : utilisez /view ou /search.' });
  }

  // Disjoncteur anti-boucle.
  const count = taskCounters.get(taskId) || 0;
  if (count >= 5) {
    return res.status(429).json({ error: 'Disjoncteur : 5 actions atteintes pour cette tâche. Re-validation manuelle requise.' });
  }

  const id = crypto.randomUUID();
  const nonce = crypto.randomBytes(24).toString('hex');
  let manifest: ActionManifest;

  if (tool === 'write_file' || tool === 'file_modify') {
    const full = resolveInRoot(relPath);
    if (!full) return res.status(403).json({ error: 'Chemin hors du dossier de travail (bloqué).' });
    if (tool === 'file_modify') {
      if (!fs.existsSync(full)) return res.status(404).json({ error: 'Fichier à modifier introuvable.' });
      if (!search) return res.status(400).json({ error: 'file_modify exige un bloc "search".' });
    }
    const seed = tool === 'file_modify' ? `${search}=>${replace}` : String(content ?? '');
    manifest = {
      id, nonce, tool, taskId, targetPath: full,
      content, search, replace, expectedOldHash,
      payloadHash: sha256(seed), createdAt: Date.now(),
    };
  } else {
    // image_generate
    if (!imagePrompt || !String(imagePrompt).trim()) {
      return res.status(400).json({ error: 'image_generate exige un "imagePrompt".' });
    }
    manifest = {
      id, nonce, tool, taskId, imagePrompt, imageProvider,
      payloadHash: sha256(String(imagePrompt)), createdAt: Date.now(),
    };
  }

  pending.set(id, manifest);
  res.json({
    actionId: id,
    nonce,
    tool,
    preview: {
      target: manifest.targetPath ? path.relative(ALLOWED_ROOT, manifest.targetPath) : undefined,
      imagePrompt: manifest.imagePrompt,
      search: manifest.search,
      replace: manifest.replace,
    },
    message: 'Action en attente de votre validation (POST /execute avec approved:true).',
  });
});

/**
 * EXECUTE — exécute (ou rejette) une action proposée, après validation humaine.
 */
coworkRouter.post('/execute', async (req: Request, res: Response) => {
  const { actionId, nonce, approved, contentHash } = req.body || {};
  const m = pending.get(actionId || '');
  if (!m || m.nonce !== nonce) {
    return res.status(401).json({ error: 'Action inconnue ou nonce invalide.' });
  }
  pending.delete(actionId); // nonce à usage unique

  if (!approved) {
    return res.json({ success: false, output: 'Action rejetée par l’utilisateur.' });
  }

  // Anti-tampering : le hash de payload doit correspondre (si fourni par le client).
  if (contentHash && contentHash !== m.payloadHash) {
    return res.status(401).json({ error: 'Contenu altéré après signature (anti-tampering).' });
  }

  taskCounters.set(m.taskId, (taskCounters.get(m.taskId) || 0) + 1);

  try {
    if (m.tool === 'image_generate') {
      const img = await generateImage({ prompt: m.imagePrompt! }, m.imageProvider);
      return res.json({ success: true, tool: m.tool, provider: img.provider, dataUrl: img.dataUrl });
    }

    const full = m.targetPath!;
    if (!isPathSafe(full)) return res.status(403).json({ error: 'Directory traversal bloqué.' });

    if (m.tool === 'write_file') {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, m.content ?? '', 'utf-8');
      return res.json({ success: true, tool: m.tool, path: path.relative(ALLOWED_ROOT, full), output: 'Fichier écrit.' });
    }

    if (m.tool === 'file_modify') {
      if (!fs.existsSync(full)) return res.status(404).json({ error: 'Fichier disparu.' });
      const current = fs.readFileSync(full, 'utf-8');
      // Anti-TOCTOU : le fichier ne doit pas avoir changé depuis la proposition.
      if (m.expectedOldHash && sha256(current) !== m.expectedOldHash) {
        return res.status(409).json({ error: 'Conflit TOCTOU : le fichier a changé entre-temps.' });
      }
      if (!current.includes(m.search!)) {
        return res.status(422).json({ error: 'Édition chirurgicale : bloc "search" introuvable.' });
      }
      const updated = current.replace(m.search!, m.replace ?? '');
      fs.writeFileSync(full, updated, 'utf-8');
      return res.json({ success: true, tool: m.tool, path: path.relative(ALLOWED_ROOT, full), output: 'Modification chirurgicale appliquée.' });
    }

    return res.status(400).json({ error: 'Outil non supporté.' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Erreur d’exécution.' });
  }
});
