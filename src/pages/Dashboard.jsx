import { useMemo } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { generateAlerts } from '../engine/alerts';
import { smartLoadBalance } from '../engine/planning';
import { formatNumber, formatCurrency, statusLabel } from '../utils/format';
import { Package, TrendingUp, AlertTriangle, Factory, DollarSign, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', titleColor: '#f1f5f9', bodyColor: '#cbd5e1', borderColor: '#334155', borderWidth: 1, cornerRadius: 8, padding: 10 } }, scales: { x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } }, y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 11 } } } } };

export default function Dashboard() {
  const { orders, lines, productionRecords, shipments, settings } = useData();

  const stats = useMemo(() => {
    const metrics = orders.map(o => ({ order: o, ...computeOrderMetrics(o, productionRecords.filter(r => r.orderId === o.id), shipments.filter(s => s.orderId === o.id)) }));
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
    const totalQty = orders.reduce((s, o) => s + o.orderQty, 0);
    const totalProduced = metrics.reduce((s, m) => s + m.producedQty, 0);
    const completion = totalQty > 0 ? +((totalProduced / totalQty) * 100).toFixed(1) : 0;
    const delayed = metrics.filter(m => m.status === 'TIGHT').length;
    const atRisk = metrics.filter(m => m.status === 'AT_RISK').length;
    const totalValue = metrics.reduce((s, m) => s + m.totalValue, 0);
    const activeLines = lines.filter(l => l.status === 'ACTIVE').length;
    const avgEff = metrics.filter(m => m.efficiency > 0).length > 0 ? +(metrics.filter(m => m.efficiency > 0).reduce((s, m) => s + m.efficiency, 0) / metrics.filter(m => m.efficiency > 0).length).toFixed(1) : 0;
    return { totalOrders, activeOrders, totalQty, totalProduced, completion, delayed, atRisk, totalValue, activeLines, totalLines: lines.length, avgEff, metrics };
  }, [orders, lines, productionRecords, shipments]);

  const alerts = useMemo(() => generateAlerts(orders, productionRecords, shipments).slice(0, 8), [orders, productionRecords, shipments]);
  const loadInfo = useMemo(() => smartLoadBalance(lines, orders, productionRecords), [lines, orders, productionRecords]);

  const buyerData = useMemo(() => {
    const map = {};
    orders.forEach(o => { map[o.buyer] = (map[o.buyer] || 0) + o.orderQty; });
    const labels = Object.keys(map);
    return { labels, datasets: [{ data: Object.values(map), backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#a78bfa','#f472b6','#14b8a6'], borderWidth: 0 }] };
  }, [orders]);

  const dailyOutput = useMemo(() => {
    const map = {};
    productionRecords.slice(-60).forEach(r => { map[r.date] = (map[r.date] || 0) + r.actualQty; });
    const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
    return {
      labels: sorted.map(([d]) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{ label: 'Output', data: sorted.map(([, v]) => v), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.1)', fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#6366f1' }]
    };
  }, [productionRecords]);

  const floorData = useMemo(() => {
    const floors = [...new Set(lines.map(l => l.floor))];
    const utils = floors.map(f => {
      const fLines = loadInfo.lineLoads.filter(ll => ll.line.floor === f);
      const avg = fLines.length > 0 ? +(fLines.reduce((s, l) => s + l.utilization, 0) / fLines.length).toFixed(0) : 0;
      return avg;
    });
    return {
      labels: floors,
      datasets: [{ label: 'Utilization %', data: utils, backgroundColor: utils.map(v => v > 90 ? '#ef4444' : v > 70 ? '#f59e0b' : '#10b981'), borderRadius: 6, barThickness: 40 }]
    };
  }, [lines, loadInfo]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Dashboard</h2><p>{settings?.factoryName || 'KAD Planning'} — Production overview and real-time metrics</p></div>
      </div>

      <div className="kpi-grid">
        <KPI icon={Package} color="primary" label="Total Orders" value={stats.totalOrders} sub={`${stats.activeOrders} active`} />
        <KPI icon={TrendingUp} color="success" label="Completion" value={`${stats.completion}%`} sub={`${formatNumber(stats.totalProduced)} / ${formatNumber(stats.totalQty)} pcs`} />
        <KPI icon={AlertTriangle} color="danger" label="Delayed" value={stats.delayed} sub={`${stats.atRisk} at risk`} />
        <KPI icon={Factory} color="info" label="Active Lines" value={`${stats.activeLines}/${stats.totalLines}`} sub={`Avg Eff: ${stats.avgEff}%`} />
        <KPI icon={DollarSign} color="warning" label="Total Value" value={formatCurrency(stats.totalValue)} sub={`${stats.totalOrders} orders`} />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>📈 Daily Output Trend</h3>
          <div style={{ height: '240px' }}><Line data={dailyOutput} options={{ ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } }} /></div>
        </div>
        <div className="chart-card">
          <h3>👔 Orders by Buyer</h3>
          <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={buyerData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 } }, tooltip: chartOpts.plugins.tooltip }, cutout: '65%' }} />
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>🏭 Floor Utilization</h3>
          <div style={{ height: '240px' }}><Bar data={floorData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100, ticks: { ...chartOpts.scales.y.ticks, callback: v => v + '%' } } } }} /></div>
        </div>
        <div className="chart-card">
          <h3>🔔 Recent Alerts</h3>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {alerts.length === 0 && <div className="empty-state" style={{ padding: '30px' }}><p>No alerts</p></div>}
            {alerts.map(a => (
              <div key={a.id} className="alert-item">
                <div className="alert-icon" style={{ background: a.severity === 'danger' ? 'var(--danger-bg)' : a.severity === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)' }}>
                  <AlertTriangle size={14} style={{ color: a.severity === 'danger' ? 'var(--danger)' : a.severity === 'warning' ? 'var(--warning)' : 'var(--success)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.message}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.buyer}</div>
                </div>
                <span className={`badge badge-${a.severity}`}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, color, label, value, sub }) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className={`kpi-icon ${color}`}><Icon size={20} /></div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
