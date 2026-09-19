export interface AgentLoopData {
  objective: string;
  steps: string[];
  executedTools: string[];
  verification: string;
}

// ==== Double interface (panneau Artifact façon Claude) ====
export type ThemeStyle = 'minimalist' | 'hacker';
export type ThemeLuminosity = 'light' | 'dark';

export interface Artifact {
  id: string;
  title: string;
  code: string;
  language: string;
  isOpen: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64 data URL
  imageName?: string;
  timestamp?: string;
  reasoningTime?: number; // Duration in seconds
  reasoningSteps?: string[];
  agentLoop?: AgentLoopData;
  requiresConfirmation?: boolean;
  riskDetails?: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  pluginUsed?: string;
}

export type PluginId = 'web_search' | 'doc_gen' | 'code_interpreter' | 'deep_reasoning' | 'cyber_audit';

export interface PluginMeta {
  id: PluginId;
  name: string;
  shortDesc: string;
  icon: string;
  enabled: boolean;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface Project {
  name: string;
  description: string;
  files: ProjectFile[];
  created_at: string;
  updated_at: string;
  requirements?: string[];
}

export interface AppConfig {
  api_key?: string;
  system_message: string;
  model: string;
  server_url: string;
  provider: 'gemini' | 'ollama' | 'simulation';
  language?: string;
}

export type AppView = 
  | 'startup'
  | 'welcome'
  | 'menu'
  | 'chat'
  | 'projects'
  | 'create_project'
  | 'edit_project'
  | 'run_project'
  | 'settings'
  | 'sessions'
  | 'updates';

export interface MacAuthorizedFile {
  name: string;
  path: string;
  size: number;
  type?: string;
  lastModified?: number;
  content?: string;
  isDirectory: boolean;
  handle?: any; // FileSystemFileHandle or FileSystemDirectoryHandle
}

export interface MacSystemInfo {
  isMac: boolean;
  platform: string;
  userHome: string;
  username: string;
  authorizedPaths: string[];
}

export interface CoworkActionRequest {
  id: string;
  type: 'write_file' | 'modify_file' | 'create_file' | 'run_script' | 'dreamina_browser_automation' | 'github_auto_push';
  title: string;
  path: string;
  content: string;
  explanation: string;
  status: 'pending' | 'authorized' | 'rejected' | 'modified';
  timestamp: string;
  metadata?: {
    imagePrompt?: string;
    imageUrl?: string;
    commitMessage?: string;
    branch?: string;
  };
}

export interface CoworkLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'danger';
  message: string;
}

export interface CoworkFile {
  name: string;
  path: string;
  size: number;
  content: string;
  handle?: any;
  origin: 'native_fs' | 'drag_drop';
  isImage?: boolean;
  previewUrl?: string;
}

export interface GitHubCommitRecord {
  id: string;
  hash: string;
  message: string;
  timestamp: string;
  branch: string;
  filesCount: number;
  status: 'synced' | 'pending' | 'pushed';
}
