import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  File, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Search, 
  Save, 
  Send, 
  RefreshCw, 
  Terminal, 
  HardDrive,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { MacAuthorizedFile, MacSystemInfo } from '../types.ts';

interface MacFileAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectFileToChat: (file: { name: string; path: string; content: string }) => void;
}

export const MacFileAccessModal: React.FC<MacFileAccessModalProps> = ({
  isOpen,
  onClose,
  onInjectFileToChat
}) => {
  const [authorizedFiles, setAuthorizedFiles] = useState<MacAuthorizedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MacAuthorizedFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [folderName, setFolderName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [manualPath, setManualPath] = useState<string>('~/Downloads');
  const [systemInfo, setSystemInfo] = useState<MacSystemInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'picker' | 'server_fs'>('picker');

  // Fetch host system information on mount
  useEffect(() => {
    if (isOpen) {
      fetchSystemInfo();
    }
  }, [isOpen]);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/mac/info');
      if (res.ok) {
        const data: MacSystemInfo = await res.json();
        setSystemInfo(data);
        if (data.userHome) {
          setManualPath(`${data.userHome}/Downloads`);
        }
      }
    } catch (e) {
      console.warn("Could not fetch host Mac info:", e);
    }
  };

  if (!isOpen) return null;

  // 1. Web File System Access API: Directory Picker (Native macOS Finder Dialog)
  const handleOpenDirectoryPicker = async () => {
    setLoading(true);
    setStatusMessage("Ouverture du Finder macOS pour sélection du dossier...");
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'documents'
        });

        setFolderName(dirHandle.name);
        const files: MacAuthorizedFile[] = [];

        // Recursively or flatly read directory entries
        async function readDir(handle: any, currentPath: string, depth = 0) {
          if (depth > 4) return; // Prevent excessive deep nesting
          for await (const entry of handle.values()) {
            const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              try {
                const fileData = await entry.getFile();
                // Read text if smaller than 3MB
                let textPreview = '';
                if (fileData.size <= 3 * 1024 * 1024) {
                  textPreview = await fileData.text();
                } else {
                  textPreview = `[Fichier volumineux : ${(fileData.size / 1024 / 1024).toFixed(2)} Mo. Prévisualisation partielle désactivée.]`;
                }

                files.push({
                  name: entry.name,
                  path: entryPath,
                  size: fileData.size,
                  type: fileData.type || 'text/plain',
                  lastModified: fileData.lastModified,
                  content: textPreview,
                  isDirectory: false,
                  handle: entry
                });
              } catch (fileErr) {
                console.warn(`Could not read file ${entry.name}:`, fileErr);
              }
            } else if (entry.kind === 'directory' && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
              files.push({
                name: entry.name,
                path: entryPath,
                size: 0,
                isDirectory: true,
                handle: entry
              });
              await readDir(entry, entryPath, depth + 1);
            }
          }
        }

        await readDir(dirHandle, dirHandle.name);
        setAuthorizedFiles(files);
        setStatusMessage(`✓ Dossier "${dirHandle.name}" autorisé par l'utilisateur (${files.length} éléments indexés).`);
        
        // Select first text file by default
        const firstFile = files.find(f => !f.isDirectory && f.content);
        if (firstFile) {
          setSelectedFile(firstFile);
          setFileContent(firstFile.content || '');
        }
      } else {
        // Fallback for browsers without showDirectoryPicker
        triggerFallbackFileInput();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage(`Erreur d'accès : ${err.message || 'Autorisation refusée par l\'utilisateur'}`);
      } else {
        setStatusMessage("Sélection annulée par l'utilisateur.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Web File System Access API: File Picker (Select specific files)
  const handleOpenFilesPicker = async () => {
    setLoading(true);
    setStatusMessage("Sélection de fichiers sur votre Mac...");
    try {
      if ('showOpenFilePicker' in window) {
        const fileHandles = await (window as any).showOpenFilePicker({
          multiple: true
        });

        const files: MacAuthorizedFile[] = [];
        for (const handle of fileHandles) {
          const fileData = await handle.getFile();
          let textPreview = '';
          if (fileData.size <= 4 * 1024 * 1024) {
            textPreview = await fileData.text();
          }
          files.push({
            name: handle.name,
            path: handle.name,
            size: fileData.size,
            type: fileData.type,
            lastModified: fileData.lastModified,
            content: textPreview,
            isDirectory: false,
            handle
          });
        }

        setAuthorizedFiles(prev => [...prev, ...files]);
        setFolderName("Fichiers sélectionnés");
        setStatusMessage(`✓ ${files.length} fichier(s) autorisé(s) par l'utilisateur.`);
        if (files[0]) {
          setSelectedFile(files[0]);
          setFileContent(files[0].content || '');
        }
      } else {
        triggerFallbackFileInput();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setStatusMessage(`Erreur : ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback hidden input for drag & drop / folder upload
  const triggerFallbackFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    (input as any).webkitdirectory = true;
    input.onchange = async (e: any) => {
      const selectedList: FileList = e.target.files;
      if (!selectedList || selectedList.length === 0) return;
      
      setLoading(true);
      const files: MacAuthorizedFile[] = [];
      for (let i = 0; i < selectedList.length; i++) {
        const file = selectedList[i];
        let content = '';
        if (file.size <= 3 * 1024 * 1024) {
          content = await file.text();
        }
        files.push({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          content,
          isDirectory: false
        });
      }
      setAuthorizedFiles(files);
      setFolderName(selectedList[0].webkitRelativePath?.split('/')[0] || "Dossier Mac");
      setStatusMessage(`✓ ${files.length} fichier(s) importé(s) avec votre accord.`);
      if (files[0]) {
        setSelectedFile(files[0]);
        setFileContent(files[0].content || '');
      }
      setLoading(false);
    };
    input.click();
  };

  // 3. Server-side local Mac filesystem exploration (when running on Mac backend)
  const handleAuthorizeServerPath = async () => {
    if (!manualPath.trim()) return;
    setLoading(true);
    setStatusMessage(`Autorisation du chemin ${manualPath} sur la machine locale...`);
    try {
      const authRes = await fetch('/api/mac/authorize-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: manualPath.trim() })
      });

      if (!authRes.ok) {
        const err = await authRes.json();
        throw new Error(err.error || "Impossible d'autoriser ce chemin");
      }

      // Fetch directory contents
      const listRes = await fetch('/api/mac/fs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: manualPath.trim() })
      });

      if (!listRes.ok) {
        const err = await listRes.json();
        throw new Error(err.error || "Impossible de lire le dossier");
      }

      const listData = await listRes.json();
      const files: MacAuthorizedFile[] = (listData.items || []).map((it: any) => ({
        name: it.name,
        path: it.path,
        size: it.size,
        isDirectory: it.isDirectory,
        lastModified: it.lastModified
      }));

      setAuthorizedFiles(files);
      setFolderName(manualPath.trim());
      setStatusMessage(`✓ Dossier local "${manualPath}" autorisé par l'utilisateur (${files.length} fichiers trouvés).`);
      fetchSystemInfo();
    } catch (err: any) {
      setStatusMessage(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Select a file to view and load content if needed
  const handleSelectFile = async (file: MacAuthorizedFile) => {
    if (file.isDirectory) return;
    setSelectedFile(file);

    if (file.content !== undefined && file.content !== '') {
      setFileContent(file.content);
      return;
    }

    // If file is from server fs, fetch content
    try {
      setLoading(true);
      const res = await fetch('/api/mac/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: file.path })
      });
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        file.content = data.content;
      } else {
        setFileContent("[Impossible de charger le contenu]");
      }
    } catch (e: any) {
      setFileContent(`[Erreur de lecture : ${e.message}]`);
    } finally {
      setLoading(false);
    }
  };

  // Save modified content back to Mac file
  const handleSaveToMac = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      if (selectedFile.handle && typeof selectedFile.handle.createWritable === 'function') {
        // Native Web File System Access API write
        const writable = await selectedFile.handle.createWritable();
        await writable.write(fileContent);
        await writable.close();
        selectedFile.content = fileContent;
        setStatusMessage(`✓ Fichier "${selectedFile.name}" sauvegardé directement sur votre Mac.`);
      } else {
        // Server API write
        const res = await fetch('/api/mac/fs/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: selectedFile.path,
            content: fileContent
          })
        });
        if (res.ok) {
          selectedFile.content = fileContent;
          setStatusMessage(`✓ Fichier "${selectedFile.name}" sauvegardé avec succès sur votre Mac.`);
        } else {
          const err = await res.json();
          throw new Error(err.error || "Échec de sauvegarde");
        }
      }
    } catch (err: any) {
      setStatusMessage(`Erreur de sauvegarde : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Inject selected file into Dark-GPT chat
  const handleInjectIntoChat = () => {
    if (!selectedFile) return;
    onInjectFileToChat({
      name: selectedFile.name,
      path: selectedFile.path,
      content: fileContent
    });
    onClose();
  };

  // Filter files
  const filteredFiles = authorizedFiles.filter(f => {
    if (!searchQuery.trim()) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           f.path.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl bg-black border-2 border-red-600 rounded-lg shadow-[0_0_35px_rgba(220,38,38,0.35)] flex flex-col max-h-[92vh] overflow-hidden text-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-800 bg-red-950/40 select-none">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-red-500" />
            <div>
              <span className="font-mono font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                [x_x] ACCÈS FICHIERS MAC // AUTORISATION UTILISATEUR
                <span className="text-[10px] px-2 py-0.5 bg-red-900/80 text-red-200 border border-red-500 rounded uppercase">
                  Sécurité Locale
                </span>
              </span>
              <p className="text-[11px] text-neutral-400">
                Conformité macOS Finder & Sandboxing : DARK-GPT n'accède qu'aux dossiers expressément validés par vous.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-red-900/60 rounded border border-transparent hover:border-red-600 transition-all"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authorization Banner & Action Bar */}
        <div className="p-3.5 bg-neutral-950 border-b border-red-950 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Native Finder Directory Picker Button */}
              <button
                onClick={handleOpenDirectoryPicker}
                disabled={loading}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-all shadow-[0_0_12px_rgba(220,38,38,0.4)] disabled:opacity-50 cursor-pointer"
                title="Ouvre la boîte de dialogue macOS Finder pour sélectionner un dossier"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Autoriser un dossier du Mac (Finder)</span>
              </button>

              {/* Native Finder File Picker */}
              <button
                onClick={handleOpenFilesPicker}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-red-900/80 hover:border-red-500 text-neutral-200 text-xs rounded transition-all disabled:opacity-50 cursor-pointer"
                title="Sélectionnez un ou plusieurs fichiers spécifiques"
              >
                <FileText className="w-4 h-4 text-red-400" />
                <span>Sélectionner des fichiers</span>
              </button>

              {/* Fallback Drag/Upload */}
              <button
                onClick={triggerFallbackFileInput}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-black border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-neutral-200 text-xs rounded transition-all cursor-pointer"
                title="Explorateur alternatif / Glisser-déposer"
              >
                <span>Autre méthode / Upload</span>
              </button>
            </div>

            {/* Quick folder shortcuts */}
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="text-neutral-500">Raccourcis Mac :</span>
              {['~/Downloads', '~/Documents', '~/Desktop'].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setManualPath(p);
                    handleAuthorizeServerPath();
                  }}
                  className="px-2 py-0.5 bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-700 text-neutral-300 rounded font-mono transition-all text-[10px]"
                >
                  {p.replace('~/', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Local path input for direct local server */}
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-900 text-xs">
            <span className="text-neutral-500 font-mono flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
              Chemin Mac :
            </span>
            <input
              type="text"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              placeholder="Ex: ~/Downloads ou /Users/nom/Documents"
              className="flex-1 bg-black border border-neutral-800 focus:border-red-500 px-2.5 py-1 rounded text-neutral-200 font-mono text-xs focus:outline-none"
            />
            <button
              onClick={handleAuthorizeServerPath}
              disabled={loading || !manualPath.trim()}
              className="px-2.5 py-1 bg-neutral-900 hover:bg-red-950 border border-red-900 hover:border-red-600 text-white font-mono text-xs rounded transition-all disabled:opacity-40"
            >
              Autoriser &amp; Explorer
            </button>
          </div>

          {/* Status feedback message */}
          {statusMessage && (
            <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 bg-neutral-900/90 border border-red-900/50 rounded text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <span className="truncate">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Content Explorer: Two columns (FileList on Left, Code Viewer on Right) */}
        <div className="flex-1 min-h-[360px] grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-black">
          
          {/* LEFT: File List & Search */}
          <div className="md:col-span-4 border-r border-red-950/80 flex flex-col bg-neutral-950/50">
            <div className="p-2 border-b border-neutral-900">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer (.py, .sh, .js, .env)..."
                  className="w-full bg-black border border-neutral-800 focus:border-red-600 rounded pl-8 pr-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs">
              {authorizedFiles.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 space-y-2">
                  <FolderOpen className="w-8 h-8 mx-auto text-neutral-600 stroke-[1.5]" />
                  <p className="text-xs">Aucun dossier Mac n'est encore autorisé.</p>
                  <p className="text-[11px] text-neutral-600">
                    Cliquez sur "Autoriser un dossier du Mac" pour accorder l'accès via le Finder.
                  </p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 text-xs">
                  Aucun fichier correspondant à "{searchQuery}".
                </div>
              ) : (
                filteredFiles.map((file, idx) => {
                  const isSelected = selectedFile?.path === file.path;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectFile(file)}
                      className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-950/80 text-white border border-red-600 font-bold'
                          : file.isDirectory
                            ? 'text-neutral-400 hover:bg-neutral-900/60'
                            : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.isDirectory ? (
                          <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        ) : file.name.endsWith('.py') || file.name.endsWith('.sh') || file.name.endsWith('.js') || file.name.endsWith('.ts') ? (
                          <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                      {!file.isDirectory && file.size > 0 && (
                        <span className="text-[10px] text-neutral-500 shrink-0">
                          {(file.size / 1024).toFixed(1)} Ko
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Folder summary footer */}
            {folderName && (
              <div className="p-2 border-t border-neutral-900 bg-black/60 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
                <span className="truncate text-red-400">📂 {folderName}</span>
                <span className="text-neutral-500 shrink-0">{authorizedFiles.length} fichiers</span>
              </div>
            )}
          </div>

          {/* RIGHT: File Content Viewer / Editor & Chat Actions */}
          <div className="md:col-span-8 flex flex-col bg-black">
            {selectedFile ? (
              <>
                {/* File Header Details */}
                <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-red-950/80 bg-neutral-950">
                  <div className="flex items-center gap-2 truncate font-mono text-xs">
                    <FileCode className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-white font-bold truncate">{selectedFile.name}</span>
                    <span className="text-neutral-500 text-[11px]">
                      ({(selectedFile.size / 1024).toFixed(1)} Ko)
                    </span>
                    <span className="text-[10px] text-green-400 bg-green-950/60 border border-green-800 px-1.5 py-0.2 rounded">
                      Autorisé par l'utilisateur
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Inject into Chat button */}
                    <button
                      onClick={handleInjectIntoChat}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition-all shadow-[0_0_8px_rgba(220,38,38,0.4)] cursor-pointer"
                      title="Envoie ce fichier directement à Dark-GPT pour audit de sécurité ou revue"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Audit dans le Chat</span>
                    </button>

                    {/* Save to Mac file */}
                    <button
                      onClick={handleSaveToMac}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-600 text-white text-xs rounded transition-all disabled:opacity-50 cursor-pointer"
                      title="Sauvegarder les modifications apportées directement sur votre Mac"
                    >
                      <Save className="w-3.5 h-3.5 text-neutral-300" />
                      <span>{saving ? 'Sauvegarde...' : 'Sauvegarder sur Mac'}</span>
                    </button>
                  </div>
                </div>

                {/* Editor / Text Preview */}
                <div className="flex-1 p-2 overflow-hidden flex flex-col">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full flex-1 bg-neutral-950 text-neutral-200 border border-neutral-900 focus:border-red-800 rounded p-3 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-red-900 selection:text-white"
                    placeholder="Contenu du fichier..."
                    spellCheck={false}
                  />
                </div>

                {/* Footer notes */}
                <div className="px-3 py-1.5 bg-neutral-950 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                  <span>Chemin : {selectedFile.path}</span>
                  <span>{fileContent.split('\n').length} lignes | {fileContent.length} caractères</span>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-3">
                <HardDrive className="w-12 h-12 text-neutral-700 stroke-[1.5]" />
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm font-mono">
                    Sélectionnez un fichier pour l'analyser ou l'auditer
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-md">
                    Autorisez un dossier de votre Mac avec le bouton ci-dessus pour inspecter les scripts, configs, logs ou codes sources directement dans DARK-GPT.
                  </p>
                </div>
                <button
                  onClick={handleOpenDirectoryPicker}
                  className="mt-2 px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-white text-xs font-mono rounded transition-all"
                >
                  [📂 Ouvrir le Finder macOS]
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Modal Bottom Security Notice */}
        <div className="px-4 py-2.5 bg-neutral-950 border-t border-red-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>
              <strong>Garantie Confidentialité :</strong> Aucun fichier n'est téléversé vers un cloud tiers. Tout reste confiné sur votre machine.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-black border border-neutral-800 hover:border-red-600 text-neutral-300 hover:text-white text-xs rounded transition-all"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
