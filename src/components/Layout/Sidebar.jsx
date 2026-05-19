import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, CalendarRange, Factory, LineChart, BarChart3, Settings, AlertTriangle, Package } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { generateAlerts } from '../../engine/alerts';

const NAV = [
  { section: 'Overview', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/planning', icon: CalendarRange, label: 'Planning Board' },
  ]},
  { section: 'Operations', items: [
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/lines', icon: Factory, label: 'Lines' },
    { to: '/production', icon: Package, label: 'Production' },
  ]},
  { section: 'Analytics', items: [
    { to: '/kpi', icon: BarChart3, label: 'KPI Dashboard' },
    { to: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  ]},
  { section: 'System', items: [
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]}
];

export default function Sidebar() {
  const { orders, productionRecords, shipments, settings } = useData();
  const alerts = generateAlerts(orders || [], productionRecords || [], shipments || []);
  const dangerCount = alerts.filter(a => a.severity === 'danger').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>{settings?.factoryName || 'KAD Planning'}</h1>
        <span>Production Control</span>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-title">{section.section}</div>
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <item.icon />
                <span>{item.label}</span>
                {item.label === 'Alerts' && dangerCount > 0 && <span className="nav-badge">{dangerCount}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
        v1.0.0 — KAD Systems
      </div>
    </aside>
  );
}
