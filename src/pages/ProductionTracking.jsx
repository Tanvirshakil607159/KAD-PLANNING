import { useState, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { formatNumber, formatDate, uid } from '../utils/format';
import { Save, Plus, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function ProductionTracking() {
  const { orders, lines, productionRecords, addProductionRecord, updateProductionRecord } = useData();
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'COMPLETED' || o.status === 'SHIPPED') return false;
      if (selectedLine && o.assignedLineId !== selectedLine) return false;
      return true;
    });
  }, [orders, selectedLine]);

  const dayRecords = useMemo(() => {
    return productionRecords.filter(r => r.date === selectedDate && (!selectedLine || r.lineId === selectedLine));
  }, [productionRecords, selectedDate, selectedLine]);

  const [entries, setEntries] = useState({});

  function getExisting(orderId) {
    return dayRecords.find(r => r.orderId === orderId);
  }

  function handleInput(orderId, field, value) {
    setEntries(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value }
    }));
  }

  function handleSave(order) {
    const entry = entries[order.id] || {};
    const existing = getExisting(order.id);
    const m = computeOrderMetrics(order, productionRecords.filter(r => r.orderId === order.id));
    const record = {
      orderId: order.id,
      lineId: order.assignedLineId,
      date: selectedDate,
      plannedQty: +entry.plannedQty || m.dailyTarget,
      actualQty: +entry.actualQty || 0,
      defects: +entry.defects || 0,
      hoursWorked: +entry.hoursWorked || order.workingHours,
      overtimeHours: +entry.overtimeHours || 0,
      remarks: entry.remarks || ''
    };

    if (existing) {
      updateProductionRecord(existing.id, record);
    } else {
      addProductionRecord({ ...record, id: uid('prod') });
    }
    setEntries(prev => { const n = { ...prev }; delete n[order.id]; return n; });
  }

  const summaryStats = useMemo(() => {
    const totalPlanned = dayRecords.reduce((s, r) => s + r.plannedQty, 0);
    const totalActual = dayRecords.reduce((s, r) => s + r.actualQty, 0);
    const totalDefects = dayRecords.reduce((s, r) => s + r.defects, 0);
    const eff = totalPlanned > 0 ? +((totalActual / totalPlanned) * 100).toFixed(1) : 0;
    return { totalPlanned, totalActual, totalDefects, efficiency: eff };
  }, [dayRecords]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Production Tracking</h2><p>Daily production input & monitoring</p></div>
      </div>

      <div className="filter-bar">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ marginBottom: '4px' }}>Date</label>
          <input className="input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ minWidth: '160px' }} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ marginBottom: '4px' }}>Line</label>
          <select className="select" value={selectedLine} onChange={e => setSelectedLine(e.target.value)} style={{ minWidth: '160px' }}>
            <option value="">All Lines</option>
            {lines.map(l => <option key={l.id} value={l.id}>{l.name} ({l.floor})</option>)}
          </select>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        <div className="kpi-card info" style={{ padding: '16px' }}>
          <div className="kpi-label">Planned</div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{formatNumber(summaryStats.totalPlanned)}</div>
        </div>
        <div className="kpi-card success" style={{ padding: '16px' }}>
          <div className="kpi-label">Actual</div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{formatNumber(summaryStats.totalActual)}</div>
        </div>
        <div className="kpi-card warning" style={{ padding: '16px' }}>
          <div className="kpi-label">Defects</div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{formatNumber(summaryStats.totalDefects)}</div>
        </div>
        <div className="kpi-card primary" style={{ padding: '16px' }}>
          <div className="kpi-label">Efficiency</div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{summaryStats.efficiency}%</div>
        </div>
      </div>

      <div className="data-table-wrap" style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Line</th><th>PO</th><th>Buyer</th><th>Style</th>
              <th className="num">Order Qty</th><th className="num">Balance</th>
              <th className="num">Daily Target</th><th className="num">Planned</th>
              <th className="num">Actual</th><th className="num">Defects</th>
              <th className="num">Hours</th><th className="num">OT</th>
              <th>Variance</th><th style={{ width: '70px' }}></th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map(order => {
              const m = computeOrderMetrics(order, productionRecords.filter(r => r.orderId === order.id));
              const existing = getExisting(order.id);
              const entry = entries[order.id] || {};
              const line = lines.find(l => l.id === order.assignedLineId);
              const planned = entry.plannedQty ?? existing?.plannedQty ?? m.dailyTarget;
              const actual = entry.actualQty ?? existing?.actualQty ?? '';
              const defects = entry.defects ?? existing?.defects ?? '';
              const hours = entry.hoursWorked ?? existing?.hoursWorked ?? order.workingHours;
              const ot = entry.overtimeHours ?? existing?.overtimeHours ?? 0;
              const variance = actual !== '' ? (+actual - +planned) : null;

              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{line?.name || '-'}</td>
                  <td style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>{order.poNumber}</td>
                  <td>{order.buyer}</td>
                  <td>{order.style}</td>
                  <td className="num">{formatNumber(order.orderQty)}</td>
                  <td className="num" style={{ color: 'var(--warning)' }}>{formatNumber(m.sewingBalance)}</td>
                  <td className="num" style={{ color: 'var(--info)' }}>{formatNumber(m.dailyTarget)}</td>
                  <td><input className="input" type="number" value={planned} onChange={e => handleInput(order.id, 'plannedQty', e.target.value)} style={{ width: '80px', padding: '5px 8px', textAlign: 'right' }} /></td>
                  <td><input className="input" type="number" value={actual} onChange={e => handleInput(order.id, 'actualQty', e.target.value)} style={{ width: '80px', padding: '5px 8px', textAlign: 'right' }} placeholder="0" /></td>
                  <td><input className="input" type="number" value={defects} onChange={e => handleInput(order.id, 'defects', e.target.value)} style={{ width: '60px', padding: '5px 8px', textAlign: 'right' }} placeholder="0" /></td>
                  <td><input className="input" type="number" value={hours} onChange={e => handleInput(order.id, 'hoursWorked', e.target.value)} style={{ width: '55px', padding: '5px 8px', textAlign: 'right' }} /></td>
                  <td><input className="input" type="number" value={ot} onChange={e => handleInput(order.id, 'overtimeHours', e.target.value)} style={{ width: '50px', padding: '5px 8px', textAlign: 'right' }} /></td>
                  <td>
                    {variance !== null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: variance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '12px' }}>
                        {variance >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {variance >= 0 ? '+' : ''}{variance}
                      </span>
                    )}
                  </td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => handleSave(order)}><Save size={12} /></button></td>
                </tr>
              );
            })}
            {activeOrders.length === 0 && (
              <tr><td colSpan={14} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No active orders for this selection</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
