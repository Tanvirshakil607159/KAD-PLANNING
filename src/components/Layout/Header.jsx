import { Search, Bell, User } from 'lucide-react';

export default function Header() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="header">
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dateStr}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 14px', minWidth: '240px' }}>
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search orders, buyers..." style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: '13px', outline: 'none', width: '100%', fontFamily: 'inherit' }} />
      </div>
      <button className="btn-icon"><Bell size={16} /></button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 12px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={14} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600' }}>Admin</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Planner</div>
        </div>
      </div>
    </header>
  );
}
