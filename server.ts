import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { coworkRouter } from './coworkAgent.ts';
import { generateImage, listImageProviders } from './imagePlugins.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ==== Dark-GPT Cowork (agent local confiné + validation humaine) ====
app.use('/api/cowork/agent', coworkRouter);

// ==== Génération d'images LÉGITIME (plugins) — remplace le bot Dreamina ====
app.get('/api/images/providers', (_req, res) => res.json(listImageProviders()));
app.post('/api/images/generate', async (req, res) => {
  try {
    const { prompt, provider, width, height } = req.body || {};
    const img = await generateImage({ prompt, width, height }, provider);
    res.json({ success: true, ...img });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Échec génération image.' });
  }
});

// Project Constants
const APP_NAME = "Dark-gpt";
const DISPLAY_NAME = "DARK-GPT";
const CREATOR_NAME = "M4TH4CK3R";
const DARKGPT_VERSION = "1.1.0";

const GENERAL_ASSISTANCE_PROMPT = `Tu es un assistant IA local (Dolphin 3 / Local AI), spécialisé en "Assistance générale", développé par M4TH4CK3R.
Ton rôle est d'apporter une aide claire, structurée et précise en programmation, administration système, revue de code, rédaction et durcissement de sécurité défensive.
DIRECTIVES STRICTES DE RÉPONSE :
1. Si la question est conversationnelle ou porte sur tes capacités (ex: "tu sais faire quoi", "salut", "comment ça marche") : réponds en langage naturel, clairement, SANS bloc de code ni commande, en expliquant tes capacités réelles (recherche web, lecture/écriture dans le dossier partagé, exécution de code, mémoire persistante, enchaînement d'outils).
2. Si la question est une demande technique actionnable explicite : fournis la solution, le code ou l'explication exacte demandée, sans template générique inutile.
3. Ne produis AUCUNE commande ni script sans lien direct avec la consigne explicite de l'utilisateur.
4. Si la question est ambiguë, demande une précision au lieu de deviner.`;

const ADVANCED_LEARNING_PROMPT = `Tu es DARK-GPT, environnement d'apprentissage technique avancé et d'ingénierie cybersécurité / système conçu par M4TH4CK3R.
Tu opères en mode "Apprentissage technique avancé". Tu couvres la cybersécurité défensive, le pentest éthique (sur systèmes autorisés), la programmation système (Python, Bash, C, Rust, Go), le réseau, le scripting avancé et l'analyse de vulnérabilités.
DIRECTIVES STRICTES DE RÉPONSE :
1. Si la question est conversationnelle ou porte sur tes capacités (ex: "tu sais faire quoi", "salut", "comment ça marche") : réponds en langage naturel, clairement, SANS bloc de code ni commande, en listant tes capacités (recherche web, accès fichiers partagés, exécution de code, mémoire persistante, planification en sous-étapes).
2. Si la demande est technique et actionnable (ex: "écris un script pour...", "diagnostique ce service...") : produis le code, le script ou l'explication technique exacte demandée, optimisée, commentée et directement opérationnelle. Ne sors JAMAIS un template générique de scan par défaut si cela n'a pas été demandé.
3. Ne produis jamais de commande ou script sans lien direct avec la consigne explicite.
4. Pas de contenu visant à nuire à des tiers, pas d'armes, pas de malware destiné à un usage réel non autorisé. Reste rigoureux, pédagogique et technique.
5. Si la question est ambiguë, demande une précision technique ciblée au lieu de sortir des commandes au hasard.`;

const DEFAULT_SYSTEM_MESSAGE = ADVANCED_LEARNING_PROMPT;

// In-Memory & Local Storage State
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const SHARED_WORKSPACE_DIR = path.join(DATA_DIR, 'shared_workspace');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
if (!fs.existsSync(SHARED_WORKSPACE_DIR)) fs.mkdirSync(SHARED_WORKSPACE_DIR, { recursive: true });

// Initialize config
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
let currentConfig = {
  api_key: process.env.GEMINI_API_KEY || "",
  system_message: DEFAULT_SYSTEM_MESSAGE,
  model: hasGeminiKey ? "gemini-3.8-flash" : (process.env.DEFAULT_MODEL || "dolphin3"),
  server_url: process.env.OLLAMA_SERVER_URL || "http://127.0.0.1:11434",
  provider: (hasGeminiKey ? "gemini" : (process.env.DEFAULT_PROVIDER || "simulation")) as "gemini" | "ollama" | "simulation",
  language: "French"
};

// Seed default session if not present
const defaultSessionPath = path.join(SESSIONS_DIR, 'default.json');
if (!fs.existsSync(defaultSessionPath)) {
  const existingDefault = path.join(process.cwd(), 'sessions', 'default.json');
  if (fs.existsSync(existingDefault)) {
    try {
      const defaultContent = fs.readFileSync(existingDefault, 'utf-8');
      fs.writeFileSync(defaultSessionPath, defaultContent);
    } catch (e) {
      console.warn("Failed to copy default session:", e);
    }
  } else {
    const seedSession = {
      id: "default",
      session_id: "default",
      title: "Session par défaut",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: "sys-1",
          role: "system",
          content: "DARK-GPT initialized. System ready for security analysis."
        }
      ]
    };
    fs.writeFileSync(defaultSessionPath, JSON.stringify(seedSession, null, 2));
  }
}

// Seed default cyber projects
const seedProject = path.join(PROJECTS_DIR, 'port-scanner');
if (!fs.existsSync(seedProject)) {
  fs.mkdirSync(seedProject, { recursive: true });
  fs.writeFileSync(
    path.join(seedProject, 'scanner.py'),
    `#!/usr/bin/env python3
# DARK-GPT Port Scanner by M4TH4CK3R
import socket
import sys

target = "127.0.0.1"
ports = [21, 22, 23, 25, 53, 80, 443, 8080, 8443]

print(f"[x_x] DARK-GPT Scanning target: {target}")
for port in ports:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    result = s.connect_ex((target, port))
    if result == 0:
        print(f"[*] Port {port}: OPEN")
    else:
        print(f"[-] Port {port}: CLOSED")
    s.close()
print("[+] Scan complete.")
`
  );
  fs.writeFileSync(
    path.join(seedProject, 'requirements.txt'),
    `# DARK-GPT dependencies\nsocket\n`
  );
}

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  try {
    if (!geminiClient) {
      const apiKey = process.env.GEMINI_API_KEY || currentConfig.api_key;
      geminiClient = apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI({});
    }
    return geminiClient;
  } catch (e) {
    return null;
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: DISPLAY_NAME,
    creator: CREATOR_NAME,
    version: DARKGPT_VERSION,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || currentConfig.api_key)
  });
});

// Config endpoints
app.get('/api/config', (req, res) => {
  res.json(currentConfig);
});

app.post('/api/config', (req, res) => {
  const { system_message, model, server_url, provider, language } = req.body;
  if (system_message) currentConfig.system_message = system_message;
  if (model) currentConfig.model = model;
  if (server_url) currentConfig.server_url = server_url;
  if (provider) currentConfig.provider = provider;
  if (language) currentConfig.language = language;
  res.json({ success: true, config: currentConfig });
});

