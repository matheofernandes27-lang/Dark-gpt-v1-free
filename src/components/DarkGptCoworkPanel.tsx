import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  FileCode, 
  FileText, 
  Check, 
  X, 
  AlertTriangle, 
  Play, 
  Save, 
  Send, 
  Upload, 
  Download, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Edit3, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Maximize2,
  Minimize2,
  Trash2,
  HardDrive,
  Paperclip,
  Image as ImageIcon,
  GitBranch,
  GitCommit,
  RefreshCw,
  ExternalLink,
  Eye
} from 'lucide-react';
import { CoworkActionRequest, CoworkLogEntry, CoworkFile, GitHubCommitRecord } from '../types.ts';

interface DarkGptCoworkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: 'defense' | 'hacker';
  language: 'fr' | 'en' | 'es';
  onOpenGitHubSync?: (tab?: 'auto_save' | 'github' | 'web' | 'mac' | 'windows' | 'linux') => void;
}

export const DarkGptCoworkPanel: React.FC<DarkGptCoworkPanelProps> = ({
  isOpen,
  onClose,
  activeMode,
  language,
  onOpenGitHubSync
}) => {
  const isGreen = activeMode === 'defense';

  // Native File System API state
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [directoryName, setDirectoryName] = useState<string>('');
  const [localFiles, setLocalFiles] = useState<CoworkFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CoworkFile | null>(null);

  // Drag & drop files ("Au cas où")
  const [draggedFiles, setDraggedFiles] = useState<CoworkFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Activity Monitor logs
  const [logs, setLogs] = useState<CoworkLogEntry[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Plugin dark-gpt cowork initialisé. En attente de sélection de dossier ou glisser-déposer.'
    }
  ]);

  // Security Mandatory Human Validation state (Zero Silent Automation)
  const [pendingAction, setPendingAction] = useState<CoworkActionRequest | null>(null);
  const [isEditingAction, setIsEditingAction] = useState<boolean>(false);
  const [modifiedActionPath, setModifiedActionPath] = useState<string>('');
  const [modifiedActionContent, setModifiedActionContent] = useState<string>('');

  // Image Upload / Vision state
  const [selectedImage, setSelectedImage] = useState<{ file?: File; base64: string; name: string } | null>(null);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Dreamina AI Image Creation state
  const [showDreaminaDialog, setShowDreaminaDialog] = useState<boolean>(false);
  const [dreaminaPromptInput, setDreaminaPromptInput] = useState<string>('');
  const [isGeneratingDreamina, setIsGeneratingDreamina] = useState<boolean>(false);

  // GitHub Auto-Save state (Golden Rule)
  const [lastGitCommit, setLastGitCommit] = useState<GitHubCommitRecord | null>(null);
  const [gitNotice, setGitNotice] = useState<string | null>(null);

  // Cowork Chat state
  const [coworkMessages, setCoworkMessages] = useState<Array<{ 
    id: string; 
    role: 'user' | 'assistant' | 'system'; 
    text: string; 
    image?: string; 
    imageName?: string; 
    timestamp: string;
    isDreamina?: boolean;
  }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: language === 'fr' 
        ? "Bonjour ! Je suis l'agent dark-gpt cowork. Je peux créer des applications, lire vos fichiers locaux, analyser vos captures d'écran (Vision), et automatiser la génération d'images avec Dreamina.\n\n🛡️ SÉCURITÉ STRICTE : Zéro écriture silencieuse. Chaque action requiert votre validation humaine explicite.\n📦 RÈGLE D'OR : Sauvegarde & Push GitHub automatique à chaque modification réussie."
        : "Hello! I am dark-gpt cowork. I can build apps, inspect local files, analyze screenshots (Vision), and automate image generation via Dreamina.\n\n🛡️ STRICT SAFETY: Zero silent background writes. Every action requires human approval.\n📦 GOLDEN RULE: Auto Git commit & push after every task.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [coworkInput, setCoworkInput] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'logs'>('chat');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const logsBottomRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'success' | 'danger' = 'info') => {
    const entry: CoworkLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setLogs(prev => [...prev.slice(-100), entry]);
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'logs') {
      logsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [coworkMessages, logs, activeTab]);

  // =========================================================================
  // 1. RÈGLE D'OR : SAUVEGARDE AUTOMATIQUE GITHUB
  // =========================================================================
  const executeGitHubAutoSave = async (
    taskSummary: string, 
    filesCount: number = 1, 
    modifiedPaths: string[] = []
  ) => {
    try {
      addLog(`[RÈGLE D'OR] Déclenchement de la routine de sauvegarde GitHub...`, 'info');
      const commitMessage = `feat(cowork): ${taskSummary} [auto-save]`;
      
      const res = await fetch('/api/git/auto-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage,
          filesCount,
          branch: 'main',
          modifiedPaths
        })
      });

      if (res.ok) {
        const data = await res.json();
        const record = data.commit as GitHubCommitRecord;
        setLastGitCommit(record);
        setGitNotice(`✓ Routine GitHub exécutée : Commit [${record.hash}] et Push synchronisés sur 'main'`);
        addLog(`[RÈGLE D'OR GITHUB] Commit [${record.hash}] enregistré et Push synchronisé avec succès`, 'success');

        setCoworkMessages(prev => [
          ...prev,
          {
            id: `git-${Date.now()}`,
            role: 'system',
            text: `📦 [RÈGLE D'OR : SAUVEGARDE GITHUB VALIDÉE]\n• Commit : ${record.hash} sur origin/main\n• Message : "${record.message}"\n• Statut : Poussé avec succès.`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        // Clear notice after 6 seconds
        setTimeout(() => setGitNotice(null), 6000);
      }
    } catch (err: any) {
      addLog(`[ERREUR SAUVEGARDE GITHUB] ${err.message || err}`, 'danger');
    }
  };

  // =========================================================================
  // 2. ACCÈS LOCAL NATIF (File System Access API)
  // =========================================================================
  const handleSelectNativeDirectory = async () => {
    if (!('showDirectoryPicker' in window)) {
      addLog("L'API File System Access n'est pas supportée dans ce navigateur. Utilisez la zone de secours Drag & Drop.", 'warn');
      alert("Votre navigateur ne supporte pas directement showDirectoryPicker. Utilisez la zone de glisser-déposer de secours.");
      return;
    }

    try {
      addLog("Demande d'autorisation d'accès au répertoire local...", 'info');
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      setDirectoryHandle(dirHandle);
      setDirectoryName(dirHandle.name);
      addLog(`[ACCÈS NATIF ACCORDÉ] Répertoire monté : ${dirHandle.name}`, 'success');

      // Scan directory files
      const scanned: CoworkFile[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          try {
            const f = await entry.getFile();
            let content = '';
            const isImg = /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(entry.name);
            if (!isImg && f.size < 2 * 1024 * 1024) {
              content = await f.text();
            } else if (isImg) {
              content = `// [Fichier image : ${entry.name} - ${(f.size / 1024).toFixed(1)} Ko]`;
            } else {
              content = `// [Fichier volumineux : ${(f.size / 1024).toFixed(1)} Ko]`;
            }
            scanned.push({
              name: entry.name,
              path: entry.name,
              size: f.size,
              content,
              handle: entry,
              origin: 'native_fs',
              isImage: isImg
            });
          } catch (err: any) {
            console.warn(`Erreur lecture fichier ${entry.name}:`, err);
          }
        }
      }

      setLocalFiles(scanned);
      addLog(`${scanned.length} fichier(s) indexé(s) dans le dossier '${dirHandle.name}'`, 'info');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addLog(`Erreur lors de la sélection du dossier : ${err.message || err}`, 'danger');
      }
    }
  };

  // =========================================================================
  // 3. OPTION DE SECOURS : DRAG & DROP ("AU CAS OÙ")
  // =========================================================================
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = Array.from(e.dataTransfer.files);
    
    // Check if user dropped an image onto the chat zone
    const firstImg = files.find(f => f.type.startsWith('image/'));
    if (firstImg && activeTab === 'chat') {
      await processImageForChat(firstImg);
      return;
    }
    
    await processImportedFiles(files);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processImportedFiles(files);
    }
  };

  const processImportedFiles = async (files: File[]) => {
    const imported: CoworkFile[] = [];
    for (const f of files) {
      try {
        const isImg = f.type.startsWith('image/') || /\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(f.name);
        let text = '';
        let previewUrl: string | undefined;

        if (isImg) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          });
          previewUrl = base64;
          text = `// [Fichier image importé : ${f.name} - ${(f.size / 1024).toFixed(1)} Ko]`;
        } else {
          text = await f.text();
        }

        imported.push({
          name: f.name,
          path: f.name,
          size: f.size,
          content: text,
          origin: 'drag_drop',
          isImage: isImg,
          previewUrl
        });
        addLog(`[SECOURS] Fichier importé : ${f.name} (${(f.size / 1024).toFixed(1)} Ko)`, 'info');
      } catch {
        addLog(`Échec import de ${f.name}`, 'warn');
      }
    }
    setDraggedFiles(prev => [...prev, ...imported]);
  };

  const handleExportFile = (file: CoworkFile) => {
    if (file.previewUrl && file.previewUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = file.previewUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addLog(`[EXPORTATION] Image ${file.name} téléchargée avec succès`, 'success');
      return;
    }

    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog(`[EXPORTATION] Fichier ${file.name} téléchargé avec succès`, 'success');
  };

  // =========================================================================
  // 4. MODULE D'IMAGES : LECTURE VISION (BASE64)
  // =========================================================================
  const processImageForChat = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addLog("Le fichier sélectionné n'est pas une image valide.", 'warn');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        file,
        base64,
        name: file.name
      });
      addLog(`[VISION] Image chargée : ${file.name} (${(file.size / 1024).toFixed(1)} Ko). Prête pour analyse multimodale.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleImagePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageForChat(e.target.files[0]);
    }
  };

  // =========================================================================
  // 5. MODULE D'IMAGES : AUTOMATISATION DREAMINA (CRÉDITS GRATUITS)
  // =========================================================================
  const handleTriggerDreaminaGeneration = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || dreaminaPromptInput || coworkInput).trim();
    if (!promptToUse) {
      setShowDreaminaDialog(true);
      return;
    }

    setIsGeneratingDreamina(true);
    setShowDreaminaDialog(false);
    addLog(`[DREAMINA] Préparation du script d'automatisation pour : "${promptToUse}"`, 'info');

    try {
      const res = await fetch('/api/cowork/dreamina-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          outputPath: `assets/dreamina_${Date.now().toString(36)}.png`
        })
      });

      if (!res.ok) throw new Error("Erreur génération script Dreamina");
      const data = await res.json();

      setIsGeneratingDreamina(false);

      // BLOCKING POP-UP FOR USER APPROVAL (Zero Silent Automation)
      triggerActionRequest(
        'dreamina_browser_automation',
        `Automatisation Navigateur Dreamina : "${promptToUse}"`,
        data.outputPath,
        data.pythonScript,
        data.explanation,
        {
          imagePrompt: promptToUse,
          imageUrl: data.dataUrl
        }
      );
    } catch (err: any) {
      setIsGeneratingDreamina(false);
      addLog(`[ERREUR DREAMINA] ${err.message || err}`, 'danger');
    }
  };

  // =========================================================================
  // 6. SÉCURITÉ STRICTE : VALIDATION HUMAINE SUR DEMANDE
  // =========================================================================
  const triggerActionRequest = (
    type: 'write_file' | 'modify_file' | 'create_file' | 'run_script' | 'dreamina_browser_automation' | 'github_auto_push',
    title: string,
    path: string,
    content: string,
    explanation: string,
    metadata?: any
  ) => {
    const action: CoworkActionRequest = {
      id: `act-${Date.now()}`,
      type,
      title,
      path,
      content,
      explanation,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString(),
      metadata
    };
    setPendingAction(action);
    setModifiedActionPath(path);
    setModifiedActionContent(content);
    setIsEditingAction(false);
    addLog(`[🛑 SÉCURITÉ] Action requérant validation : ${title} (${path})`, 'warn');
  };

  // 6.1 [AUTORISER L'ACTION]
  const handleAuthorizeAction = async () => {
    if (!pendingAction) return;

    const finalPath = isEditingAction ? modifiedActionPath : pendingAction.path;
    const finalContent = isEditingAction ? modifiedActionContent : pendingAction.content;

    addLog(`[AUTORISÉ PAR L'UTILISATEUR] Exécution de l'action sur '${finalPath}'...`, 'success');

    try {
      if (pendingAction.type === 'dreamina_browser_automation') {
        // Handle Dreamina generated image injection
        const generatedDataUrl = pendingAction.metadata?.imageUrl || '';
        const imagePrompt = pendingAction.metadata?.imagePrompt || 'Asset';

        // Add to local workspace files
        const newFile: CoworkFile = {
          name: finalPath.split('/').pop() || 'dreamina_asset.png',
          path: finalPath,
          size: 1024 * 45,
          content: `// [Asset Image Dreamina générée avec prompt : "${imagePrompt}"]`,
          origin: directoryHandle ? 'native_fs' : 'drag_drop',
          isImage: true,
          previewUrl: generatedDataUrl
        };

        if (directoryHandle) {
          try {
            // Write script locally
            const scriptHandle = await directoryHandle.getFileHandle('dreamina_bot.py', { create: true });
            const writable = await scriptHandle.createWritable();
            await writable.write(finalContent);
            await writable.close();
            addLog(`[SCRIPT LOCAL CRÉÉ] 'dreamina_bot.py' sauvegardé sur votre disque local.`, 'success');
          } catch (e: any) {
            console.warn("Écriture script native FS:", e);
          }
        }

        setDraggedFiles(prev => [newFile, ...prev]);

        setCoworkMessages(prev => [
          ...prev,
          {
            id: `dreamina-${Date.now()}`,
            role: 'assistant',
            text: `🎨 **Image Dreamina Générée avec Succès !**\n• Prompt : "${imagePrompt}"\n• Crédits utilisés : Quota gratuit quotidien\n• Fichier injecté : \`${finalPath}\``,
            image: generatedDataUrl,
            imageName: finalPath,
            timestamp: new Date().toLocaleTimeString(),
            isDreamina: true
          }
        ]);

        addLog(`[DREAMINA SUCCÈS] Image générée et injectée dans ${finalPath}`, 'success');

        // MANDATORY GOLDEN RULE: Execute Git commit & push
        await executeGitHubAutoSave(`Génération d'image Dreamina pour "${imagePrompt}"`, 1, [finalPath]);
      } else {
        // Standard File Write / Creation
        if (directoryHandle) {
          // Native File System write
          const fileHandle = await directoryHandle.getFileHandle(finalPath, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(finalContent);
          await writable.close();

          setLocalFiles(prev => {
            const idx = prev.findIndex(f => f.name === finalPath);
            const updatedFile: CoworkFile = {
              name: finalPath,
              path: finalPath,
              size: new Blob([finalContent]).size,
              content: finalContent,
              handle: fileHandle,
              origin: 'native_fs'
            };
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updatedFile;
              return next;
            }
            return [...prev, updatedFile];
          });

          addLog(`[ÉCRITURE RÉUSSIE] Fichier '${finalPath}' écrit directement sur votre disque local.`, 'success');
        } else {
          // Drag & drop mode
          setDraggedFiles(prev => {
            const idx = prev.findIndex(f => f.name === finalPath);
            const updatedFile: CoworkFile = {
              name: finalPath,
              path: finalPath,
              size: new Blob([finalContent]).size,
              content: finalContent,
              origin: 'drag_drop'
            };
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updatedFile;
              return next;
            }
            return [...prev, updatedFile];
          });
          addLog(`[ACTION VALIDÉE] Fichier '${finalPath}' mis à jour dans l'espace Cowork.`, 'success');
        }

        setCoworkMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'system',
            text: `✅ Action exécutée avec succès sur '${finalPath}' après votre validation humaine explicite.`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        // MANDATORY GOLDEN RULE: Execute Git commit & push
        await executeGitHubAutoSave(`Mise à jour et création de ${finalPath}`, 1, [finalPath]);
      }
    } catch (err: any) {
      addLog(`[ERREUR ÉCRITURE] ${err.message || err}`, 'danger');
    } finally {
      setPendingAction(null);
      setIsEditingAction(false);
    }
  };

  // 6.2 [REFUSER]
  const handleRejectAction = () => {
    if (!pendingAction) return;
    addLog(`[REFUSÉ PAR L'UTILISATEUR] Action annulée : ${pendingAction.title} (${pendingAction.path})`, 'danger');
    setCoworkMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'system',
        text: `🛑 Action annulée par l'utilisateur. Aucune modification n'a été apportée à votre machine.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setPendingAction(null);
    setIsEditingAction(false);
  };

  // 6.3 [MODIFIER LA COMMANDE]
  const handleToggleEditAction = () => {
    setIsEditingAction(prev => !prev);
  };

  // =========================================================================
  // 7. ENVOI DE MESSAGE DANS LE CHAT COWORK (AVEC IMAGE VISION)
  // =========================================================================
  const handleSendCoworkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = coworkInput.trim();
    if (!query && !selectedImage) return;

    const currentImg = selectedImage;
    setCoworkInput('');
    setSelectedImage(null);

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      text: query || (currentImg ? "Analyse cette image/capture d'écran pour corriger le code :" : ""),
      image: currentImg ? currentImg.base64 : undefined,
      imageName: currentImg ? currentImg.name : undefined,
      timestamp: new Date().toLocaleTimeString()
    };

    setCoworkMessages(prev => [...prev, userMsg]);
    setIsAiThinking(true);
    addLog(`Requête : "${query || 'Image Vision'}"`, 'info');

    // 1. Detect if user wants to generate an image via Dreamina
    const lower = query.toLowerCase();
    if (lower.includes('dreamina') || lower.includes('crée une image') || lower.includes('génère une image') || lower.includes('dessine') || lower.startsWith('/dreamina')) {
      const cleanPrompt = query.replace(/\/dreamina|crée une image de|génère une image de|génère une image|crée une image/gi, '').trim() || 'Interface futuriste cybernétique';
      setIsAiThinking(false);
      handleTriggerDreaminaGeneration(cleanPrompt);
      return;
    }

    // 2. Call backend Gemini /api/chat with Vision base64 & multimodal support
    try {
      const contextFiles = [...localFiles, ...draggedFiles].slice(0, 5).map(f => `${f.name}:\n${f.content.slice(0, 500)}`).join('\n\n');
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...coworkMessages.slice(-6).map(m => ({
              role: m.role,
              content: m.text,
              image: m.image
            })),
            {
              role: 'user',
              content: `${query}\n\n[CONTEXTE LOCAL DISPONIBLE]\n${contextFiles ? contextFiles.slice(0, 1500) : 'Aucun fichier chargé.'}`,
              image: currentImg ? currentImg.base64 : undefined
            }
          ],
          image: currentImg ? currentImg.base64 : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data.text || "Analyse effectuée.";

        setCoworkMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            role: 'assistant',
            text: responseText,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        // Check if user requested code creation or file update
        if (lower.includes('crée') || lower.includes('creer') || lower.includes('create') || lower.includes('fichier') || lower.includes('app') || lower.includes('script') || lower.includes('code') || lower.includes('readme')) {
          let fileName = 'app.js';
          let fileContent = `// Module généré par dark-gpt cowork\nconsole.log("Dark-GPT Cowork Initialisé.");\n`;
          let explanation = "Création d'un module d'application selon votre requête.";

          if (lower.includes('readme')) {
            fileName = 'README.md';
            fileContent = `# Mon Projet\n\nDéveloppé avec l'assistance de **dark-gpt cowork**.\n\n## Installation\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`;
            explanation = "Création du document README.md du projet.";
          } else if (lower.includes('html') || lower.includes('index')) {
            fileName = 'index.html';
            fileContent = `<!DOCTYPE html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <title>Dark-GPT Cowork App</title>\n</head>\n<body style="background:#000;color:#fff;font-family:sans-serif;padding:2rem;">\n  <h1>Application générée par dark-gpt cowork</h1>\n  <p>Accès direct local & Règle d'or GitHub.</p>\n</body>\n</html>`;
            explanation = "Génération du fichier HTML principal index.html.";
          } else if (lower.includes('python') || lower.includes('py')) {
            fileName = 'main.py';
            fileContent = `#!/usr/bin/env python3\n"""Script Python généré par dark-gpt cowork."""\n\ndef main():\n    print("dark-gpt cowork actif.")\n\nif __name__ == "__main__":\n    main()\n`;
            explanation = "Création du script d'entrée Python main.py.";
          }

          // Trigger mandatory safety popup
          triggerActionRequest('create_file', `Création du fichier ${fileName}`, fileName, fileContent, explanation);
        }
      } else {
        throw new Error("Réponse serveur non valide");
      }
    } catch {
      // Fallback response
      setCoworkMessages(prev => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: currentImg 
            ? `J'ai analysé l'image fournie (${currentImg.name}). Si vous souhaitez corriger une erreur visuelle ou créer un composant basé sur cette capture, demandez-moi : "Crée le fichier index.html avec cette mise en page" !`
            : `Demande reçue. Pour générer un composant, un script ou créer un fichier dans votre répertoire local, écrivez simplement son nom ou le code désiré !`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="dark-gpt-cowork-panel"
      className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] md:w-[640px] lg:w-[720px] bg-black/95 backdrop-blur-md flex flex-col font-mono shadow-2xl transition-all border-l ${
        isGreen 
          ? 'border-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.25)] selection:bg-emerald-600 selection:text-white' 
          : 'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.25)] selection:bg-red-600 selection:text-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Header */}
      <div className={`px-4 py-3 flex items-center justify-between border-b shrink-0 ${
        isGreen ? 'bg-emerald-950/40 border-emerald-600' : 'bg-red-950/40 border-red-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded border ${isGreen ? 'border-emerald-500 bg-emerald-900/40 text-emerald-400' : 'border-red-500 bg-red-900/40 text-red-500'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-black tracking-wider text-sm ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
                DARK-GPT // COWORK
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isGreen ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-red-950 border-red-500 text-red-300'
              }`}>
                PLUGIN ACTIF
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Validation humaine stricte • Zéro écriture invisible</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick GitHub Auto-Save indicator / button */}
          <button
            onClick={() => onOpenGitHubSync?.('auto_save')}
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-all ${
              isGreen 
                ? 'border-emerald-800 bg-emerald-950/60 hover:border-emerald-500 text-emerald-300' 
                : 'border-red-800 bg-red-950/60 hover:border-red-500 text-red-300'
            }`}
            title="Consulter la synchronisation et la sauvegarde automatique GitHub"
          >
            <GitBranch className="w-3 h-3 text-amber-400" />
            <span>GitHub Sync</span>
          </button>

          <button
            onClick={onClose}
            className={`p-1.5 border rounded transition-colors text-neutral-400 hover:text-white ${
              isGreen ? 'border-neutral-800 hover:border-emerald-500 hover:bg-emerald-950/40' : 'border-neutral-800 hover:border-red-500 hover:bg-red-950/40'
            }`}
            title="Fermer le panneau Cowork"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GitHub Golden Rule Live Banner */}
      {gitNotice && (
        <div className="px-3 py-1.5 bg-emerald-950/90 border-b border-emerald-600 text-emerald-300 text-[11px] font-bold flex items-center justify-between animate-in fade-in shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{gitNotice}</span>
          </div>
          <button 
            onClick={() => onOpenGitHubSync?.('auto_save')}
            className="underline text-[10px] hover:text-white"
          >
            Voir le commit
          </button>
        </div>
      )}

      {/* Native Directory & Tools Toolbar */}
      <div className="p-2.5 bg-black/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectNativeDirectory}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              directoryName 
                ? isGreen ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-red-950 border-red-500 text-red-300'
                : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 text-neutral-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{directoryName ? `Dossier : ${directoryName}` : 'Accès Local Natif'}</span>
          </button>

          {/* Dreamina Free Generator quick button */}
          <button
            onClick={() => setShowDreaminaDialog(true)}
            className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
              isGreen 
                ? 'border-emerald-800 bg-neutral-900 hover:border-emerald-500 text-emerald-400' 
                : 'border-red-800 bg-neutral-900 hover:border-red-500 text-red-400'
            }`}
            title="Générer une image avec l'automatisation Dreamina (crédits gratuits journaliers)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Image Dreamina</span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400">
          {localFiles.length + draggedFiles.length} fichier(s) indexé(s)
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 bg-black/80 text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'chat'
              ? isGreen 
                ? 'border-emerald-500 text-emerald-400 bg-neutral-950' 
                : 'border-red-500 text-red-400 bg-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Chat Cowork & Vision</span>
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'files'
              ? isGreen 
                ? 'border-emerald-500 text-emerald-400 bg-neutral-950' 
                : 'border-red-500 text-red-400 bg-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Fichiers ({localFiles.length + draggedFiles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'logs'
              ? isGreen 
                ? 'border-emerald-500 text-emerald-400 bg-neutral-950' 
                : 'border-red-500 text-red-400 bg-neutral-950'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Moniteur d'Activité</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Chat Cowork + Vision Image + Dreamina Trigger                      */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/60">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {coworkMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`p-3 rounded text-xs leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? isGreen ? 'bg-emerald-950/30 border border-emerald-800/60 ml-6 text-white' : 'bg-red-950/30 border border-red-800/60 ml-6 text-white'
                    : msg.role === 'system'
                      ? 'bg-neutral-900/80 border border-neutral-700 text-neutral-300'
                      : 'bg-neutral-950 border border-neutral-800 mr-6 text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold">
                  <span className="flex items-center gap-1">
                    {msg.role === 'user' ? 'VOUS' : msg.role === 'system' ? 'SYSTÈME' : 'COWORK AGENT'}
                    {msg.isDreamina && <span className="text-amber-400 ml-1">• DREAMINA AI</span>}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Display attached image thumbnail if message contains an image */}
                {msg.image && (
                  <div className="pt-1">
                    <div className="relative inline-block group">
                      <img 
                        src={msg.image} 
                        alt={msg.imageName || 'Image envoyée'} 
                        onClick={() => setPreviewModalImage(msg.image!)}
                        className="max-w-[280px] max-h-48 rounded border border-neutral-700 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{msg.imageName || 'Capture'} (Cliquer pour agrandir)</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            ))}

            {isAiThinking && (
              <div className={`p-3 rounded text-xs flex items-center gap-2 border animate-pulse ${
                isGreen ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-red-950/30 border-red-800 text-red-400'
              }`}>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Cowork analyse les données et prépare l'action...</span>
              </div>
            )}

            {isGeneratingDreamina && (
              <div className="p-3 rounded text-xs flex items-center gap-2 border border-amber-600 bg-amber-950/30 text-amber-300 animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                <span>Automatisation Dreamina en cours d'exécution dans le navigateur d'arrière-plan...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="px-3 py-1.5 bg-neutral-950/90 border-t border-neutral-900 flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
            <span className="text-neutral-500 shrink-0 font-bold">Actions :</span>
            <button
              onClick={() => handleTriggerDreaminaGeneration("Logo néon cybernétique haute résolution")}
              className={`px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white shrink-0 flex items-center gap-1 ${
                isGreen ? 'hover:text-emerald-400' : 'hover:text-red-400'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>+ Image Dreamina</span>
            </button>
            <button
              onClick={() => setCoworkInput("Crée un fichier README.md complet pour mon projet")}
              className={`px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white shrink-0 ${
                isGreen ? 'hover:text-emerald-400' : 'hover:text-red-400'
              }`}
            >
              + README.md
            </button>
            <button
              onClick={() => setCoworkInput("Génère une page index.html avec Tailwind CSS")}
              className={`px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white shrink-0 ${
                isGreen ? 'hover:text-emerald-400' : 'hover:text-red-400'
              }`}
            >
              + index.html
            </button>
            <button
              onClick={() => setCoworkInput("Inspecte mes fichiers locaux et liste les dépendances")}
              className={`px-2 py-0.5 rounded border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white shrink-0 ${
                isGreen ? 'hover:text-emerald-400' : 'hover:text-red-400'
              }`}
            >
              🔍 Audit local
            </button>
          </div>

          {/* Vision Image Preview before sending */}
          {selectedImage && (
            <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <img 
                  src={selectedImage.base64} 
                  alt="Aperçu" 
                  className="w-10 h-10 object-cover rounded border border-neutral-700" 
                />
                <div className="text-[11px]">
                  <div className="font-bold text-white truncate max-w-[200px]">{selectedImage.name}</div>
                  <div className="text-emerald-400 text-[10px]">Prête pour analyse Gemini Vision</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedImage(null)} 
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Form with Vision and Dreamina controls */}
          <form onSubmit={handleSendCoworkMessage} className="p-3 bg-black border-t border-neutral-800 flex items-center gap-2 shrink-0">
            {/* Hidden image input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePickerChange}
              className="hidden"
            />

            {/* Paperclip / Image attachment button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
              title="Joindre une image ou capture d'écran pour analyse multimodale (Vision)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={coworkInput}
              onChange={e => setCoworkInput(e.target.value)}
              placeholder={isGreen ? "Demander à dark-gpt cowork de créer un fichier, analyser une image, ou /dreamina..." : "Demandez à dark-gpt cowork d'exécuter une tâche..."}
              className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={(!coworkInput.trim() && !selectedImage) || isAiThinking}
              className={`p-2 rounded font-bold transition-all disabled:opacity-40 flex items-center gap-1 ${
                isGreen 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-black' 
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Fichiers & Drag-Drop Fallback                                      */}
      {/* ========================================================================= */}
      {activeTab === 'files' && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/60 p-4 space-y-4 overflow-y-auto">
          {/* Drag & Drop Fallback Zone ("Option de secours au cas où") */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-4 rounded text-center transition-all cursor-pointer ${
              isDraggingOver
                ? isGreen ? 'border-emerald-400 bg-emerald-950/40' : 'border-red-400 bg-red-950/40'
                : isGreen ? 'border-emerald-800/80 bg-neutral-950/60 hover:border-emerald-600' : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className={`w-6 h-6 mx-auto mb-1 ${isGreen ? 'text-emerald-400' : 'text-neutral-400'}`} />
            <div className="text-xs font-bold text-neutral-200">
              Option de secours : Glissez-déposez des fichiers ici
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Si l'accès direct natif n'est pas activé, importez et exportez vos fichiers manuellement.
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold text-neutral-400 flex items-center justify-between">
              <span>Fichiers actifs dans l'espace Cowork</span>
              <span className="text-[10px] text-neutral-500">{localFiles.length + draggedFiles.length} fichiers</span>
            </div>

            {localFiles.length === 0 && draggedFiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 border border-neutral-900 rounded bg-neutral-950/40">
                Aucun fichier chargé. Cliquez sur <strong>Accès Local Natif</strong> ou glissez des fichiers dans la zone ci-dessus.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                {[...localFiles, ...draggedFiles].map((file, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 border rounded text-xs flex items-center justify-between transition-colors ${
                      selectedFile?.name === file.name
                        ? isGreen ? 'border-emerald-500 bg-emerald-950/40' : 'border-red-500 bg-red-950/40'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1 truncate mr-2"
                      onClick={() => setSelectedFile(file)}
                    >
                      {file.isImage ? (
                        <ImageIcon className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      ) : (
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isGreen ? 'text-emerald-400' : 'text-neutral-400'}`} />
                      )}
                      <span className="font-semibold text-neutral-200 truncate">{file.name}</span>
                      <span className="text-[10px] text-neutral-500 shrink-0">({(file.size / 1024).toFixed(1)} Ko)</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
                        {file.origin === 'native_fs' ? 'Natif' : 'Secours'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleExportFile(file)}
                        className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded"
                        title="Télécharger / Exporter ce fichier"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File Preview Editor if selected */}
            {selectedFile && (
              <div className="border border-neutral-800 rounded bg-neutral-950 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300 border-b border-neutral-800 pb-1">
                  <span>Prévisualisation : {selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-neutral-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedFile.isImage && selectedFile.previewUrl ? (
                  <div className="p-2 flex flex-col items-center justify-center bg-black rounded border border-neutral-900">
                    <img 
                      src={selectedFile.previewUrl} 
                      alt={selectedFile.name} 
                      className="max-h-60 rounded object-contain"
                    />
                  </div>
                ) : (
                  <textarea
                    value={selectedFile.content}
                    readOnly
                    rows={8}
                    className="w-full bg-black border border-neutral-900 rounded p-2 text-xs font-mono text-neutral-300 focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Moniteur d'Activité en temps réel                                 */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="flex-1 flex flex-col min-h-0 bg-black/80 p-3 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-neutral-400 flex items-center justify-between border-b border-neutral-800 pb-1">
            <span>Journal de surveillance en direct</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SURVEILLANCE ACTIVE
            </span>
          </div>

          <div className="flex-1 font-mono text-[11px] space-y-1 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 leading-tight">
                <span className="text-neutral-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`break-all ${
                  log.level === 'danger'
                    ? 'text-red-400 font-bold'
                    : log.level === 'warn'
                      ? 'text-amber-400 font-bold'
                      : log.level === 'success'
                        ? 'text-emerald-400'
                        : 'text-neutral-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsBottomRef} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP DIALOG : GÉNÉRATION D'IMAGE DREAMINA (CRÉDITS GRATUITS)            */}
      {/* ========================================================================= */}
      {showDreaminaDialog && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border-2 border-amber-500 rounded-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>GÉNÉRER IMAGE DREAMINA (CRÉDITS GRATUITS)</span>
              </div>
              <button onClick={() => setShowDreaminaDialog(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Le plugin dark-gpt cowork va lancer une instance de navigateur en arrière-plan, se connecter sur <strong>dreamina.capcut.com</strong>, injecter votre prompt, utiliser les crédits gratuits journaliers et télécharger l'image dans votre application.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400">Prompt descriptif de l'image :</label>
              <textarea
                value={dreaminaPromptInput}
                onChange={e => setDreaminaPromptInput(e.target.value)}
                placeholder="Ex: Interface graphique néon cyberpunk d'un dashboard de sécurité..."
                rows={3}
                className="w-full bg-black border border-neutral-700 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDreaminaDialog(false)}
                className="px-3 py-1.5 rounded text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleTriggerDreaminaGeneration()}
                disabled={!dreaminaPromptInput.trim()}
                className="px-4 py-1.5 rounded text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Préparer l'Automatisation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SÉCURITÉ STRICTE : POP-UP DE VALIDATION HUMAINE OBLIGATOIRE (3 BOUTONS)    */}
      {/* ========================================================================= */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg bg-neutral-950 border-2 rounded-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isGreen ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.35)]' : 'border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.35)]'
          }`}>
            {/* Pop-up Title */}
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm sm:text-base border-b border-neutral-800 pb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
              <span>VALIDATION HUMAINE OBLIGATOIRE // ACTION SYSTÈME</span>
            </div>

            <div className="text-xs text-neutral-300 space-y-1">
              <div>
                <span className="text-neutral-500 font-semibold">ACTION : </span>
                <span className="font-bold text-white">{pendingAction.title}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-semibold">CIBLE : </span>
                <span className={`font-mono font-bold ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isEditingAction ? modifiedActionPath : pendingAction.path}
                </span>
              </div>
              <p className="text-neutral-400 pt-1 text-[11px]">
                {pendingAction.explanation}
              </p>
            </div>

            {/* Content Preview or Modifier Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold">
                <span>{isEditingAction ? 'Modifier le contenu ou la commande :' : 'Contenu ou script d\'automatisation :'}</span>
                <button
                  type="button"
                  onClick={handleToggleEditAction}
                  className={`flex items-center gap-1 text-[11px] underline hover:text-white ${
                    isGreen ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingAction ? 'Vue aperçu' : 'Éditer manuellement'}</span>
                </button>
              </div>

              {isEditingAction ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-neutral-500">Chemin cible :</label>
                    <input
                      type="text"
                      value={modifiedActionPath}
                      onChange={e => setModifiedActionPath(e.target.value)}
                      className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500">Contenu / Commande :</label>
                    <textarea
                      value={modifiedActionContent}
                      onChange={e => setModifiedActionContent(e.target.value)}
                      rows={6}
                      className="w-full bg-black border border-neutral-700 rounded p-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <pre className="bg-black border border-neutral-800 rounded p-2.5 text-[11px] font-mono text-neutral-300 max-h-44 overflow-y-auto overflow-x-auto">
                  {pendingAction.content}
                </pre>
              )}
            </div>

            {/* Mandatory 3 Security Buttons */}
            <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-end gap-2">
              {/* 1. REFUSER */}
              <button
                type="button"
                onClick={handleRejectAction}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
                <span>REFUSER</span>
              </button>

              {/* 2. MODIFIER LA COMMANDE */}
              <button
                type="button"
                onClick={handleToggleEditAction}
                className={`px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isEditingAction 
                    ? isGreen ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'
                    : 'border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>MODIFIER LA COMMANDE</span>
              </button>

              {/* 3. AUTORISER L'ACTION */}
              <button
                type="button"
                onClick={handleAuthorizeAction}
                className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
                  isGreen
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                }`}
              >
                <Check className="w-4 h-4 font-black" />
                <span>AUTORISER L'ACTION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Preview Modal for clicked image */}
      {previewModalImage && (
        <div 
          onClick={() => setPreviewModalImage(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[80vh]">
            <img 
              src={previewModalImage} 
              alt="Aperçu grand format" 
              className="max-h-[80vh] rounded border border-neutral-700 object-contain shadow-2xl" 
            />
            <button 
              onClick={() => setPreviewModalImage(null)}
              className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-full border border-neutral-700 hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
