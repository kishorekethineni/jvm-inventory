export type Role = 'Admin' | 'Write' | 'Read' | 'Dry-Run' | null;

export interface UserContext {
  username: string;
  token: string;
  owner: string;
  repo: string;
  role: Role;
  isDryRun: boolean;
}

export interface AppConfig {
  isRunning: boolean;
  startScriptPath: string;
  startMessage: string;
  autoStart: boolean;
  comments: string;
  user?: string;
}

export interface InventoryData {
  clusters: string[];
  serversByCluster: Record<string, string[]>;
  apps: string[];
  servers: string[];
  // apps -> servers -> config
  mappings: Record<string, Record<string, AppConfig>>;
}

export interface GitHubFileMeta {
  sha: string;
  content: string; // base64 encoded
}
