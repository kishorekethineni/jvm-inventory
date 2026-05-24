import type { Role, InventoryData, GitHubFileMeta, AppConfig } from '@/types';
import rawMappings from './jvm_mappings.json';

const GITHUB_API_URL = 'https://api.github.com';

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});

export const transformMappings = (raw: any): InventoryData => {
  const appsSet = new Set<string>();
  const serversSet = new Set<string>();
  const mappings: Record<string, Record<string, AppConfig>> = {};
  
  const clustersSet = new Set<string>();
  const serversByCluster: Record<string, string[]> = {};

  const profiles = raw.__profiles__ || {};
  for (const [profileName, servers] of Object.entries(profiles)) {
    clustersSet.add(profileName);
    serversByCluster[profileName] = [];
    
    for (const [serverName, apps] of Object.entries(servers as any)) {
      serversSet.add(serverName);
      serversByCluster[profileName].push(serverName);
      
      for (const [appName, configRaw] of Object.entries(apps as any)) {
        const config: any = configRaw;
        appsSet.add(appName);
        if (!mappings[appName]) mappings[appName] = {};
        
        mappings[appName][serverName] = {
          isRunning: config.isRunning !== undefined ? config.isRunning : true,
          startScriptPath: config.startScriptPath || '',
          startMessage: config.startMessage || '',
          autoStart: !!config.autoStart,
          comments: config.comments || '',
          user: config.user || ''
        };
      }
    }
  }

  return {
    clusters: Array.from(clustersSet).sort(),
    serversByCluster,
    apps: Array.from(appsSet).sort(),
    servers: Array.from(serversSet).sort(),
    mappings
  };
};

export const buildLegacyFormat = (data: InventoryData) => {
  const payload: any = { __profiles__: {} };
  for (const cluster of data.clusters) {
    payload.__profiles__[cluster] = {};
    const servers = data.serversByCluster[cluster] || [];
    for (const server of servers) {
      const appsOnServer: any = {};
      for (const app of data.apps) {
        const config = data.mappings[app]?.[server];
        if (config) {
          appsOnServer[app] = {
            isRunning: config.isRunning,
            startScriptPath: config.startScriptPath,
            startMessage: config.startMessage || null,
            autoStart: config.autoStart,
            comments: config.comments || undefined,
            user: config.user || undefined,
          };
        }
      }
      // If we want to preserve servers even if they have no apps mapped in the matrix,
      // we just add the empty object or the populated object.
      payload.__profiles__[cluster][server] = appsOnServer;
    }
  }
  return payload;
};


// Use the legacy data as the initial seed data
export const MOCK_INVENTORY: InventoryData = transformMappings(rawMappings);

export async function verifyUser(token: string): Promise<{ login: string; avatar_url: string }> {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: getHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Invalid GitHub Token');
  }
  return response.json();
}

export async function getRole(owner: string, repo: string, username: string, token: string): Promise<Role> {
  try {
    const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/collaborators/${username}/permission`, {
      headers: getHeaders(token),
    });
    if (!response.ok) {
      return 'Read'; // Fallback to read if we can't get permissions but can see public repo, or handle appropriately
    }
    const data = await response.json();
    const perm = data.permission; // 'admin', 'write', 'read', 'none'
    if (perm === 'admin') return 'Admin';
    if (perm === 'write') return 'Write';
    return 'Read';
  } catch (err) {
    return 'Read';
  }
}

export async function fetchDbFile(owner: string, repo: string, path: string, token: string): Promise<GitHubFileMeta | null> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    headers: getHeaders(token),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${path}`);
  }
  const data = await response.json();
  return { sha: data.sha, content: data.content };
}

export async function commitDbFile(owner: string, repo: string, path: string, content: string, message: string, sha: string | null, token: string): Promise<string> {
  const body: any = {
    message,
    content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
  };
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...getHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to commit file: ${path}`);
  }
  
  const data = await response.json();
  return data.content.sha;
}

export async function appendHistoryLog(owner: string, repo: string, path: string, newLine: string, sha: string | null, token: string, existingContentBase64?: string): Promise<string> {
  let decodedContent = '';
  if (existingContentBase64) {
    decodedContent = decodeURIComponent(escape(atob(existingContentBase64)));
  }
  const newContent = decodedContent + (decodedContent.endsWith('\\n') ? '' : '\\n') + newLine + '\\n';
  return commitDbFile(owner, repo, path, newContent, 'Append history log', sha, token);
}