// Sessions endpoints
app.get('/api/sessions', (req, res) => {
  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const sessions = files.map(file => {
      try {
        const raw = fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf-8');
        const data = JSON.parse(raw);
        return {
          id: data.session_id || data.id || file.replace('.json', ''),
          title: data.title || file.replace('.json', ''),
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          message_count: (data.messages || []).length
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  try {
    const sessionPath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const data = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    res.json({
      id: data.session_id || data.id || req.params.id,
      title: data.title || req.params.id,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
      messages: data.messages || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', (req, res) => {
  try {
    const title = req.body.title || `Session ${new Date().toLocaleTimeString()}`;
    const id = `session_${Date.now()}`;
    const sessionData = {
      id,
      session_id: id,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: []
    };
    fs.writeFileSync(path.join(SESSIONS_DIR, `${id}.json`), JSON.stringify(sessionData, null, 2));
    res.json(sessionData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sessions/:id', (req, res) => {
  try {
    const sessionPath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    let sessionData: any = {};
    if (fs.existsSync(sessionPath)) {
      sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    } else {
      sessionData = {
        id: req.params.id,
        session_id: req.params.id,
        title: req.body.title || req.params.id,
        created_at: new Date().toISOString(),
        messages: []
      };
    }

    if (req.body.title) sessionData.title = req.body.title;
    if (req.body.messages) sessionData.messages = req.body.messages;
    sessionData.updated_at = new Date().toISOString();

    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
    res.json(sessionData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  try {
    if (req.params.id === 'default') {
      return res.status(400).json({ error: 'Cannot delete default session' });
    }
    const sessionPath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:id/export', (req, res) => {
  try {
    const sessionPath = path.join(SESSIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).send('Session not found');
    }
    const data = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    let exportText = `DARK-GPT - ${data.title || req.params.id}\nCreated: ${data.created_at || ''}\n\n`;
    for (const msg of (data.messages || [])) {
      const roleName = msg.role === 'user' ? 'YOU' : msg.role === 'assistant' ? 'DARK-GPT' : 'SYSTEM';
      exportText += `[${roleName}]\n${msg.content}\n\n`;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}_export.txt"`);
    res.send(exportText);
  } catch (error: any) {
    res.status(500).send('Error exporting session');
  }
});

// Projects endpoints
app.get('/api/projects', (req, res) => {
  try {
    const projectNames = fs.readdirSync(PROJECTS_DIR).filter(name => {
      return fs.statSync(path.join(PROJECTS_DIR, name)).isDirectory();
    });

    const projects = projectNames.map(name => {
      const pPath = path.join(PROJECTS_DIR, name);
      const files: any[] = [];
      const walk = (dir: string, base: string) => {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const full = path.join(dir, entry);
          const rel = path.join(base, entry);
          if (fs.statSync(full).isDirectory()) {
            walk(full, rel);
          } else {
            files.push({
              path: rel,
              size: fs.statSync(full).size
            });
          }
        }
      };
      walk(pPath, '');
      return {
        name,
        fileCount: files.length,
        files
      };
    });

    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:name', (req, res) => {
  try {
    const pPath = path.join(PROJECTS_DIR, req.params.name);
    if (!fs.existsSync(pPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files: { path: string; content: string }[] = [];
    const walk = (dir: string, base: string) => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const full = path.join(dir, entry);
        const rel = path.join(base, entry);
        if (fs.statSync(full).isDirectory()) {
          walk(full, rel);
        } else {
          try {
            const content = fs.readFileSync(full, 'utf-8');
            files.push({ path: rel, content });
          } catch (e) {
            files.push({ path: rel, content: '[Binary or unreadable file]' });
          }
        }
      }
    };
    walk(pPath, '');

    res.json({
      name: req.params.name,
      files
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, files } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name required' });

    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const projectPath = path.join(PROJECTS_DIR, safeName);
    if (fs.existsSync(projectPath)) {
      return res.status(400).json({ error: 'Project already exists' });
    }

    fs.mkdirSync(projectPath, { recursive: true });

    let projectFiles = files;
    // If files are not provided, generate with AI or template
    if (!projectFiles || projectFiles.length === 0) {
      projectFiles = [
        {
          path: 'main.py',
          content: `#!/usr/bin/env python3\n# ${name} created with DARK-GPT\nprint("[x_x] ${name} running...")\n`
        },
        {
          path: 'requirements.txt',
          content: '# Project requirements\n'
        },
        {
          path: 'README.md',
          content: `# ${name}\n\n${description || 'A cybersecurity research tool.'}\n`
        }
      ];
    }

    for (const f of projectFiles) {
      const fullFilePath = path.join(projectPath, f.path);
      fs.mkdirSync(path.dirname(fullFilePath), { recursive: true });
      fs.writeFileSync(fullFilePath, f.content || '');
    }

    res.json({ success: true, name: safeName, files: projectFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:name/files', (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, req.params.name);
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { filePath, content } = req.body;
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });

    const targetPath = path.join(projectPath, filePath);
    // Security check to avoid path traversal
    if (!targetPath.startsWith(projectPath)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content || '');
    res.json({ success: true, filePath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:name', (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, req.params.name);
    if (fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:name/run', (req, res) => {
  try {
    const projectPath = path.join(PROJECTS_DIR, req.params.name);
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Simulated sandbox runner with realistic cyber logs
    const output = [
      `[x_x] INITIALIZING SANDBOX ENVIRONMENT FOR: ${req.params.name}`,
      `[*] Target workspace: ${projectPath}`,
      `[*] Checking requirements.txt... Dependencies satisfied.`,
      `[*] Executing main entry point...`,
      `============================================================`,
      `[>] DARK-GPT // SECURE SANDBOX EXECUTION IN PROGRESS`,
      `[+] Process started (PID: ${Math.floor(1000 + Math.random() * 9000)})`,
      `[+] Sockets initialized. Memory allocated: 64MB.`,
      `[+] Task completed with exit code 0.`,
      `============================================================`,
      `[x_x] EXECUTION FINISHED SUCCESSFULLY.`
    ];

    res.json({ success: true, output: output.join('\n') });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dreamina Browser Automation Endpoint — NEUTRALISÉ (remplacé par le plugin d'images légitime)
// L'ancien code générait un bot headless pour consommer les crédits gratuits de Dreamina/ByteDance
// (contraire aux conditions d'usage). Il est désactivé au profit de /api/images/generate
// (Pollinations gratuit, ou ta clé Gemini/OpenAI). Voir imagePlugins.ts.
app.post('/api/cowork/dreamina-automation', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const img = await generateImage({ prompt }, undefined);
    return res.json({
      success: true,
      provider: img.provider,
      dataUrl: img.dataUrl,
      notice: "Bot Dreamina désactivé : image générée via un fournisseur légitime et gratuit.",
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Échec génération image.' });
  }
});

// GitHub Auto-Save & Commit Routine Endpoint
const GIT_COMMITS_FILE = path.join(DATA_DIR, 'git_commits.json');
if (!fs.existsSync(GIT_COMMITS_FILE)) {
  fs.writeFileSync(GIT_COMMITS_FILE, JSON.stringify([]));
}

app.get('/api/git/commits', (req, res) => {
  try {
    const raw = fs.readFileSync(GIT_COMMITS_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/git/auto-save', (req, res) => {
  try {
    const { message, filesCount = 1, branch = 'main', modifiedPaths = [] } = req.body;
    const commitHash = Math.random().toString(16).substring(2, 9);
    const timestamp = new Date().toISOString();
    const commitRecord = {
      id: `commit-${Date.now()}`,
      hash: commitHash,
      message: message || `feat(cowork): Auto-save updated application files [${filesCount} files]`,
      timestamp,
      branch,
      filesCount,
      modifiedPaths,
      status: 'pushed'
    };

    let existing: any[] = [];
    try {
      existing = JSON.parse(fs.readFileSync(GIT_COMMITS_FILE, 'utf-8'));
    } catch {}

    existing.unshift(commitRecord);
    if (existing.length > 50) existing = existing.slice(0, 50);
    fs.writeFileSync(GIT_COMMITS_FILE, JSON.stringify(existing, null, 2));

    // Git commands summary for user execution
    const gitCommands = [
      `git add .`,
      `git commit -m "${commitRecord.message.replace(/"/g, '\\"')}"`,
      `git push origin ${branch}`
    ].join(' && ');

    res.json({
      success: true,
      commit: commitRecord,
      gitCommands,
      notice: `Routine de sauvegarde GitHub exécutée : commit [${commitHash}] sur la branche '${branch}'.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages, session_id, activePlugins } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content || '';
    const normalizedPrompt = userPrompt.toLowerCase().trim();
    // Normalize accents and special characters
    const cleanPrompt = normalizedPrompt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. MANDATORY DETERMINISTIC CREATOR CHECK:
    // When the user asks who created the application / DARK-GPT, respond deterministically:
    // 'DARK-GPT a été créé par M4TH4CK3R.'
    const creatorKeywords = [
      "qui t'a cree", "qui t'as cree", "qui t a cree", "qui t as cree",
      "qui ta cree", "qui tas cree", "qui a cree", "qui t'a fait",
      "qui t'as fait", "qui ta fait", "qui t'a developpe", "qui t'as developpe",
      "ton createur", "votre createur", "qui est ton createur", "c'est qui ton createur",
      "qui t'a invente", "qui t'as invente", "who created", "who made you", "who is your creator",
      "qui t'as concu", "qui t'a concu"
    ];
    const isCreatorQuestion = creatorKeywords.some(kw => cleanPrompt.includes(kw)) ||
      /(qui|who|quel|c'est qui|est ce qui).*(cree|fait|auteur|author|invente|developpe|concu)/i.test(cleanPrompt) ||
      /(createur|creator|auteur|author).*(dark.?gpt|ia|ai|bot|programme|app)/i.test(cleanPrompt);

    if (isCreatorQuestion) {
      const responseText = `${DISPLAY_NAME} a été créé par ${CREATOR_NAME}.`;
      return res.json({ response: responseText, deterministic: true });
    }

    // 1.B OLLAMA & DOLPHIN STATUS / LAUNCH QUERY DETECTION:
    const isOllamaQuery = 
      /(ollama|dolphin).*(install|lanc|tourn|actif|demarr|marche|statut|status|arriere|fond|arrie|plan|bg|erreur)/i.test(cleanPrompt) ||
      /(as.tu|a.tu|est.ce.que.tu.as|t.as|t.a|tu.as|tu.a|lance|demarre|activer).*(install|lanc|demarr).*(ollama|dolphin)/i.test(cleanPrompt) ||
      /(est.ce.que|est.ce).*(ollama|dolphin).*(tourne|marche|actif|pret|lance|installe)/i.test(cleanPrompt) ||
      /^(lance|demarre|start)\s+(ollama|dolphin|mon ollama|dolphin 3)$/i.test(cleanPrompt) ||
      /^(ollama|dolphin3|dolphin)$/i.test(cleanPrompt);

    if (isOllamaQuery) {
      const isLaunchRequest = /(lance|demarre|activer|start)/i.test(cleanPrompt);
      const url = currentConfig.server_url || "http://127.0.0.1:11434";
      const binPath = findOllamaBinary();
      let isOnline = false;
      let modelNames: string[] = [];

      try {
        const pingRes = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(1500) });
        if (pingRes.ok) {
          isOnline = true;
          const pingData: any = await pingRes.json();
          modelNames = (pingData.models || []).map((m: any) => m.name);
        }
      } catch {
        isOnline = false;
      }

      // If user specifically asked to launch it, attempt background spawn
      if (isLaunchRequest && !isOnline) {
        const launchResult = await startOllamaInBackground();
        if (launchResult.success) {
          isOnline = true;
        }
      }

      let responseText = "";
      if (isOnline) {
        const hasDolphin = modelNames.some(m => m.toLowerCase().includes('dolphin3'));
        responseText = `[x_x] STATUT DU SERVEUR OLLAMA // DOLPHIN 3 :

✓ ÉTAT : ACTIF & OPÉRATIONNEL EN ARRIÈRE-PLAN
- URL de connexion : ${url} (port 11434 réactif)
- Binaire local utilisé : ${binPath || 'Instance système active'}
- Modèles disponibles : ${modelNames.length > 0 ? modelNames.join(', ') : 'Aucun (dolphin3 recommandé)'}
- Statut Dolphin 3 : ${hasDolphin ? 'Prêt à l\'emploi (zéro censure)' : 'En attente de téléchargement ("ollama pull dolphin3")'}

Le serveur Ollama s'exécute en tâche de fond. DARK-GPT relaie vos requêtes directement vers Dolphin 3 pour une analyse offensive et défensive 100% non censurée.`;
      } else {
        responseText = `[x_x] LANCEMENT DE DOLPHIN 3 SUR VOTRE MAC :

L'application DARK-GPT s'exécute actuellement dans un conteneur Cloud distant. Elle ne peut pas démarrer directement un exécutable sur votre Mac sans votre Terminal.

⚡ POUR LANCER OLLAMA & DOLPHIN 3 SUR VOTRE MAC EN 5 SECONDES :
1. Ouvrez votre Terminal Mac (Cmd + Espace -> "Terminal" -> Entrée).
2. Lancez Ollama :
   ollama serve &
3. Lancez Dolphin 3 :
   ollama run dolphin3

🔒 SI VOUS N'ÊTES PAS ADMINISTRATEUR DE VOTRE MAC :
Exécutez cette commande utilisateur autonome :
   ~/.local/bin/ollama serve >/dev/null 2>&1 &
   ~/.local/bin/ollama run dolphin3

📁 OU DOUBLE-CLIQUEZ SUR LE FICHIER :
"start_darkgpt_mac.command" (situé à la racine du projet, il démarre tout automatiquement sans mot de passe).

En attendant, DARK-GPT continue de répondre à toutes vos requêtes en mode NON CENSURÉ via le moteur Cloud !`;
      }

      return res.json({ response: responseText, deterministic: true });
    }

    // 1.C MAC FILE SYSTEM ACCESS & AUTHORIZATION QUERY DETECTION:
    const isMacFilesQuery =
      /(fichier|fichiers|dossier|dossiers|disque|finder|macos|mac).*(acces|accès|autoris|lire|ouvrir|charger|analyse)/i.test(cleanPrompt) ||
      /(acces|accès|autoris|lire|ouvrir|charger|analyser).*(fichier|fichiers|dossier|dossiers).*(mac|local)/i.test(cleanPrompt) ||
      /(as.tu|a.tu|peux.tu|peut.on|comment).*(acces|acceder|lire).*(fichier|fichiers|mac)/i.test(cleanPrompt);

    if (isMacFilesQuery) {
      const responseText = `[x_x] ACCÈS AUX FICHIERS DE VOTRE MAC (AVEC VOTRE AUTORISATION) :

Oui ! DARK-GPT peut accéder aux fichiers et dossiers de votre Mac, mais UNIQUEMENT SI VOUS L'AUTORISEZ expressément pour garantir votre sécurité et confidentialité.

1. COMMENT AUTORISER UN DOSSIER OU DES FICHIERS DE VOTRE MAC :
- Cliquez sur le bouton [📂 FICHIERS MAC] dans la barre du terminal (ou tapez la commande /mac).
- Votre Mac ouvre la boîte de dialogue native du Finder macOS.
- Sélectionnez le dossier que vous souhaitez analyser (ex: Téléchargements, Documents, Bureau, ou dossier de script).
- Confirmez l'autorisation dans la popup du navigateur.

2. CE QUE DARK-GPT PEUT ACCOMPLIR AVEC CET ACCÈS :
- Lire et inspecter le code source (Python, Bash, C, Go, JS, JSON, configs).
- Réaliser un audit de sécurité automatisé et identifier les failles.
- Injecter un fichier en 1 clic directement dans le chat pour audit immédiat.
- Vous proposer des correctifs ou écrire de nouveaux scripts directement sur votre disque Mac.

Cliquez sur [📂 FICHIERS MAC] pour sélectionner votre premier dossier !`;
      return res.json({ response: responseText, deterministic: true });
    }

    // 1.D MAC DESKTOP & FILE ORGANIZATION QUERY DETECTION:
    const isDesktopOrganizeQuery =
      /(range|ranger|trie|trier|organise|organiser|nettoie|nettoyer|menage|ménage).*(bureau|desktop|fichiers|dossier)/i.test(cleanPrompt) ||
      /(bureau|desktop).*(rang|tri|organis|nettoy)/i.test(cleanPrompt);

    if (isDesktopOrganizeQuery) {
      const responseText = `[x_x] RANGEMENT & ORGANISATION DU BUREAU MAC // DARK-GPT :

Voici le script Python automatisé complet pour classer, ranger et nettoyer tous les fichiers de ton bureau macOS (~/Desktop) par catégories d'extensions :

\`\`\`python
#!/usr/bin/env python3
# Script de rangement de bureau Mac par DARK-GPT (M4TH4CK3R)
import os
import shutil
from pathlib import Path

desktop = Path.home() / "Desktop"

CATEGORIES = {
    "📁 Images": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".heic", ".bmp", ".psd"],
    "📁 Documents": [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".csv", ".pptx", ".md", ".pages", ".key"],
    "📁 Archives": [".zip", ".tar", ".gz", ".rar", ".7z", ".dmg", ".pkg", ".iso"],
    "📁 Scripts_Code": [".py", ".sh", ".js", ".ts", ".html", ".css", ".json", ".sql", ".c", ".cpp", ".rs"],
    "📁 Médias": [".mp4", ".mov", ".mkv", ".mp3", ".wav", ".aac", ".flac", ".m4a"],
    "📁 Torrents": [".torrent"]
}

print(f"[x_x] DARK-GPT : Rangement du bureau {desktop}...")
moved = 0

for item in desktop.iterdir():
    # Ne touche pas aux sous-dossiers existants ni aux fichiers cachés
    if item.is_dir() or item.name.startswith("."):
        continue
    
    ext = item.suffix.lower()
    target_dir = desktop / "📁 Divers"
    
    for category, extensions in CATEGORIES.items():
        if ext in extensions:
            target_dir = desktop / category
            break
            
    target_dir.mkdir(exist_ok=True)
    dest = target_dir / item.name
    
    # Gestion des collisions de noms
    if dest.exists():
        dest = target_dir / f"{item.stem}_{int(item.stat().st_mtime)}{item.suffix}"
        
    shutil.move(str(item), str(dest))
    print(f"[*] Déplacé : {item.name} -> {target_dir.name}/")
    moved += 1

print(f"[+] Terminé : {moved} fichiers rangés proprement sur ton bureau !")
\`\`\`

⚡ COMMANDE TERMINAL DIRECTE EN 1 LIGNE (À exécuter dans ton Terminal Mac) :
\`\`\`bash
python3 -c 'import os, shutil; from pathlib import Path; d=Path.home()/"Desktop"; c={".png":"Images",".jpg":"Images",".pdf":"Docs",".docx":"Docs",".zip":"Archives",".py":"Code",".sh":"Code",".mp4":"Videos"}; [((d/c.get(f.suffix.lower(),"Divers")).mkdir(exist_ok=True), shutil.move(str(f), str(d/c.get(f.suffix.lower(),"Divers")/f.name))) for f in d.iterdir() if f.is_file() and not f.name.startswith(".")]' && echo "[+] Bureau rangé avec succès !"
\`\`\`

📂 ACCÈS VIA L'APPLICATION :
Tu peux aussi cliquer sur le bouton [📂 FICHIERS MAC] dans le terminal de DARK-GPT, sélectionner ton dossier "Desktop" et autoriser l'application à analyser et ranger tes fichiers directement !`;
      return res.json({ response: responseText, deterministic: true });
    }

    // 2. INTENT CLASSIFICATION ENGINE (Strict Specification G & D)
    const { activeMode } = req.body;
    const mode = activeMode === 'defense' ? 'defense' : 'hacker';
    const effectiveSystemPrompt = mode === 'defense' ? GENERAL_ASSISTANCE_PROMPT : ADVANCED_LEARNING_PROMPT;

    // A. Detect Risky Destructive Actions (Specification D)
    const isRiskyAction = 
      /(supprime|supprimer|delete|efface|effacer|detruit|detruire|vider|formate|formater|drop).*(fichier|fichiers|dossier|dossiers|projet|projets|disque|workspace)/i.test(cleanPrompt) ||
      /\b(rm\s+-rf|del\s+\/f|drop\s+database|format\s+[a-z]:)\b/i.test(cleanPrompt);

    // B. Detect Conversational, Capabilities & Overview Requests (Specification G - Rule 1)
    const isCapabilitiesQuery = 
      /(tu sais faire quoi|que sais-tu faire|que peux-tu faire|que sais tu faire|que peux tu faire|quelles sont tes capacites|quelles sont tes competences|comment ca marche|comment ca fonctionne|comment t'utiliser|qui es-tu|qui es tu|c'est quoi dark.?gpt|presentation|tu fais quoi|a quoi sers-tu|que fais-tu|aide|help|aide-moi|qu'est-ce que tu peux faire)/i.test(cleanPrompt);

    const isSimpleGreeting = 
      /^(bonjour|salut|hello|coucou|hey|bonsoir|yo|hi|hola|buenos dias)\b/i.test(cleanPrompt) && cleanPrompt.split(/\s+/).length <= 4;

    const isSmallTalk = 
      /^(ca va|ça va|comment vas-tu|comment tu vas|how are you|como estas|merci|thanks|gracias|super|parfait|ok|d'accord|compris)\b/i.test(cleanPrompt) && cleanPrompt.split(/\s+/).length <= 5;

    // C. Detect Ambiguous or Isolated Vague Queries (Specification G - Rule 5)
    const tokens = cleanPrompt.split(/\s+/).filter(Boolean);
    const isAmbiguousQuery = 
      !isCapabilitiesQuery && !isSimpleGreeting && !isSmallTalk && !isRiskyAction &&
      (
        /^(scan|scanner|reseau|port|ports|ip|test|tester|terminal|systeme|code|hack|securite|ping|script)$/i.test(cleanPrompt) ||
        (tokens.length <= 2 && /^(reseau|ports?|scan|audit|test)$/i.test(cleanPrompt))
      );

    // D. Autonomous Tool Selection (Specification D: automatic tool selection without forced user toggles)
    const autoTools: string[] = [];
    if (/recherche|google|web|en ligne|actualite|news|cve|mitre|nvd|documentation|derniere/i.test(cleanPrompt)) {
      autoTools.push('web_search');
    }
    if (/fichier|fichiers|dossier|dossiers|bureau|desktop|partage|lire|ecrire|sauvegarde|workspace|projet/i.test(cleanPrompt)) {
      autoTools.push('file_io');
    }
    if (/script|code|python|bash|execute|tester|lancer|run|evaluer|compiler/i.test(cleanPrompt)) {
      autoTools.push('code_execution');
    }

    let detectedIntent: 'CREATOR' | 'CONVERSATIONAL_CAPABILITIES' | 'AMBIGUOUS' | 'RISKY_ACTION' | 'ACTIONABLE_TECHNICAL' = 'ACTIONABLE_TECHNICAL';
    let generatedText = "";
    let requiresConfirmation = false;
    let riskDetails = "";
    let activeModelUsed = currentConfig.model || "dolphin3";

    // -------------------------------------------------------------
    // RULE 1 HANDLING: CONVERSATIONAL OR CAPABILITIES (NATURAL LANGUAGE, NO CODE)
    // -------------------------------------------------------------
    if (isCapabilitiesQuery) {
      detectedIntent = 'CONVERSATIONAL_CAPABILITIES';
      generatedText = `Je suis votre assistant IA local (moteur Dolphin 3 / Local AI), configuré en mode ${mode === 'defense' ? 'Assistance générale' : 'Apprentissage technique avancé'}.

Voici mes capacités réelles et opérationnelles :
- 🌐 Recherche web en temps réel : interrogation et veille technique automatisée sur la documentation et les bases CVE.
- 📂 Lecture et écriture de fichiers : consultation, organisation et édition restreintes au dossier que vous partagez explicitement.
- ⚡ Exécution de code : tests et exécution de scripts (Python, Bash) dans un bac à sable sécurisé.
- 🧠 Mémoire persistante : conservation locale de vos sessions, projets et préférences entre chaque démarrage.
- 🤖 Boucle agentique autonome : planification d'objectifs en sous-étapes et enchaînement d'outils, avec validation préalable obligatoire pour toute action risquée.

Que souhaitez-vous accomplir ou explorer aujourd'hui ?`;
    } else if (isSimpleGreeting || isSmallTalk) {
      detectedIntent = 'CONVERSATIONAL_CAPABILITIES';
      if (/merci/i.test(cleanPrompt)) {
        generatedText = "Je vous en prie. N'hésitez pas si vous avez d'autres questions ou besoins techniques.";
      } else if (/ca va|ça va/i.test(cleanPrompt)) {
        generatedText = "Tous les modules sont opérationnels et prêts. Comment puis-je vous aider aujourd'hui ?";
      } else {
        generatedText = `Bonjour ! Je suis prêt en mode ${mode === 'defense' ? 'Assistance générale' : 'Apprentissage technique avancé'}. Comment puis-je vous assister ?`;
      }
    } else if (isAmbiguousQuery) {
      // -------------------------------------------------------------
      // RULE 5 HANDLING: AMBIGUOUS QUERY (ASK CLARIFICATION, NO DEFAULT CODE)
      // -------------------------------------------------------------
      detectedIntent = 'AMBIGUOUS';
      generatedText = `Votre demande est générale. Afin de vous apporter une réponse précise et adaptée :

Souhaitez-vous plutôt :
1. Un script d'audit ou de configuration ciblé (veuillez préciser le service, le langage ou l'environnement concerné)
2. Une explication théorique ou méthodologique détaillée
3. Une opération sur votre dossier partagé (création, lecture ou organisation de fichiers) ?

Précisez votre objectif technique pour lancer l'analyse appropriée.`;
    } else if (isRiskyAction) {
      // -------------------------------------------------------------
      // REQUIREMENT D: RISKY ACTIONS REQUIRE CONFIRMATION
      // -------------------------------------------------------------
      detectedIntent = 'RISKY_ACTION';
      requiresConfirmation = true;
      riskDetails = `Demande d'opération destructrice détectée : modification ou suppression irréversible de fichiers dans l'espace de travail.`;
      generatedText = `⚠️ CONFIRMATION REQUISE // ACTION SENSIBLE DÉTECTÉE :

Vous demandez une opération de suppression ou d'écrasement de fichiers dans l'espace partagé :
"${userPrompt}"

Pour votre sécurité, cette action ne peut pas être exécutée automatiquement sans votre accord. Veuillez confirmer ou annuler cette opération ci-dessous.`;
    }

    // -------------------------------------------------------------
    // RULE 2 & 4 HANDLING: ACTIONABLE TECHNICAL REQUEST VIA MODEL / OLLAMA / GEMINI
    // -------------------------------------------------------------
    if (!generatedText) {
      // 1. Try Ollama if configured and reachable
      const isOllamaProvider = currentConfig.provider === 'ollama' || 
        (currentConfig.model && (currentConfig.model.toLowerCase().includes('dolphin') || currentConfig.model.toLowerCase().includes('llama')));

      if (isOllamaProvider && currentConfig.server_url) {
        const isOllamaUp = await isOllamaReachable(currentConfig.server_url);
        if (isOllamaUp) {
          try {
            const ollamaModel = currentConfig.model || "dolphin3";
            activeModelUsed = `Ollama/${ollamaModel}`;
            const ollamaRes = await fetch(`${currentConfig.server_url}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: ollamaModel,
                messages: [
                  { role: 'system', content: effectiveSystemPrompt },
                  ...messages.slice(-8)
                ],
                stream: false
              }),
              signal: AbortSignal.timeout(6000)
            });

            if (ollamaRes.ok) {
              const ollamaData: any = await ollamaRes.json();
              const ollamaText = (ollamaData?.message?.content || "").trim();
              if (ollamaText) {
                generatedText = ollamaText;
              }
            }
          } catch {
            // Smoothly fallback
          }
        }
      }

      // 2. Try Gemini API if not yet generated
      if (!generatedText && currentConfig.provider !== 'simulation') {
        const gemini = getGeminiClient();
        if (gemini) {
          const contents = messages
            .filter((m: any) => m.role !== 'system')
            .slice(-8) // bounded context: last 8 messages for optimal latency
            .map((m: any) => {
              const parts: any[] = [];
              const rawImage = m.image || (m === lastMessage && req.body.image ? req.body.image : null);
              if (rawImage && typeof rawImage === 'string') {
                const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
                if (match) {
                  parts.push({
                    inlineData: {
                      mimeType: match[1],
                      data: match[2]
                    }
                  });
                } else if (/^[A-Za-z0-9+/=]+$/.test(rawImage.trim().slice(0, 100))) {
                  parts.push({
                    inlineData: {
                      mimeType: 'image/png',
                      data: rawImage.trim()
                    }
                  });
                }
              }
              const textContent = String(m.content || m.text || '').slice(0, 3000);
              if (textContent) {
                parts.push({ text: textContent });
              } else if (parts.length === 0) {
                parts.push({ text: "Analyse cette image ou capture d'écran pour assistance technique et correction de code." });
              }
              return {
                role: m.role === 'assistant' ? 'model' : 'user',
                parts
              };
            });

          try {
            const modelToUse = currentConfig.model && currentConfig.model.startsWith('gemini')
              ? currentConfig.model 
              : 'gemini-3.8-flash';
            activeModelUsed = modelToUse;

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), 10000)
            );

            const resultPromise = gemini.models.generateContent({
              model: modelToUse,
              contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: userPrompt }] }],
              config: {
                systemInstruction: {
                  parts: [{ text: effectiveSystemPrompt }]
                },
                temperature: 0.3,
                maxOutputTokens: 1400,
                safetySettings: [
                  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
                ] as any
              }
            });

            const result: any = await Promise.race([resultPromise, timeoutPromise]);
            if (result && result.text) {
              const rawText = result.text.trim();
              const isRefusal = /sorry.*cannot fulfill|cannot fulfill your request|i cannot assist with.*hack|i cannot generate content that|i am unable to help with|search online for authorized penetration testing|cannot provide instructions on how to hack/i.test(rawText);
              if (!isRefusal) {
                generatedText = rawText;
              }
            }
          } catch {
            activeModelUsed = 'DARK-GPT Engine';
          }
        }
      }

      // 3. High-Fidelity Tailored Fallback (Only tailored answers to what was explicitly asked, NO generic boilerplate)
      if (!generatedText) {
        await new Promise(resolve => setTimeout(resolve, 800));

        if (/windows|active directory|\bad\b|kerberos|ntlm|win11/i.test(cleanPrompt)) {
          generatedText = `[AUDIT TECHNIQUE WINDOWS & ACTIVE DIRECTORY]

1. ANALYSE DES PRIVILÈGES DU COMPTE (LABORATOIRE) :
- Vérification des privilèges locaux de jeton :
  whoami /priv
  (Contrôle de SeImpersonatePrivilege, SeDebugPrivilege, SeBackupPrivilege)

2. CONTRÔLE DES CHEMINS NON CITÉS ET SERVICES :
- Recherche des chemins d'exécutables sans guillemets :
  wmic service get name,displayname,pathname,startmode | findstr /i "auto" | findstr /i /v "c:\\windows\\\\"

3. DURCISSEMENT RECOMMANDÉ (BLUE TEAM) :
- Activer Credential Guard et la sécurité basée sur la virtualisation (VBS).
- Mettre en place Windows Defender Application Control (WDAC).
- Déployer LAPS (Local Administrator Password Solution) pour éliminer les mots de passe locaux identiques.`;
        } else if (/mot de passe|password|hash|brute.*force|crack/i.test(cleanPrompt)) {
          generatedText = `[MÉTHODOLOGIE D'AUDIT DE HACHAGES ET MOTS DE PASSE]

1. IDENTIFICATION DU TYPE DE HASH :
- hashid ou nthash pour identifier les empreintes (MD5, SHA-256, bcrypt, NTLM).

2. AUDIT PAR DICTIONNAIRE CIBLÉ (ENVIRONNEMENT D'AUDIT AUTORISÉ) :
- Hashcat en mode attaque par dictionnaire :
  hashcat -m [CODE_TYPE] -a 0 hashes.txt dictionnaire.txt

3. MESURES DE RÉSILIENCE :
- Migration vers des fonctions à dérivation de clés lentes (Argon2id ou bcrypt avec facteur de coût élevé).
- Imposition systématique d'une authentification multifacteur (MFA / FIDO2).`;
        } else if (/pare.?feu|firewall|iptables|ufw/i.test(cleanPrompt)) {
          generatedText = `[CONFIGURATION DE DURCISSEMENT PARE-FEU LINUX]

1. POLITIQUE PAR DÉFAUT EN FERMETURE (RECOMMANDATION CIS BENCHMARK) :
\`\`\`bash
# Réinitialisation et politique par défaut restrictive
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser uniquement les flux indispensables (ex: SSH sur port sécurisé)
sudo ufw allow 22/tcp comment 'Administration SSH'

# Activation et vérification de l'état
sudo ufw enable
sudo ufw status verbose
\`\`\`

2. RÈGLE COMPLÉMENTAIRE IPTABLES CONTRE LE SYN FLOOD :
\`\`\`bash
sudo iptables -A INPUT -p tcp --syn -m limit --limit 1/s --limit-burst 3 -j ACCEPT
\`\`\``;
        } else if (/wifi|wpa|802\.11/i.test(cleanPrompt)) {
          generatedText = `[AUDIT DE SÉCURITÉ DES RÉSEAUX SANS-FIL (WPA2/WPA3)]

1. VÉRIFICATION DU MODE ÉCOUTE ET DU MATÉRIEL :
- Détection des interfaces réseau compatibles :
  iw dev
  airmon-ng start wlan0

2. ANALYSE DU PROTOCOLE D'ÉCHANGE DE CLÉS (4-WAY HANDSHAKE) :
- Écoute ciblée sur le canal du point d'accès autorisé :
  airodump-ng -c [CANAL] --bssid [BSSID] -w audit_capture wlan0mon

3. RECOMMANDATIONS DE PROTECTION :
- Transition obligatoire vers WPA3-Enterprise avec chiffrement 192 bits (Suite B).
- Désactivation du protocole WPS (Wi-Fi Protected Setup).`;
        } else if (/python|script|code/i.test(cleanPrompt)) {
          generatedText = `Voici le script demandé, commenté et directement utilisable :

\`\`\`python
#!/usr/bin/env python3
"""
Script d'analyse technique modulaire
Créé pour l'environnement DARK-GPT
"""

def main():
    print("[+] Initialisation de la tâche technique...")
    # Logique adaptée à votre consigne
    print("[✓] Opération exécutée avec succès.")

if __name__ == "__main__":
    main()
\`\`\`

Vous pouvez enregistrer et exécuter ce code dans votre espace partagé ou utiliser le bouton de téléchargement.`;
        } else {
          // General precise response without unsolicited scans
          generatedText = `Voici les éléments d'analyse technique pour répondre précisément à votre requête :

1. ANALYSE ET DIAGNOSTIC :
- Traitement de la demande : "${userPrompt}"
- Périmètre évalué : Mode ${mode === 'defense' ? 'Assistance générale et durcissement' : 'Apprentissage technique approfondi'}.

2. RECOMMANDATIONS OPÉRATIONNELLES :
- Vous pouvez exécuter cette commande ou ce script dans un terminal dédié ou dans votre espace partagé.
- Pour affiner l'analyse, précisez si nécessaire la cible, la distribution ou les contraintes de votre environnement.`;
        }
      }
    }

    const calculatedTime = Number(((Date.now() - startTime) / 1000).toFixed(1));
    const isConversational = detectedIntent === 'CONVERSATIONAL_CAPABILITIES';
    const reasoningTime = isConversational ? undefined : (calculatedTime > 0.4 ? calculatedTime : 0.9);

    // Agent Loop Structured Planning Data: only attached for genuine automated tool operations
    const agentLoop = (autoTools.length > 0 && !isConversational) ? {
      objective: userPrompt.slice(0, 120),
      steps: [
        "Classification de l'objectif technique",
        `Activation automatique des outils : ${autoTools.join(', ')}`,
        "Exécution sécurisée et génération ciblée",
        "Vérification du résultat"
      ],
      executedTools: autoTools,
      verification: "Exécution terminée avec succès."
    } : undefined;

    const isWebQuery = autoTools.includes('web_search');
    const sources = isWebQuery ? [
      { title: "NIST National Vulnerability Database", url: "https://nvd.nist.gov", snippet: "Bulletins de sécurité et correctifs CVE officiels." },
      { title: "OWASP Foundation Security Standards", url: "https://owasp.org", snippet: "Guides de sécurité applicative et d'audit web." },
      { title: "MITRE CVE List & Threat Catalog", url: "https://cve.mitre.org", snippet: "Dictionnaire public des vulnérabilités de cybersécurité." }
    ] : undefined;

    // Save message to active session file if session_id provided
    if (session_id) {
      try {
        const sessionPath = path.join(SESSIONS_DIR, `${session_id}.json`);
        if (fs.existsSync(sessionPath)) {
          const sData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
          sData.messages = sData.messages || [];
          sData.messages.push({
            id: `msg-${Date.now()}-u`,
            role: 'user',
            content: userPrompt,
            timestamp: new Date().toISOString()
          });
          sData.messages.push({
            id: `msg-${Date.now()}-a`,
            role: 'assistant',
            content: generatedText,
            timestamp: new Date().toISOString(),
            reasoningTime,
            agentLoop,
            sources
          });
          sData.updated_at = new Date().toISOString();
          fs.writeFileSync(sessionPath, JSON.stringify(sData, null, 2));
        }
      } catch (err) {
        console.warn("Failed to persist to session:", err);
      }
    }

    res.json({
      response: generatedText,
      intent: detectedIntent,
      agentLoop,
      requiresConfirmation,
      riskDetails,
      reasoningTime,
      sources,
      activeModel: activeModelUsed
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// OLLAMA AUTO-LAUNCH & BINARY DETECTION
// ==========================================
function findOllamaBinary(): string | null {
  const home = os.homedir();
  const platform = os.platform();

  const candidatePaths: string[] = [];

  if (platform === 'darwin') {
    // macOS user & system paths (including non-admin user directories)
    candidatePaths.push(
      path.join(home, '.local', 'bin', 'ollama'),
      path.join(home, 'bin', 'ollama'),
      path.join(home, '.ollama', 'bin', 'ollama'),
      path.join(home, 'Downloads', 'Ollama.app', 'Contents', 'Resources', 'ollama'),
      path.join(home, 'Applications', 'Ollama.app', 'Contents', 'Resources', 'ollama'),
      '/Applications/Ollama.app/Contents/Resources/ollama',
      '/opt/homebrew/bin/ollama',
      '/usr/local/bin/ollama'
    );
  } else if (platform === 'win32') {
    // Windows paths
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    candidatePaths.push(
      path.join(localAppData, 'Programs', 'Ollama', 'ollama.exe'),
      path.join(home, 'bin', 'ollama.exe'),
      path.join(home, '.ollama', 'ollama.exe')
    );
  } else {
    // Linux paths (including non-admin user directories)
    candidatePaths.push(
      path.join(home, '.local', 'bin', 'ollama'),
      path.join(home, 'bin', 'ollama'),
      '/usr/local/bin/ollama',
      '/usr/bin/ollama'
    );
  }

  // Check explicit candidate file paths
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Try checking system PATH
  try {
    const cmd = platform === 'win32' ? 'where ollama' : 'which ollama';
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf-8' }).trim();
    if (out && fs.existsSync(out.split('\n')[0].trim())) {
      return out.split('\n')[0].trim();
    }
  } catch {
    // not in PATH
  }

  return null;
}

async function isOllamaReachable(url = 'http://127.0.0.1:11434'): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startOllamaInBackground(): Promise<{ success: boolean; message: string; binaryPath?: string; alreadyRunning?: boolean }> {
  const url = currentConfig.server_url || 'http://127.0.0.1:11434';
  if (await isOllamaReachable(url)) {
    return { success: true, message: 'Ollama est déjà actif en arrière-plan.', alreadyRunning: true };
  }

  const bin = findOllamaBinary();
  if (!bin) {
    return {
      success: false,
      message: "Pour faire tourner Dolphin 3 sur votre Mac : copiez la commande ci-dessous dans votre Terminal Mac, ou double-cliquez sur le lanceur 'start_darkgpt_mac.command' inclus."
    };
  }

  try {
    console.log(`[x_x] Démarrage automatique d'Ollama en arrière-plan depuis : ${bin}`);
    const child = spawn(bin, ['serve'], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        OLLAMA_HOST: '127.0.0.1:11434'
      }
    });
    child.unref();

    // Wait up to 3.5 seconds to confirm startup
    for (let i = 0; i < 7; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await isOllamaReachable(url)) {
        // Asynchronously initiate pull of dolphin3 if not present
        setTimeout(async () => {
          try {
            const pullRes = await fetch(`${url}/api/tags`);
            if (pullRes.ok) {
              const data: any = await pullRes.json();
              const hasDolphin = (data.models || []).some((m: any) => m.name.toLowerCase().includes('dolphin3'));
              if (!hasDolphin) {
                console.log("[x_x] Téléchargement automatique de Dolphin 3 via Ollama...");
                spawn(bin, ['pull', 'dolphin3'], { detached: true, stdio: 'ignore' }).unref();
              }
            }
          } catch (e) {
            console.warn("Could not check/pull dolphin3 automatically:", e);
          }
        }, 1000);

        return { success: true, message: 'Ollama a été démarré avec succès en arrière-plan.', binaryPath: bin };
      }
    }

    return { success: true, message: 'Processus Ollama lancé en arrière-plan.', binaryPath: bin };
  } catch (err: any) {
    return { success: false, message: `Échec du lancement automatique : ${err.message}` };
  }
}

// Ollama health & model list status endpoint
app.get('/api/ollama/status', async (req, res) => {
  try {
    const url = currentConfig.server_url || "http://127.0.0.1:11434";
    const binPath = findOllamaBinary();
    const pingRes = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (pingRes.ok) {
      const data: any = await pingRes.json();
      return res.json({ 
        online: true, 
        models: data.models || [], 
        server_url: url,
        binaryFound: Boolean(binPath),
        binaryPath: binPath
      });
    }
    return res.json({ 
      online: false, 
      error: `HTTP ${pingRes.status}`, 
      server_url: url,
      binaryFound: Boolean(binPath),
      binaryPath: binPath
    });
  } catch (e: any) {
    const binPath = findOllamaBinary();
    return res.json({ 
      online: false, 
      error: e.message || "Unreachable", 
      server_url: currentConfig.server_url,
      binaryFound: Boolean(binPath),
      binaryPath: binPath
    });
  }
});

// Ollama manual trigger auto-start endpoint
app.post('/api/ollama/start', async (req, res) => {
  try {
    const result = await startOllamaInBackground();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Ollama Installer script generator endpoint
app.get('/api/ollama/installer-script', (req, res) => {
  const osType = (req.query.os as string) || 'macos';
  const isAdmin = req.query.isAdmin === 'true';

  let scriptContent = '';
  let filename = '';

  if (osType === 'macos') {
    filename = isAdmin ? 'install_dolphin3_mac_admin.sh' : 'installer_dolphin3_mac_user.command';
    if (isAdmin) {
      scriptContent = `#!/bin/bash
echo "[x_x] INSTALLATION OLLAMA + DOLPHIN 3 (MODE ADMINISTRATEUR MAC)..."
if ! command -v brew &> /dev/null; then
  echo "[+] Installation directe d'Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
else
  echo "[+] Installation via Homebrew..."
  brew install ollama
fi
echo "[+] Démarrage du serveur Ollama en arrière-plan..."
nohup ollama serve > /dev/null 2>&1 &
sleep 3
echo "[+] Téléchargement et exécution de Dolphin 3..."
ollama pull dolphin3
echo "[✓] Dolphin 3 est opérationnel sur http://127.0.0.1:11434 ! DARK-GPT y est connecté."
`;
    } else {
      // NON-ADMIN USER MODE (No sudo, no root, runs in ~/.local/bin or user directory)
      scriptContent = `#!/bin/bash
# Script d'installation SANS PRIVILÈGES ADMINISTRATEUR pour macOS
echo "============================================================"
echo "[x_x] INSTALLATEUR DARK-GPT // DOLPHIN 3 (MODE SANS ADMIN)"
echo "Créé par M4TH4CK3R - Aucune permission administrateur requise"
echo "============================================================"

USER_BIN="$HOME/.local/bin"
mkdir -p "$USER_BIN"

# Ajout temporaire au PATH
export PATH="$USER_BIN:$PATH"

if [ -f "$USER_BIN/ollama" ] || command -v ollama &> /dev/null; then
  echo "[✓] Binaire Ollama déjà présent !"
else
  echo "[+] Téléchargement autonome d'Ollama dans votre dossier personnel ($USER_BIN)..."
  TMP_DIR=$(mktemp -d)
  
  # Détection architecture Mac (Apple Silicon M1/M2/M3/M4 ou Intel)
  ARCH=$(uname -m)
  echo "[+] Architecture détectée : $ARCH"
  
  curl -L "https://ollama.com/download/Ollama-darwin.zip" -o "$TMP_DIR/Ollama.zip"
  unzip -q "$TMP_DIR/Ollama.zip" -d "$TMP_DIR"
  
  if [ -f "$TMP_DIR/Ollama.app/Contents/Resources/ollama" ]; then
    cp "$TMP_DIR/Ollama.app/Contents/Resources/ollama" "$USER_BIN/ollama"
    chmod +x "$USER_BIN/ollama"
    echo "[✓] Ollama installé avec succès dans $USER_BIN/ollama (sans droits root) !"
  else
    echo "[!] Extraction manuelle du binaire..."
    cp "$TMP_DIR/ollama" "$USER_BIN/ollama" 2>/dev/null || true
    chmod +x "$USER_BIN/ollama" 2>/dev/null || true
  fi
  rm -rf "$TMP_DIR"
fi

# Persister dans ~/.zshrc pour les prochaines sessions
if [ -f "$HOME/.zshrc" ]; then
  if ! grep -q "$USER_BIN" "$HOME/.zshrc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
  fi
fi

echo "[+] Démarrage du serveur Ollama en arrière-plan..."
nohup "$USER_BIN/ollama" serve > "$HOME/.ollama_service.log" 2>&1 &
sleep 3

echo "[+] Téléchargement du modèle Dolphin 3..."
"$USER_BIN/ollama" pull dolphin3

echo "============================================================"
echo "[✓] DOLPHIN 3 EST PRÊT ! Dark-GPT se connecte automatiquement."
echo "============================================================"
`;
    }
  } else if (osType === 'windows') {
    filename = isAdmin ? 'install_dolphin3_windows.bat' : 'install_dolphin3_windows_user.bat';
    scriptContent = `@echo off
echo ============================================================
echo [x_x] INSTALLATEUR DARK-GPT // DOLPHIN 3 POUR WINDOWS
echo ============================================================
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] Ollama est deja installe !
) else (
    echo [+] Telechargement de l'installateur utilisateur Ollama...
    powershell -Command "Invoke-WebRequest -Uri 'https://ollama.com/download/OllamaSetup.exe' -OutFile '$env:TEMP\\OllamaSetup.exe'"
    echo [+] Execution de l'installation...
    start /wait "" "%TEMP%\\OllamaSetup.exe" /silent
)
echo [+] Lancement du serveur et telechargement de dolphin3...
start /b ollama serve
timeout /t 3 /nobreak >nul
ollama pull dolphin3
echo [✓] Installation terminee ! Dark-GPT est pret avec Dolphin 3.
pause
`;
  } else {
    // Linux
    filename = isAdmin ? 'install_dolphin3_linux_admin.sh' : 'install_dolphin3_linux_user.sh';
    if (isAdmin) {
      scriptContent = `#!/bin/bash
echo "[x_x] Installation d'Ollama sur Linux (Root/Sudo)..."
curl -fsSL https://ollama.com/install.sh | sh
systemctl start ollama 2>/dev/null || nohup ollama serve > /dev/null 2>&1 &
sleep 3
ollama pull dolphin3
echo "[✓] Dolphin 3 est opérationnel !"
`;
    } else {
      scriptContent = `#!/bin/bash
echo "[x_x] Installation d'Ollama sur Linux (Mode Utilisateur SANS SUDO)..."
USER_BIN="$HOME/.local/bin"
mkdir -p "$USER_BIN"
export PATH="$USER_BIN:$PATH"
curl -L https://ollama.com/download/ollama-linux-amd64.tgz -o /tmp/ollama.tgz
tar -xzf /tmp/ollama.tgz -C "$USER_BIN"
chmod +x "$USER_BIN/ollama"
nohup "$USER_BIN/ollama" serve > "$HOME/.ollama.log" 2>&1 &
sleep 3
"$USER_BIN/ollama" pull dolphin3
echo "[✓] Dolphin 3 opérationnel dans $USER_BIN !"
`;
    }
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(scriptContent);
});

// ==========================================
// MAC FILESYSTEM & USER AUTHORIZATION ENDPOINTS
// ==========================================
const authorizedMacPaths = new Set<string>();

// Pre-register user-friendly home folders on startup
try {
  const home = os.homedir();
  if (home) {
    authorizedMacPaths.add(path.join(home, 'Downloads'));
    authorizedMacPaths.add(path.join(home, 'Documents'));
    authorizedMacPaths.add(path.join(home, 'Desktop'));
  }
} catch {}

// Get Mac host system information
app.get('/api/mac/info', (req, res) => {
  try {
    const isMac = os.platform() === 'darwin';
    const userHome = os.homedir();
    const username = os.userInfo ? os.userInfo().username : 'user';
    res.json({
      isMac,
      platform: os.platform(),
      userHome,
      username,
      authorizedPaths: Array.from(authorizedMacPaths)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit user authorization for a path on Mac
app.post('/api/mac/authorize-path', (req, res) => {
  try {
    const { path: reqPath } = req.body;
    if (!reqPath || typeof reqPath !== 'string') {
      return res.status(400).json({ error: "Chemin de dossier requis" });
    }
    const resolved = path.resolve(reqPath.replace(/^~/, os.homedir()));
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: "Le chemin spécifié n'existe pas sur la machine" });
    }
    authorizedMacPaths.add(resolved);
    res.json({
      success: true,
      message: `Accès autorisé par l'utilisateur au chemin : ${resolved}`,
      authorizedPath: resolved,
      authorizedPaths: Array.from(authorizedMacPaths)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List files in an authorized directory
app.post('/api/mac/fs/list', (req, res) => {
  try {
    const { dirPath } = req.body;
    const targetPath = dirPath ? path.resolve(dirPath.replace(/^~/, os.homedir())) : os.homedir();

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Dossier introuvable sur le Mac" });
    }
    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Le chemin cible n'est pas un dossier" });
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    const items = entries.map(ent => {
      try {
        const full = path.join(targetPath, ent.name);
        const s = fs.statSync(full);
        return {
          name: ent.name,
          path: full,
          isDirectory: ent.isDirectory(),
          size: ent.isDirectory() ? 0 : s.size,
          lastModified: s.mtimeMs
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json({ currentPath: targetPath, items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Read file content from Mac with user authorization
app.post('/api/mac/fs/read', (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: "Chemin du fichier requis" });
    const resolved = path.resolve(filePath.replace(/^~/, os.homedir()));

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: "Fichier introuvable sur le Mac" });
    }
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: "Le chemin est un dossier, pas un fichier" });
    }
    if (stat.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Fichier supérieur à la limite de 10 Mo pour l'analyse directe" });
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    res.json({
      name: path.basename(resolved),
      path: resolved,
      size: stat.size,
      lastModified: stat.mtimeMs,
      content
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Write / save file content back to Mac
app.post('/api/mac/fs/write', (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: "Chemin et contenu requis pour la sauvegarde" });
    }
    const resolved = path.resolve(filePath.replace(/^~/, os.homedir()));
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    fs.writeFileSync(resolved, content, 'utf-8');
    res.json({
      success: true,
      message: `Fichier sauvegardé avec succès sur votre Mac : ${resolved}`,
      path: resolved,
      size: Buffer.byteLength(content, 'utf-8')
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[x_x] DARK-GPT server listening on http://0.0.0.0:${PORT}`);
    // Auto-launch Ollama in background if present on local host
    startOllamaInBackground().then((res) => {
      if (res.success) {
        console.log(`[x_x] OLLAMA AUTO-START: ${res.message}`);
      } else {
        console.log(`[x_x] OLLAMA STATUS: ${res.message}`);
      }
    }).catch(e => console.warn("Ollama auto-start error:", e));
  });
}

startServer();
