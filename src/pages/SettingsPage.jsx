import { useState, useEffect } from 'react';
import { useData } from '../store/DataContext';
import { Download, Upload, Trash2, Shield, Clock, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, deleteAllData, exportAllData, importData } = useData();
  const [importStatus, setImportStatus] = useState('');

  const [form, setForm] = useState({
    factoryName: 'Factory-A',
    workingHours: 10,
    workingDays: 6,
    defaultEfficiency: 65
  });

  useEffect(() => {
    if (settings) {
      setForm({
        factoryName: settings.factoryName || 'Factory-A',
        workingHours: settings.workingHours || 10,
        workingDays: settings.workingDays || 6,
        defaultEfficiency: settings.defaultEfficiency || 65
      });
    }
  }, [settings]);

  async function handleSaveConfig() {
    try {
      await updateSettings(form);
      setImportStatus('Factory configuration updated successfully!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setImportStatus('Failed to update configuration.');
      setTimeout(() => setImportStatus(''), 3000);
    }
  }

  function handleExportJSON() {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `KAD_Planning_Backup_${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      setImportStatus(ok ? 'Data imported successfully!' : 'Import failed — invalid format');
      setTimeout(() => setImportStatus(''), 3000);
    };
    reader.readAsText(file);
  }

  function handleDeleteAll() {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      deleteAllData();
      setImportStatus('All data deleted successfully!');
      setTimeout(() => setImportStatus(''), 3000);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header"><div><h2>Settings</h2><p>System configuration and data management</p></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="kpi-icon primary"><Globe size={18} /></div>
            <div><div style={{ fontWeight: 700 }}>Factory Configuration</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>General production settings</div></div>
          </div>
          <div className="form-group">
            <label className="form-label">Factory Name</label>
            <input className="input" value={form.factoryName} onChange={e => setForm(f => ({ ...f, factoryName: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Working Hours/Day</label>
              <input className="input" type="number" value={form.workingHours} onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Working Days/Week</label>
              <input className="input" type="number" value={form.workingDays} onChange={e => setForm(f => ({ ...f, workingDays: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Default Efficiency %</label>
            <input className="input" type="number" value={form.defaultEfficiency} onChange={e => setForm(f => ({ ...f, defaultEfficiency: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={handleSaveConfig} style={{ width: '100%' }}>Save Configuration</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="kpi-icon warning"><Shield size={18} /></div>
            <div><div style={{ fontWeight: 700 }}>User Roles</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Access control (UI-level)</div></div>
          </div>
          {[{ role: 'Admin', desc: 'Full system control', badge: 'primary' }, { role: 'Planner', desc: 'Edit planning & orders', badge: 'info' }, { role: 'Line Manager', desc: 'Update production data', badge: 'success' }, { role: 'Viewer', desc: 'Read-only access', badge: 'muted' }].map(r => (
            <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div><div style={{ fontWeight: 600, fontSize: '13px' }}>{r.role}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.desc}</div></div>
              <span className={`badge badge-${r.badge}`}>{r.role === 'Admin' ? 'CURRENT' : 'AVAILABLE'}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="kpi-icon success"><Download size={18} /></div>
            <div><div style={{ fontWeight: 700 }}>Data Management</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Export, import, and reset data</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={handleExportJSON}><Download size={14} />Export All Data (JSON)</button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}><Upload size={14} />Import Data (JSON)<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} /></label>
            <button className="btn btn-danger" onClick={handleDeleteAll}><Trash2 size={14} />Delete All Data</button>
          </div>
          {importStatus && <div style={{ marginTop: '12px', padding: '10px', borderRadius: 'var(--radius-sm)', background: importStatus.includes('success') ? 'var(--success-bg)' : 'var(--danger-bg)', color: importStatus.includes('success') ? 'var(--success)' : 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>{importStatus}</div>}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div className="kpi-icon info"><Clock size={18} /></div>
            <div><div style={{ fontWeight: 700 }}>About</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System information</div></div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            <div style={{ marginBottom: '8px' }}><strong>KAD Production Planning System</strong></div>
            <div style={{ marginBottom: '4px' }}>Version: {import.meta.env.VITE_APP_VERSION || '1.0.0'}</div>
            <div style={{ marginBottom: '4px' }}>Engine: Dynamic Formula Engine v1</div>
            <div style={{ marginBottom: '4px' }}>Storage: Supabase Cloud DB</div>
            <div style={{ marginBottom: '4px', color: 'var(--text-muted)' }}>Built for RMG Industry Production Planning</div>
          </div>
        </div>
      </div>
    </div>
  );
}
