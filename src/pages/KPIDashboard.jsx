import { useMemo } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { predictDelays, optimizationSuggestions } from '../engine/planning';
import { formatNumber, formatCurrency } from '../utils/format';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';

const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: '#334155', borderWidth: 1, cornerRadius: 8 } }, scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } } } };

export default function KPIDashboard() {
  const { orders, lines, productionRecords, shipments } = useData();

  const metrics = useMemo(() => {
    return orders.map(o => ({ order: o, ...computeOrderMetrics(o, productionRecords.filter(r => r.orderId === o.id), shipments.filter(s => s.orderId === o.id)) }));
  }, [orders, productionRecords, shipments]);

  const delays = useMemo(() => predictDelays(orders, productionRecords), [orders, productionRecords]);
  const optimizations = useMemo(() => optimizationSuggestions(orders, productionRecords, lines), [orders, productionRecords, lines]);

  const effByLine = useMemo(() => {
    const lineNames = lines.filter(l => l.status === 'ACTIVE').map(l => l.name);
    const effValues = lines.filter(l => l.status === 'ACTIVE').map(l => {
      const lineRecords = productionRecords.filter(r => r.lineId === l.id);
      const planned = lineRecords.reduce((s, r) => s + r.plannedQty, 0);
      const actual = lineRecords.reduce((s, r) => s + r.actualQty, 0);
      return planned > 0 ? +((actual / planned) * 100).toFixed(1) : 0;
    });
    return {
      labels: lineNames,
      datasets: [{ data: effValues, backgroundColor: effValues.map(v => v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444'), borderRadius: 6, barThickness: 30 }]
    };
  }, [lines, productionRecords]);

  const achievementData = useMemo(() => {
    const active = metrics.filter(m => m.order.status === 'IN_PROGRESS').slice(0, 10);
    return {
      labels: active.map(m => m.order.poNumber),
      datasets: [{ data: active.map(m => m.achievement), backgroundColor: active.map(m => m.achievement >= 80 ? '#10b981' : m.achievement >= 50 ? '#f59e0b' : '#ef4444'), borderRadius: 6, barThickness: 24 }]
    };
  }, [metrics]);

  const lossData = useMemo(() => {
    const totalLoss = metrics.reduce((s, m) => s + m.lossQty, 0);
    const totalLossVal = metrics.reduce((s, m) => s + m.lossValue, 0);
    const totalPlanned = metrics.reduce((s, m) => s + m.plannedProduced, 0);
    const totalActual = metrics.reduce((s, m) => s + m.producedQty, 0);
    return { totalLoss, totalLossVal, totalPlanned, totalActual, lossPct: totalPlanned > 0 ? +((totalLoss / totalPlanned) * 100).toFixed(1) : 0 };
  }, [metrics]);

  const statusDist = useMemo(() => {
    const counts = { OK: 0, AT_RISK: 0, TIGHT: 0, DONE: 0 };
    metrics.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return {
      labels: ['On Track', 'At Risk', 'Delayed', 'Done'],
      datasets: [{ data: [counts.OK, counts.AT_RISK, counts.TIGHT, counts.DONE], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'], borderWidth: 0 }]
    };
  }, [metrics]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>KPI Dashboard</h2><p>Performance analytics and insights</p></div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card success" style={{ padding: '16px' }}><div className="kpi-label">Avg Efficiency</div><div className="kpi-value" style={{ fontSize: '24px' }}>{metrics.length > 0 ? (metrics.reduce((s, m) => s + m.efficiency, 0) / metrics.filter(m => m.efficiency > 0).length).toFixed(1) : 0}%</div></div>
        <div className="kpi-card primary" style={{ padding: '16px' }}><div className="kpi-label">Avg Achievement</div><div className="kpi-value" style={{ fontSize: '24px' }}>{metrics.length > 0 ? (metrics.reduce((s, m) => s + m.achievement, 0) / metrics.length).toFixed(1) : 0}%</div></div>
        <div className="kpi-card danger" style={{ padding: '16px' }}><div className="kpi-label">Total Loss</div><div className="kpi-value" style={{ fontSize: '24px' }}>{formatNumber(lossData.totalLoss)} pcs</div><div className="kpi-sub">{formatCurrency(lossData.totalLossVal)} • {lossData.lossPct}%</div></div>
        <div className="kpi-card warning" style={{ padding: '16px' }}><div className="kpi-label">Delay Risk</div><div className="kpi-value" style={{ fontSize: '24px' }}>{delays.filter(d => d.risk === 'HIGH').length}</div><div className="kpi-sub">{delays.filter(d => d.risk === 'MEDIUM').length} medium risk</div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card"><h3>⚡ Line Efficiency</h3><div style={{ height: '260px' }}><Bar data={effByLine} options={{ ...chartOpts, indexAxis: 'y', scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, max: 100, ticks: { ...chartOpts.scales.x.ticks, callback: v => v + '%' } } } }} /></div></div>
        <div className="chart-card"><h3>📊 Order Status Distribution</h3><div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Doughnut data={statusDist} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10, usePointStyle: true } }, tooltip: chartOpts.plugins.tooltip }, cutout: '60%' }} /></div></div>
      </div>

      <div className="chart-grid">
        <div className="chart-card"><h3>🎯 Achievement by Order</h3><div style={{ height: '260px' }}><Bar data={achievementData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100, ticks: { ...chartOpts.scales.y.ticks, callback: v => v + '%' } } } }} /></div></div>
        <div className="chart-card">
          <h3>🔮 Delay Predictions</h3>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {delays.filter(d => d.risk !== 'LOW').length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No delay risks detected</div>}
            {delays.filter(d => d.risk !== 'LOW').slice(0, 8).map(d => (
              <div key={d.orderId} className="alert-item">
                <div className="alert-icon" style={{ background: d.risk === 'HIGH' ? 'var(--danger-bg)' : 'var(--warning-bg)' }}>
                  <AlertTriangle size={14} style={{ color: d.risk === 'HIGH' ? 'var(--danger)' : 'var(--warning)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{d.order.poNumber} — {d.order.buyer}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {d.delayDays > 0 ? `${d.delayDays} days delay projected` : 'Close to deadline'} • Avg: {formatNumber(d.avgDailyOutput)}/day
                  </div>
                </div>
                <span className={`badge badge-${d.risk === 'HIGH' ? 'danger' : 'warning'}`}>{d.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {optimizations.length > 0 && (
        <div className="card" style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}><Zap size={18} style={{ color: 'var(--warning)' }} /><h3 style={{ fontSize: '14px' }}>Optimization Suggestions</h3></div>
          {optimizations.map((s, i) => (
            <div key={i} className="alert-item" style={{ border: 'none' }}>
              <div className="alert-icon" style={{ background: 'var(--warning-bg)' }}><Zap size={14} style={{ color: 'var(--warning)' }} /></div>
              <div><div style={{ fontSize: '12px', fontWeight: 600 }}>{s.po}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.message}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
