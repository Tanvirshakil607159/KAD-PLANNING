// Utility helpers
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('en-US').format(n);
}
export function formatCurrency(n) {
  if (n == null || isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
export function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function formatDateShort(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function daysFromNow(d) {
  if (!d) return 0;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}
export function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
export function statusColor(status) {
  const map = { OK: 'var(--success)', AT_RISK: 'var(--warning)', TIGHT: 'var(--danger)', DONE: 'var(--primary)' };
  return map[status] || 'var(--text-muted)';
}
export function statusLabel(status) {
  const map = { OK: 'On Track', AT_RISK: 'At Risk', TIGHT: 'Delayed', DONE: 'Done', PENDING: 'Pending', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', SHIPPED: 'Shipped', ACTIVE: 'Active', MAINTENANCE: 'Maintenance', IDLE: 'Idle' };
  return map[status] || status;
}
