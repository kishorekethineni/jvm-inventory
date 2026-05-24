import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginScreen.module.css';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('kishorekethineni');
  const [repo, setRepo] = useState('jvm-inventory');
  const [isDryRun, setIsDryRun] = useState(true); // Default to true for easy dev testing
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || (!token && !isDryRun) || !owner || !repo) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, token, owner, repo, isDryRun);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <span className={styles.badge}>ANTIGRAVITY 2.0</span>
          <h2>JVM Inventory</h2>
          <p>Login with your GitHub Personal Access Token to access and manage the cluster inventory matrix.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>GitHub Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="e.g. octocat" 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>
              GitHub PAT 
              <span className={styles.hint}> (Requires `repo` scope)</span>
            </label>
            <input 
              type="password" 
              value={token} 
              onChange={e => setToken(e.target.value)} 
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
              disabled={isDryRun}
            />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Target Owner</label>
              <input 
                type="text" 
                value={owner} 
                onChange={e => setOwner(e.target.value)} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Target Repo</label>
              <input 
                type="text" 
                value={repo} 
                onChange={e => setRepo(e.target.value)} 
              />
            </div>
          </div>

          <div className={styles.toggleGroup}>
            <label className={styles.toggleLabel}>
              <input 
                type="checkbox" 
                checked={isDryRun} 
                onChange={e => setIsDryRun(e.target.checked)} 
              />
              <span className={styles.toggleText}>Enable Dev Dry Run (Mocks API, Admin Role)</span>
            </label>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
