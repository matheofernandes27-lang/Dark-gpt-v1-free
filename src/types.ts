export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  reasoningTime?: number; // Duration in seconds
  reasoningSteps?: string[];
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
