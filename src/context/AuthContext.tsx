import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role, UserContext } from '@/types';
import { verifyUser, getRole } from '@/api/github';

interface AuthContextType {
  userContext: UserContext | null;
  login: (username: string, token: string, owner: string, repo: string, isDryRun: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check session storage on mount
    const stored = sessionStorage.getItem('jvm_auth');
    if (stored) {
      setUserContext(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, token: string, owner: string, repo: string, isDryRun: boolean) => {
    setIsLoading(true);
    try {
      let role: Role = 'Read';
      if (isDryRun) {
        role = 'Admin';
      } else {
        const userData = await verifyUser(token);
        // We could verify username matches userData.login here if strictly required
        role = await getRole(owner, repo, username, token);
      }

      const newContext: UserContext = { username, token, owner, repo, role, isDryRun };
      setUserContext(newContext);
      sessionStorage.setItem('jvm_auth', JSON.stringify(newContext));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUserContext(null);
    sessionStorage.removeItem('jvm_auth');
  };

  return (
    <AuthContext.Provider value={{ userContext, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
