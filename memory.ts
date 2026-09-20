/**
 * memory.ts — Mémoire persistante (façon Claude), stockée dans le dossier de travail.
 * ---------------------------------------------------------------------------------
 * Les faits que l'IA retient sur l'utilisateur/ses projets sont enregistrés dans
 * ~/Bureau/matheo-ia/.memory/memory.json et réinjectés dans le contexte à chaque échange.
 * Rien n'est envoyé ailleurs : la mémoire reste locale, sur le Mac.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const HOME = process.env.HOME || '.';
const DESKTOP = fs.existsSync(path.join(HOME, 'Desktop')) ? path.join(HOME, 'Desktop') : HOME;
const ROOT = path.resolve(process.env.MATHEO_IA_ROOT || path.join(DESKTOP, 'matheo-ia'));
const MEM_DIR = path.join(ROOT, '.memory');
const MEM_FILE = path.join(MEM_DIR, 'memory.json');

export interface MemoryItem {
  id: string;
  text: string;
  ts: number;
}

function ensure(): void {
  if (!fs.existsSync(MEM_DIR)) fs.mkdirSync(MEM_DIR, { recursive: true });
  if (!fs.existsSync(MEM_FILE)) fs.writeFileSync(MEM_FILE, JSON.stringify({ facts: [] }, null, 2));
}

export function readMemory(): MemoryItem[] {
  try {
    ensure();
    const d = JSON.parse(fs.readFileSync(MEM_FILE, 'utf-8'));
    return Array.isArray(d.facts) ? d.facts : [];
  } catch {
    return [];
  }
}

export function addMemory(text: string): MemoryItem | null {
  const clean = (text || '').trim();
  if (!clean) return null;
  ensure();
  const items = readMemory();
  // Évite les doublons exacts.
  if (items.some((i) => i.text.toLowerCase() === clean.toLowerCase())) {
    return items.find((i) => i.text.toLowerCase() === clean.toLowerCase()) || null;
  }
  const item: MemoryItem = { id: crypto.randomUUID(), text: clean.slice(0, 500), ts: Date.now() };
  items.push(item);
  fs.writeFileSync(MEM_FILE, JSON.stringify({ facts: items.slice(-200) }, null, 2)); // borne à 200
  return item;
}

export function deleteMemory(id: string): boolean {
  ensure();
  const items = readMemory();
  const next = items.filter((i) => i.id !== id);
  fs.writeFileSync(MEM_FILE, JSON.stringify({ facts: next }, null, 2));
  return next.length !== items.length;
}

export function clearMemory(): void {
  ensure();
  fs.writeFileSync(MEM_FILE, JSON.stringify({ facts: [] }, null, 2));
}

/** Bloc de contexte à injecter dans le prompt système. */
export function memoryContext(): string {
  const facts = readMemory();
  if (!facts.length) return '';
  return (
    "MÉMOIRE (ce que tu sais déjà sur l'utilisateur, à prendre en compte) :\n" +
    facts.map((f) => `- ${f.text}`).join('\n')
  );
}

/**
 * Détecte une demande explicite de mémorisation dans un message utilisateur.
 * Ex : "retiens que ...", "souviens-toi que ...", "remember that ...".
 * Renvoie le fait à mémoriser, ou null.
 */
export function extractMemoryRequest(message: string): string | null {
  const m = (message || '').trim();
  const patterns = [
    /(?:retiens|rappelle[- ]toi|souviens[- ]toi|note|m[ée]morise)\s+(?:que|:)?\s*(.+)/i,
    /(?:remember|note|keep in mind)\s+(?:that|:)?\s*(.+)/i,
  ];
  for (const p of patterns) {
    const match = m.match(p);
    if (match && match[1] && match[1].trim().length > 2) return match[1].trim();
  }
  return null;
}
