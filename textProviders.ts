/**
 * textProviders.ts — Moteur de texte GRATUIT (sans clé) pour que l'IA réponde vraiment.
 * ----------------------------------------------------------------------------------------
 * Utilise l'API publique gratuite de Pollinations (compatible OpenAI), légitime et prévue
 * pour un usage programmatique. Aucun compte, aucune clé, rien de détourné.
 *
 * Sert de moteur par défaut quand il n'y a ni clé Gemini ni modèle Ollama installé.
 * (Gemini/Ollama restent prioritaires s'ils sont configurés, gérés dans server.ts.)
 */

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const ENDPOINT = 'https://text.pollinations.ai/openai';

/** Toujours disponible : API publique ouverte. */
export function textProviderAvailable(): boolean {
  return true;
}

/**
 * Génère une réponse texte à partir d'une conversation.
 * @param messages historique (rôles user/assistant), déjà borné par l'appelant.
 * @param system   consigne système (persona de l'assistant).
 */
export async function generateText(messages: ChatMsg[], system?: string): Promise<string> {
  const payload = {
    model: 'openai',
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
  };

  // 1) Tentative principale : endpoint compatible OpenAI (garde le contexte).
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      const raw = await res.text();
      const text = parseText(raw);
      if (text) return text;
    }
  } catch {
    /* on tente le repli GET */
  }

  // 2) Repli : endpoint GET simple (dernier message utilisateur).
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const prompt = (system ? system + '\n\n' : '') + lastUser;
  const res2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt.slice(0, 1500))}`, {
    signal: AbortSignal.timeout(25000),
  });
  if (!res2.ok) throw new Error(`Moteur texte gratuit : HTTP ${res2.status}`);
  const text2 = parseText(await res2.text());
  if (!text2) throw new Error('Moteur texte gratuit : réponse vide.');
  return text2;
}

function parseText(raw: string): string {
  let text = '';
  try {
    const data = JSON.parse(raw);
    // Format OpenAI, ou erreur JSON de l'API (queue pleine, etc.).
    if (data?.error) return '';
    text = data?.choices?.[0]?.message?.content ?? data?.response ?? '';
  } catch {
    text = raw; // texte brut
  }
  return (text || '').trim();
}
