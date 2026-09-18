import React, { useState, useEffect } from 'react';
import { Project, ProjectFile } from '../types.ts';
import { ArrowLeft, Play, Plus, Trash2, Edit3, Save, FileCode, Terminal } from 'lucide-react';

interface ProjectManagerProps {
  initialView?: 'list' | 'create' | 'edit' | 'run';
  onBackToMenu: () => void;
  activeMode?: 'defense' | 'hacker';
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  initialView = 'list',
  onBackToMenu,
  activeMode = 'hacker'
}) => {
  const isGreen = activeMode === 'defense';
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [runLogs, setRunLogs] = useState<string>('');

  // Create project form
  const [projectName, setProjectName] = useState<string>('');
  const [projectDesc, setProjectDesc] = useState<string>('');
  const [generatingWithAI, setGeneratingWithAI] = useState<boolean>(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.warn("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = async (name: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${name}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
        if (data.files && data.files.length > 0) {
          setActiveFile(data.files[0]);
          setFileContent(data.files[0].content || '');
        } else {
          setActiveFile(null);
          setFileContent('');
        }
      }
    } catch (e) {
      console.warn("Error loading project details:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setGeneratingWithAI(true);
      // Ask backend to create project
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        await fetchProjects();
        handleSelectProject(data.name);
        setProjectName('');
        setProjectDesc('');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Error creating project: ${e.message}`);
    } finally {
      setGeneratingWithAI(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedProject || !activeFile) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.name}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: activeFile.path,
          content: fileContent
        })
      });

      if (res.ok) {
        alert('File saved successfully!');
        // Update local state
        activeFile.content = fileContent;
      }
    } catch (e: any) {
      alert(`Error saving file: ${e.message}`);
    }
  };

  const handleDeleteProject = async (name: string) => {
    if (!confirm(`Delete project "${name}" and all its files?`)) return;
    try {
      const res = await fetch(`/api/projects/${name}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedProject?.name === name) {
          setSelectedProject(null);
          setActiveFile(null);
        }
        fetchProjects();
      }
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  const handleRunProject = async (name: string) => {
    try {
      setRunLogs(`[x_x] INITIALIZING SANDBOX FOR: ${name}...\n`);
      const res = await fetch(`/api/projects/${name}/run`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRunLogs(data.output || 'Execution finished.');
      }
    } catch (e: any) {
      setRunLogs(`[!] Execution failed: ${e.message}`);
    }
  };

  return (
    <div id="project-manager-container" className={`flex flex-col h-full bg-black text-white font-mono border ${
      isGreen ? 'border-emerald-600' : 'border-red-600'
    }`}>
      {/* Top Bar */}
      <div className={`border-b px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm ${
        isGreen ? 'bg-emerald-950/40 border-emerald-600' : 'bg-red-950/40 border-red-600'
      }`}>
        <div className="flex items-center gap-2">
          <button
            id="pm-back-button"
            onClick={onBackToMenu}
            className={`flex items-center gap-1 px-2 py-0.5 border transition-colors ${
              isGreen 
                ? 'text-emerald-400 border-emerald-600 hover:bg-emerald-600/20 hover:text-white' 
                : 'text-red-500 border-red-600 hover:bg-red-600/20 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>MENU</span>
          </button>
          <span className={`font-bold tracking-wider ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
            {isGreen ? '[🛡️] DEFENSIVE & AUDIT WORKSPACE' : '[x_x] PROJECT WORKSPACE'}
          </span>
        </div>

        <div className="text-xs text-neutral-400">
          {projects.length} PROJECTS REGISTERED
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Project List & Creator */}
        <div className={`md:col-span-4 border-r flex flex-col h-full overflow-y-auto bg-black p-3 space-y-4 ${
          isGreen ? 'border-emerald-900/60' : 'border-red-900/60'
        }`}>
          {/* New Project Accordion */}
          <div className={`border p-3 space-y-2 ${
            isGreen ? 'border-emerald-900/80 bg-emerald-950/20' : 'border-red-900/80 bg-red-950/20'
          }`}>
            <div className={`font-bold text-xs flex items-center gap-1.5 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
              <Plus className="w-3.5 h-3.5" />
              CREATE NEW PROJECT
            </div>
            <form onSubmit={handleCreateProject} className="space-y-2">
              <input
                id="create-project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nom du projet (ex: wifi-scanner)"
                className={`w-full bg-black border px-2 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none ${
                  isGreen ? 'border-emerald-900 focus:border-emerald-500' : 'border-red-900 focus:border-red-600'
                }`}
              />
              <textarea
                id="create-project-desc"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Description / fonctionnalités souhaitées..."
                rows={2}
                className={`w-full bg-black border px-2 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none resize-none ${
                  isGreen ? 'border-emerald-900 focus:border-emerald-500' : 'border-red-900 focus:border-red-600'
                }`}
              />
              <button
                id="create-project-submit"
                type="submit"
                disabled={generatingWithAI || !projectName.trim()}
                className={`w-full py-1 border text-white text-xs font-bold transition-colors disabled:opacity-40 ${
                  isGreen 
                    ? 'bg-emerald-950/70 border-emerald-600 hover:bg-emerald-600 hover:text-black' 
                    : 'bg-red-950/70 border-red-600 hover:bg-red-600'
                }`}
              >
                {generatingWithAI ? 'GENERATING WITH AI...' : 'GENERATE & CREATE'}
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="space-y-2 flex-1">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
              Available Projects
            </div>
            {projects.length === 0 ? (
              <div className="text-neutral-600 text-xs italic p-2">
                No projects found. Create one above.
              </div>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.name}
                  onClick={() => handleSelectProject(proj.name)}
                  className={`border px-3 py-2 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                    selectedProject?.name === proj.name
                      ? isGreen 
                        ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' 
                        : 'border-red-600 bg-red-950/40 text-white font-bold'
                      : isGreen 
                        ? 'border-neutral-900 hover:border-emerald-900 text-neutral-300' 
                        : 'border-neutral-900 hover:border-red-900 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunProject(proj.name);
                      }}
                      title="Run Project"
                      className="p-1 hover:text-green-400"
                    >
                      <Play className={`w-3 h-3 hover:text-green-400 ${isGreen ? 'text-emerald-400' : 'text-red-500'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(proj.name);
                      }}
                      title="Delete Project"
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3 text-neutral-600 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Execution Sandbox */}
        <div className="md:col-span-8 flex flex-col h-full bg-neutral-950 overflow-hidden">
          {selectedProject ? (
            <div className="flex flex-col h-full">
              {/* Files Tabs */}
              <div className={`bg-black border-b flex items-center overflow-x-auto px-2 py-1 gap-1 ${
                isGreen ? 'border-emerald-900/60' : 'border-red-900/60'
              }`}>
                {(selectedProject.files || []).map((file) => (
                  <button
                    key={file.path}
                    onClick={() => {
                      setActiveFile(file);
                      setFileContent(file.content || '');
                    }}
                    className={`px-3 py-1 text-xs border flex items-center gap-1.5 transition-colors ${
                      activeFile?.path === file.path
                        ? isGreen 
                          ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold' 
                          : 'border-red-600 bg-red-950/30 text-white font-bold'
                        : 'border-transparent hover:border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span>{file.path}</span>
                  </button>
                ))}

                <div className="ml-auto flex items-center gap-2 pr-2">
                  <button
                    id="save-file-button"
                    onClick={handleSaveFile}
                    className={`px-2.5 py-1 border text-white text-xs transition-colors flex items-center gap-1 font-bold ${
                      isGreen 
                        ? 'bg-emerald-950 border-emerald-600 hover:bg-emerald-600 hover:text-black' 
                        : 'bg-red-950 border-red-600 hover:bg-red-600'
                    }`}
                  >
                    <Save className="w-3 h-3" />
                    <span>SAVE</span>
                  </button>
                  <button
                    id="run-file-button"
                    onClick={() => handleRunProject(selectedProject.name)}
                    className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-green-600 text-white text-xs hover:text-green-400 transition-colors flex items-center gap-1 font-bold"
                  >
                    <Play className="w-3 h-3 text-green-500" />
                    <span>RUN</span>
                  </button>
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 relative overflow-hidden flex flex-col">
                <textarea
                  id="project-code-editor"
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className={`w-full flex-1 bg-black p-4 font-mono text-xs sm:text-sm text-neutral-200 resize-none focus:outline-none ${
                    isGreen ? 'selection:bg-emerald-700' : 'selection:bg-red-700'
                  }`}
                  spellCheck={false}
                />
              </div>

              {/* Execution Console Terminal Output */}
              {runLogs && (
                <div className={`h-44 border-t bg-black p-3 font-mono text-xs overflow-y-auto space-y-1 ${
                  isGreen ? 'border-emerald-900' : 'border-red-900'
                }`}>
                  <div className="flex items-center justify-between text-neutral-500 border-b border-neutral-900 pb-1 mb-2">
                    <span className={`flex items-center gap-1.5 font-bold ${isGreen ? 'text-emerald-400' : 'text-red-500'}`}>
                      <Terminal className="w-3.5 h-3.5" />
                      SANDBOX CONSOLE OUTPUT
                    </span>
                    <button
                      onClick={() => setRunLogs('')}
                      className="hover:text-white"
                    >
                      CLEAR
                    </button>
                  </div>
                  <pre className={`whitespace-pre-wrap leading-relaxed ${isGreen ? 'text-emerald-400' : 'text-red-400'}`}>
                    {runLogs}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-600 space-y-3">
              <FileCode className={`w-12 h-12 ${isGreen ? 'text-emerald-900' : 'text-red-900'}`} />
              <div className="text-neutral-400 text-sm font-bold">
                NO PROJECT SELECTED
              </div>
              <div className="text-xs max-w-sm">
                Select a project from the left panel or create a new automated security toolkit with DARK-GPT AI.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
