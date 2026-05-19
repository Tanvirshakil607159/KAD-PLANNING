import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider, useData } from './store/DataContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import PlanningBoard from './pages/PlanningBoard';
import OrderManagement from './pages/OrderManagement';
import LineManagement from './pages/LineManagement';
import ProductionTracking from './pages/ProductionTracking';
import KPIDashboard from './pages/KPIDashboard';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const { loading, error } = useData();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const res = await fetch('https://raw.githubusercontent.com/Tanvirshakil607159/KAD-PLANNING/main/package.json');
        if (res.ok) {
          const remotePackage = await res.json();
          const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
          if (remotePackage.version && remotePackage.version !== currentVersion) {
            setUpdateAvailable(true);
            setRemoteVersion(remotePackage.version);
          }
        }
      } catch (err) {
        console.warn('Could not check for updates:', err);
      }
    }
    checkForUpdates();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f14', color: '#fff', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-muted)' }}>Connecting to Supabase Cloud DB...</div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f14', color: '#fff', gap: '20px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--danger)' }}>Database Connection Error</div>
        <div style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '14px', lineHeight: '1.5' }}>{error}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Please verify your internet connection and ensure your Supabase configuration is correct.</div>
        <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '8px' }}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Header />
        {updateAvailable && (
          <div style={{
            background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>🚀</span>
              <span>A new version of KAD Planning is available (<strong>v{remoteVersion}</strong>). Download to get latest updates!</span>
            </div>
            <button
              onClick={() => {
                if (window.require) {
                  const { shell } = window.require('electron');
                  shell.openExternal('https://github.com/Tanvirshakil607159/KAD-PLANNING/releases');
                } else {
                  window.open('https://github.com/Tanvirshakil607159/KAD-PLANNING/releases', '_blank');
                }
              }}
              style={{
                background: 'var(--primary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Download Installer
            </button>
          </div>
        )}
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planning" element={<PlanningBoard />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/lines" element={<LineManagement />} />
            <Route path="/production" element={<ProductionTracking />} />
            <Route path="/kpi" element={<KPIDashboard />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </DataProvider>
  );
}
