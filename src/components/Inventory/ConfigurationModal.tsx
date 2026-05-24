import React, { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
import { X } from 'lucide-react';
import styles from './ConfigurationModal.module.css';

interface ConfigurationModalProps {
  appName: string;
  serverName: string;
  config: AppConfig;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  readOnly: boolean;
}

export const ConfigurationModal = ({ appName, serverName, config, onClose, onSave, readOnly }: ConfigurationModalProps) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = (field: keyof AppConfig, value: any) => {
    if (readOnly) return;
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h3>Configure Deployment</h3>
            <span className={styles.subtitle}>{appName} @ {serverName}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label>Start Script Path</label>
            <input 
              type="text" 
              value={localConfig.startScriptPath}
              onChange={e => handleChange('startScriptPath', e.target.value)}
              disabled={readOnly}
              placeholder="/opt/scripts/start.sh"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Start Message</label>
            <input 
              type="text" 
              value={localConfig.startMessage}
              onChange={e => handleChange('startMessage', e.target.value)}
              disabled={readOnly}
              placeholder="e.g. Started successfully"
            />
          </div>

          <div className={styles.toggleGroup}>
            <label className={`${styles.toggleLabel} ${readOnly ? styles.disabled : ''}`}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Auto Start on Boot</span>
                <span className={styles.toggleDesc}>Automatically launch this application when the server starts.</span>
              </div>
              <div className={styles.switchWrapper}>
                <input 
                  type="checkbox"
                  className={styles.switchInput}
                  checked={localConfig.autoStart}
                  onChange={e => handleChange('autoStart', e.target.checked)}
                  disabled={readOnly}
                />
                <div className={styles.switchSlider}></div>
              </div>
            </label>
          </div>

          <div className={styles.formGroup}>
            <label>Historical Comments</label>
            <textarea 
              value={localConfig.comments}
              onChange={e => handleChange('comments', e.target.value)}
              disabled={readOnly}
              placeholder="Add deployment notes or history here..."
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Run As User (Optional)</label>
            <input 
              type="text" 
              value={localConfig.user || ''}
              onChange={e => handleChange('user', e.target.value)}
              disabled={readOnly}
              placeholder="e.g. gridgain"
            />
          </div>
        </div>

        <div className={styles.footer}>
          {readOnly ? (
            <button className={styles.btnSecondary} onClick={onClose}>Close</button>
          ) : (
            <>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleSave}>Apply Changes</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
