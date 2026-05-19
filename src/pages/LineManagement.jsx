import { useState, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { smartLoadBalance, recommendLine } from '../engine/planning';
import { formatNumber, uid } from '../utils/format';
import { Plus, Settings, Zap, Users, Monitor, X, Cpu } from 'lucide-react';

export default function LineManagement() {
  const { lines, orders, productionRecords, shipments, addLine, updateLine, deleteLine } = useData();
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', floor: 'Floor-1', factory: 'Factory-A', capacity: 500, operators: 35, machines: 30, efficiency: 65, status: 'ACTIVE' });

  const loadInfo = useMemo(() => smartLoadBalance(lines, orders, productionRecords), [lines, orders, productionRecords]);

  function openAdd() { setForm({ name: '', floor: 'Floor-1', factory: 'Factory-A', capacity: 500, operators: 35, machines: 30, efficiency: 65, status: 'ACTIVE' }); setModal('add'); }
  function openEdit(line) { setForm({ ...line }); setModal(line); }

  function handleSave() {
    if (!form.name) return;
    const data = { ...form, capacity: +form.capacity, operators: +form.operators, machines: +form.machines, efficiency: +form.efficiency };
    if (modal === 'add') { addLine({ ...data, id: uid('line') }); } else { updateLine(modal.id, data); }
    setModal(null);
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Line Management</h2><p>{lines.length} production lines — {loadInfo.overloaded} overloaded, {loadInfo.underloaded} underloaded</p></div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />Add Line</button>
        </div>
      </div>

      {loadInfo.suggestions.length > 0 && (
        <div className="card" style={{ marginBottom: '20px', border: '1px solid var(--warning)', background: 'var(--warning-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Zap size={16} style={{ color: 'var(--warning)' }} />
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>Load Balance Suggestions</span>
          </div>
          {loadInfo.suggestions.map((s, i) => (
            <div key={i} style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '4px' }}>
              Move <strong>{s.orderPO}</strong> from {s.fromLine} → {s.toLine} ({s.reason})
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {lines.map(line => {
          const ll = loadInfo.lineLoads.find(l => l.line.id === line.id);
          const util = ll ? ll.utilization : 0;
          const lineOrders = orders.filter(o => o.assignedLineId === line.id && o.status !== 'COMPLETED' && o.status !== 'SHIPPED');
          const progColor = util > 90 ? 'danger' : util > 70 ? 'warning' : 'success';

          return (
            <div key={line.id} className="line-card">
              <div className="line-card-header">
                <div>
                  <div className="line-card-name">{line.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{line.floor} • {line.factory}</div>
                </div>
                <span className={`badge badge-${line.status === 'ACTIVE' ? 'success' : line.status === 'MAINTENANCE' ? 'warning' : 'muted'}`}>
                  <span className={`status-dot ${line.status === 'ACTIVE' ? 'success' : 'warning'}`} />{line.status}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Utilization</span>
                  <span style={{ fontWeight: 700 }}>{util}%</span>
                </div>
                <div className="progress-bar" style={{ height: '8px' }}>
                  <div className={`progress-fill ${progColor}`} style={{ width: `${Math.min(100, util)}%` }} />
                </div>
              </div>

              <div className="line-card-stats">
                <div className="line-stat"><div className="line-stat-value">{formatNumber(line.capacity)}</div><div className="line-stat-label">Capacity/Day</div></div>
                <div className="line-stat"><div className="line-stat-value">{line.efficiency}%</div><div className="line-stat-label">Efficiency</div></div>
                <div className="line-stat"><div className="line-stat-value">{line.operators}</div><div className="line-stat-label">Operators</div></div>
                <div className="line-stat"><div className="line-stat-value">{lineOrders.length}</div><div className="line-stat-label">Active Orders</div></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(line)}><Settings size={13} />Configure</button>
                <button className="btn-icon" style={{ width: '32px', height: '32px', color: 'var(--danger)' }} onClick={() => { if (confirm('Delete line?')) deleteLine(line.id); }}><X size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{modal === 'add' ? 'New Line' : `Edit ${form.name}`}</h2><button className="btn-icon" onClick={() => setModal(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                <div className="form-group"><label className="form-label">Line Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Line 01" /></div>
                <div className="form-group"><label className="form-label">Floor</label><select className="select" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}><option>Floor-1</option><option>Floor-2</option><option>Floor-3</option></select></div>
                <div className="form-group"><label className="form-label">Capacity/Day</label><input className="input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Operators</label><input className="input" type="number" value={form.operators} onChange={e => setForm(f => ({ ...f, operators: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Machines</label><input className="input" type="number" value={form.machines} onChange={e => setForm(f => ({ ...f, machines: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Efficiency %</label><input className="input" type="number" value={form.efficiency} onChange={e => setForm(f => ({ ...f, efficiency: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Status</label><select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="ACTIVE">Active</option><option value="MAINTENANCE">Maintenance</option><option value="IDLE">Idle</option></select></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create' : 'Save'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
