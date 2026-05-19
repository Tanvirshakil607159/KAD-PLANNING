import { useMemo } from 'react';
import { useData } from '../store/DataContext';
import { generateAlerts } from '../engine/alerts';
import { AlertTriangle, CheckCircle, AlertCircle, Shirt, Clock } from 'lucide-react';

export default function AlertsPage() {
  const { orders, productionRecords, shipments } = useData();
  const alerts = useMemo(() => generateAlerts(orders, productionRecords, shipments), [orders, productionRecords, shipments]);

  const iconMap = { FABRIC: Shirt, DELAY: AlertTriangle, RISK: Clock, COMPLETE: CheckCircle, EFFICIENCY: AlertCircle };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Alerts</h2><p>{alerts.length} active alerts</p></div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        <div className="kpi-card danger" style={{ padding: '14px' }}><div className="kpi-label">Critical</div><div className="kpi-value" style={{ fontSize: '24px' }}>{alerts.filter(a => a.severity === 'danger').length}</div></div>
        <div className="kpi-card warning" style={{ padding: '14px' }}><div className="kpi-label">Warning</div><div className="kpi-value" style={{ fontSize: '24px' }}>{alerts.filter(a => a.severity === 'warning').length}</div></div>
        <div className="kpi-card success" style={{ padding: '14px' }}><div className="kpi-label">Success</div><div className="kpi-value" style={{ fontSize: '24px' }}>{alerts.filter(a => a.severity === 'success').length}</div></div>
        <div className="kpi-card info" style={{ padding: '14px' }}><div className="kpi-label">Total</div><div className="kpi-value" style={{ fontSize: '24px' }}>{alerts.length}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {alerts.length === 0 && <div className="empty-state"><CheckCircle size={48} /><h3>All Clear</h3><p>No alerts at this time</p></div>}
        {alerts.map(a => {
          const Icon = iconMap[a.type] || AlertTriangle;
          return (
            <div key={a.id} className="alert-item" style={{ padding: '16px 20px' }}>
              <div className="alert-icon" style={{ background: a.severity === 'danger' ? 'var(--danger-bg)' : a.severity === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)', width: '38px', height: '38px' }}>
                <Icon size={16} style={{ color: a.severity === 'danger' ? 'var(--danger)' : a.severity === 'warning' ? 'var(--warning)' : 'var(--success)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{a.message}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{a.buyer} • {a.po}</div>
              </div>
              <span className={`badge badge-${a.severity}`}>{a.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
