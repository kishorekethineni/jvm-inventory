import React, { useState } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { Settings2, ArrowDownAZ, ArrowUpZA, Search } from 'lucide-react';
import { ConfigurationModal } from './ConfigurationModal';
import { AppConfig } from '@/types';
import styles from './MatrixGrid.module.css';

export const MatrixGrid = () => {
  const { data, updateMapping, isLoading, error } = useInventory();
  const { userContext } = useAuth();
  
  const [selectedCluster, setSelectedCluster] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [appSearch, setAppSearch] = useState('');
  const [serverSearch, setServerSearch] = useState('');
  const [appSortAsc, setAppSortAsc] = useState(true);
  const [serverSortAsc, setServerSortAsc] = useState(true);

  const canEdit = userContext?.role === 'Admin' || userContext?.role === 'Write';

  if (isLoading) {
    return <div className={styles.loadingState}>Loading inventory matrix...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>{error}</div>;
  }

  if (!data) return null;

  // 1. Filter by cluster
  let activeServers = selectedCluster === 'All' 
    ? data.servers 
    : data.serversByCluster[selectedCluster] || [];

  let activeApps = data.apps.filter(app => {
    return activeServers.some(server => data.mappings[app]?.[server]);
  });

  // 2. Filter by Search Query
  if (serverSearch.trim()) {
    const q = serverSearch.toLowerCase();
    activeServers = activeServers.filter(s => s.toLowerCase().includes(q));
  }
  if (appSearch.trim()) {
    const q = appSearch.toLowerCase();
    activeApps = activeApps.filter(a => a.toLowerCase().includes(q));
  }

  // 3. Sort
  activeServers = [...activeServers].sort((a, b) => serverSortAsc ? a.localeCompare(b) : b.localeCompare(a));
  activeApps = [...activeApps].sort((a, b) => appSortAsc ? a.localeCompare(b) : b.localeCompare(a));

  const handleCheckboxChange = (appName: string, serverName: string, config: AppConfig, checked: boolean) => {
    if (!canEdit) return;
    updateMapping(appName, serverName, { ...config, isRunning: checked });
  };

  const openConfig = (appName: string, serverName: string) => {
    setSelectedApp(appName);
    setSelectedServer(serverName);
    setIsModalOpen(true);
  };

  const closeConfig = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    setSelectedServer(null);
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.filterGroup}>
            <label htmlFor="cluster-select">Server Cluster:</label>
            <select 
              id="cluster-select"
              className={styles.clusterSelect}
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
            >
              <option value="All">All Clusters</option>
              {data.clusters.map(cluster => (
                <option key={cluster} value={cluster}>{cluster}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.toolbarRow}>
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Filter applications..." 
                value={appSearch}
                onChange={e => setAppSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button 
                className={styles.sortBtn} 
                onClick={() => setAppSortAsc(!appSortAsc)}
                title="Toggle Application Sort"
              >
                {appSortAsc ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
              </button>
            </div>
          </div>
          
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrapper}>
              <Search size={16} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Filter servers..." 
                value={serverSearch}
                onChange={e => setServerSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button 
                className={styles.sortBtn} 
                onClick={() => setServerSortAsc(!serverSortAsc)}
                title="Toggle Server Sort"
              >
                {serverSortAsc ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th className={styles.stickyCorner}>Application</th>
              {activeServers.map(server => (
                <th key={server} className={styles.stickyHeaderX}>{server}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeApps.map(app => (
              <tr key={app}>
                <td className={styles.stickyHeaderY}>
                  <span className={styles.appName}>{app}</span>
                </td>
                {activeServers.map(server => {
                  const config = data.mappings[app]?.[server] || {
                    isRunning: false,
                    startScriptPath: '',
                    startMessage: '',
                    autoStart: false,
                    comments: ''
                  };

                  return (
                    <td key={`${app}-${server}`} className={styles.cell}>
                      <div className={styles.cellContent}>
                        <label className={`${styles.checkboxLabel} ${!canEdit ? styles.disabled : ''}`}>
                          <input
                            type="checkbox"
                            checked={config.isRunning}
                            onChange={(e) => handleCheckboxChange(app, server, config, e.target.checked)}
                            disabled={!canEdit}
                            className={styles.checkbox}
                          />
                          <span className={styles.checkboxCustom}></span>
                        </label>
                        <button 
                          className={styles.configBtn}
                          onClick={() => openConfig(app, server)}
                          title="Configure mapping"
                        >
                          <Settings2 size={16} />
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedApp && selectedServer && (
        <ConfigurationModal
          appName={selectedApp}
          serverName={selectedServer}
          config={data.mappings[selectedApp]?.[selectedServer] || {
            isRunning: false,
            startScriptPath: '',
            startMessage: '',
            autoStart: false,
            comments: ''
          }}
          onClose={closeConfig}
          onSave={(newConfig) => {
            if (canEdit) {
              updateMapping(selectedApp, selectedServer, newConfig);
            }
            closeConfig();
          }}
          readOnly={!canEdit}
        />
      )}
    </div>
  );
};
