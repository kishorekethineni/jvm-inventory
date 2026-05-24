import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppConfig, InventoryData, GitHubFileMeta } from '@/types';
import { useAuth } from './AuthContext';
import { fetchDbFile, commitDbFile, appendHistoryLog, MOCK_INVENTORY, transformMappings, buildLegacyFormat } from '@/api/github';

interface InventoryContextType {
  data: InventoryData | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  updateMapping: (appName: string, serverName: string, config: AppConfig) => void;
  commitChanges: () => Promise<void>;
  discardChanges: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { userContext } = useAuth();
  const [data, setData] = useState<InventoryData | null>(null);
  const [originalData, setOriginalData] = useState<InventoryData | null>(null);
  const [inventoryFileMeta, setInventoryFileMeta] = useState<GitHubFileMeta | null>(null);
  const [historyFileMeta, setHistoryFileMeta] = useState<GitHubFileMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changesLog, setChangesLog] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    if (!userContext) return;
    setIsLoading(true);
    setError(null);
    try {
      if (userContext.isDryRun) {
        setData(JSON.parse(JSON.stringify(MOCK_INVENTORY)));
        setOriginalData(JSON.parse(JSON.stringify(MOCK_INVENTORY)));
      } else {
        const invMeta = await fetchDbFile(userContext.owner, userContext.repo, 'db/inventory.json', userContext.token);
        const histMeta = await fetchDbFile(userContext.owner, userContext.repo, 'db/history.log', userContext.token);
        
        setInventoryFileMeta(invMeta);
        setHistoryFileMeta(histMeta);

        if (invMeta) {
          const rawData = JSON.parse(decodeURIComponent(escape(atob(invMeta.content))));
          const parsed = transformMappings(rawData);
          setData(parsed);
          setOriginalData(JSON.parse(JSON.stringify(parsed)));
        } else {
          // Initialize default if not found
          setData(JSON.parse(JSON.stringify(MOCK_INVENTORY)));
          setOriginalData(JSON.parse(JSON.stringify(MOCK_INVENTORY)));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false);
      setChangesLog([]);
    }
  }, [userContext]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateMapping = (appName: string, serverName: string, config: AppConfig) => {
    if (!data) return;
    const newData = { ...data };
    if (!newData.mappings[appName]) newData.mappings[appName] = {};
    newData.mappings[appName][serverName] = config;
    
    setData(newData);
    setHasUnsavedChanges(true);
    
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    const logLine = `[${timestamp}] User ${userContext?.username} updated configuration for App: ${appName} on Server: ${serverName}.`;
    setChangesLog(prev => [...prev, logLine]);
  };

  const discardChanges = () => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
      setHasUnsavedChanges(false);
      setChangesLog([]);
    }
  };

  const commitChanges = async () => {
    if (!userContext || !data || !hasUnsavedChanges) return;
    setIsLoading(true);
    setError(null);
    try {
      if (userContext.isDryRun) {
        console.log('Dry Run Commit Payload:', buildLegacyFormat(data));
        setOriginalData(JSON.parse(JSON.stringify(data)));
        setHasUnsavedChanges(false);
        setChangesLog([]);
      } else {
        // 1. Fetch latest SHA to prevent conflict
        const latestInvMeta = await fetchDbFile(userContext.owner, userContext.repo, 'db/inventory.json', userContext.token);
        const latestHistMeta = await fetchDbFile(userContext.owner, userContext.repo, 'db/history.log', userContext.token);

        // 2. Commit inventory.json
        const newInvSha = await commitDbFile(
          userContext.owner, 
          userContext.repo, 
          'db/inventory.json', 
          JSON.stringify(buildLegacyFormat(data), null, 2), 
          `Update inventory matrix by ${userContext.username}`, 
          latestInvMeta ? latestInvMeta.sha : null, 
          userContext.token
        );

        // 3. Append history
        if (changesLog.length > 0) {
          const logBlock = changesLog.join('\\n');
          await appendHistoryLog(
            userContext.owner,
            userContext.repo,
            'db/history.log',
            logBlock,
            latestHistMeta ? latestHistMeta.sha : null,
            userContext.token,
            latestHistMeta ? latestHistMeta.content : undefined
          );
        }

        // Reset state after success
        await loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to commit changes');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InventoryContext.Provider value={{ data, isLoading, error, hasUnsavedChanges, updateMapping, commitChanges, discardChanges }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
