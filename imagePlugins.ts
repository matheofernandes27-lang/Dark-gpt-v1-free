/**
 * imagePlugins.ts — Système de plugins de génération d'images (version propre et bridée)
 * ---------------------------------------------------------------------------------------
 * Remplace le robot caché « Dreamina » (qui pilotait dreamina.capcut.com pour lui
 * soutirer des crédits gratuits) par des fournisseurs LÉGITIMES et déclarés :
 *
 *   - "pollinations" : API publique GRATUITE, sans compte, prévue pour un usage
 *     programmatique (https://pollinations.ai). C'est le défaut « free ».
 *   - "gemini"       : Google Imagen via TA clé officielle GEMINI_API_KEY.
 *   - "openai"       : DALL·E via TA clé OPENAI_API_KEY.
 *
 * Principe : chaque fournisseur implémente la même interface `ImageProvider`.
 * On en ajoute d'autres facilement, sans jamais détourner le compte d'un tiers.
 *
 * Aucune automatisation de navigateur, aucun « crédit gratuit » extorqué à un service :
 * soit c'est une API réellement ouverte, soit c'est ta propre clé.
 */

export interface ImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  /** Graine optionnelle pour rendre le résultat reproductible. */
  seed?: number;
}

export interface ImageResult {
  /** Data URL base64 prête à injecter dans un <img src> ou un Artifact. */
  dataUrl: string;
  provider: string;
  mimeType: string;
}

export interface ImageProvider {
  readonly id: string;
  readonly label: string;
  /** true si le fournisseur est utilisable (clé présente, etc.). */
  isAvailable(): boolean;
  generate(req: ImageRequest): Promise<ImageResult>;
}

/* ------------------------------------------------------------------ utilitaires */

function clampSize(v: number | undefined, def: number): number {
  const n = Number(v) || def;
  // Bornes raisonnables pour éviter les abus / requêtes énormes.
  return Math.max(64, Math.min(1536, Math.round(n)));
}

async function fetchAsDataUrl(url: string, fallbackMime = 'image/jpeg'): Promise<ImageResult> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Fournisseur d'image : réponse HTTP ${resp.status}`);
  }
  const mimeType = resp.headers.get('content-type') || fallbackMime;
  const buf = Buffer.from(await resp.arrayBuffer());
  return {
    dataUrl: `data:${mimeType};base64,${buf.toString('base64')}`,
    provider: 'http',
    mimeType,
  };
}

/* ------------------------------------------------------------------ Pollinations */

/**
 * Pollinations.ai — génération d'images gratuite et publique.
 * Endpoint documenté : https://image.pollinations.ai/prompt/<texte>?width=..&height=..&seed=..
 * Pas de clé, pas de compte à pirater : c'est fait pour être appelé ainsi.
 */
export class PollinationsProvider implements ImageProvider {
  readonly id = 'pollinations';
  readonly label = 'Pollinations (gratuit, sans clé)';

  isAvailable(): boolean {
    return true; // Toujours dispo : API publique ouverte.
  }

  async generate(req: ImageRequest): Promise<ImageResult> {
    const w = clampSize(req.width, 1024);
    const h = clampSize(req.height, 1024);
    const seed = Number.isFinite(req.seed) ? Number(req.seed) : Math.floor(Math.random() * 1_000_000);
    const encoded = encodeURIComponent(req.prompt.slice(0, 1000));
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&seed=${seed}&nologo=true`;
    const res = await fetchAsDataUrl(url, 'image/jpeg');
    return { ...res, provider: this.id };
  }
}

/* ------------------------------------------------------------------ Google Imagen */

/**
 * Google Imagen via ta clé officielle GEMINI_API_KEY.
 * Nécessite le SDK @google/genai déjà présent dans package.json.
 */
export class GeminiImageProvider implements ImageProvider {
  readonly id = 'gemini';
  readonly label = 'Google Imagen (ta clé GEMINI_API_KEY)';

  isAvailable(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async generate(req: ImageRequest): Promise<ImageResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY absente : fournisseur Imagen indisponible.');

    // Import dynamique pour ne pas alourdir le démarrage si non utilisé.
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const model = process.env.IMAGEN_MODEL || 'imagen-3.0-generate-002';
    const result: any = await (ai as any).models.generateImages({
      model,
      prompt: req.prompt,
      config: { numberOfImages: 1 },
    });

    const img = result?.generatedImages?.[0]?.image;
    const b64 = img?.imageBytes;
    if (!b64) throw new Error('Imagen : aucune image renvoyée.');
    const mimeType = img?.mimeType || 'image/png';
    return { dataUrl: `data:${mimeType};base64,${b64}`, provider: this.id, mimeType };
  }
}

/* ------------------------------------------------------------------ OpenAI DALL·E */

/**
 * OpenAI Images (DALL·E) via ta clé OPENAI_API_KEY. Optionnel.
 */
export class OpenAIImageProvider implements ImageProvider {
  readonly id = 'openai';
  readonly label = 'OpenAI DALL·E (ta clé OPENAI_API_KEY)';

  isAvailable(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async generate(req: ImageRequest): Promise<ImageResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY absente : fournisseur DALL·E indisponible.');

    const size = `${clampSize(req.width, 1024)}x${clampSize(req.height, 1024)}`;
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt: req.prompt,
        size,
        n: 1,
      }),
    });
    if (!resp.ok) {
      throw new Error(`OpenAI Images : HTTP ${resp.status} — ${await resp.text()}`);
    }
    const data: any = await resp.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI Images : aucune image renvoyée.');
    return { dataUrl: `data:image/png;base64,${b64}`, provider: this.id, mimeType: 'image/png' };
  }
}

/* ------------------------------------------------------------------ Registre */

const REGISTRY: ImageProvider[] = [
  new PollinationsProvider(),
  new GeminiImageProvider(),
  new OpenAIImageProvider(),
];

/** Liste des fournisseurs disponibles (pour peupler un menu déroulant côté UI). */
export function listImageProviders(): { id: string; label: string; available: boolean }[] {
  return REGISTRY.map((p) => ({ id: p.id, label: p.label, available: p.isAvailable() }));
}

/**
 * Génère une image.
 * @param providerId  id demandé, ou undefined pour choisir le meilleur dispo.
 * Ordre de repli : le fournisseur demandé → Pollinations (toujours gratuit).
 */
export async function generateImage(req: ImageRequest, providerId?: string): Promise<ImageResult> {
  if (!req?.prompt || !req.prompt.trim()) {
    throw new Error('Prompt d\'image vide.');
  }
  let provider = providerId ? REGISTRY.find((p) => p.id === providerId) : undefined;
  if (!provider || !provider.isAvailable()) {
    // Repli propre : Pollinations, gratuit et toujours dispo.
    provider = REGISTRY.find((p) => p.id === 'pollinations')!;
  }
  return provider.generate(req);
}
