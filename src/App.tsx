import React from 'react';
import { useAuth, AuthProvider } from '@/context/AuthContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { LoginScreen } from '@/components/LoginScreen';
import { Layout } from '@/components/Layout';
import { MatrixGrid } from '@/components/Inventory/MatrixGrid';
import { CommitBanner } from '@/components/Inventory/CommitBanner';

const AppContent = () => {
  const { userContext, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b' }}>
        Loading Session...
      </div>
    );
  }

  if (!userContext) {
    return <LoginScreen />;
  }

  return (
    <InventoryProvider>
      <Layout>
        <MatrixGrid />
        <CommitBanner />
      </Layout>
    </InventoryProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
