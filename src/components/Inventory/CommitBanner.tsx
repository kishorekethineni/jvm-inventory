import React from 'react';
import { useInventory } from '@/context/InventoryContext';
import { Save, XCircle } from 'lucide-react';
import styles from './CommitBanner.module.css';

export const CommitBanner = () => {
  const { hasUnsavedChanges, commitChanges, discardChanges, isLoading } = useInventory();

  if (!hasUnsavedChanges) return null;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.banner}>
        <div className={styles.message}>
          <span className={styles.indicator}></span>
          You have unsaved changes
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.discardBtn} 
            onClick={discardChanges}
            disabled={isLoading}
          >
            <XCircle size={16} />
            Discard
          </button>
          <button 
            className={styles.commitBtn} 
            onClick={commitChanges}
            disabled={isLoading}
          >
            <Save size={16} />
            {isLoading ? 'Committing...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
