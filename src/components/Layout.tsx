import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { userContext, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'inventory' | 'cache' | 'validator'>('inventory');

  if (!userContext) return null;

  return (
    <div className={styles.layout}>
      {/* Global Navbar */}
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>Antigravity 2.0</div>
          <span className={styles.repoBadge}>{userContext.owner}/{userContext.repo}</span>
        </div>
        
        <div className={styles.navRight}>
          <div className={styles.userInfo}>
            <span className={styles.username}>{userContext.username}</span>
            <span className={`${styles.roleBadge} ${styles[userContext.role?.toLowerCase() || '']}`}>
              {userContext.role}
            </span>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Sub-navigation Layout */}
        <div className={styles.tabContainer}>
          <button 
            className={`${styles.tab} ${activeTab === 'inventory' ? styles.active : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'cache' ? styles.active : ''}`}
            onClick={() => setActiveTab('cache')}
            disabled
            title="Cache management coming soon"
          >
            Cache (Coming Soon)
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'validator' ? styles.active : ''}`}
            onClick={() => setActiveTab('validator')}
            disabled
            title="JVM validation suite coming soon"
          >
            JVM Validator (Coming Soon)
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'inventory' && children}
          {activeTab !== 'inventory' && (
            <div className={styles.placeholder}>
              <h3>Under Construction</h3>
              <p>This module is coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
