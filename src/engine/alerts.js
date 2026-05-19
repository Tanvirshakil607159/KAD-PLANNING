// Alert Engine
import { computeOrderMetrics } from './formulas.js';

export function generateAlerts(orders, productionRecords, shipments) {
  const alerts = [];

  orders.forEach(order => {
    const records = productionRecords.filter(r => r.orderId === order.id);
    const ships = shipments.filter(s => s.orderId === order.id);
    const m = computeOrderMetrics(order, records, ships);

    if (order.fabricStatus === 'NOT_READY') {
      alerts.push({ id: `fab-${order.id}`, type: 'FABRIC', severity: 'danger', orderId: order.id, po: order.poNumber, buyer: order.buyer, message: `Fabric NOT INHOUSE for ${order.poNumber}`, timestamp: new Date().toISOString() });
    }
    if (m.status === 'TIGHT') {
      alerts.push({ id: `del-${order.id}`, type: 'DELAY', severity: 'danger', orderId: order.id, po: order.poNumber, buyer: order.buyer, message: `${order.poNumber} is TIGHT — ${m.daysRequired} days needed, ${m.availableDays} available`, timestamp: new Date().toISOString() });
    }
    if (m.status === 'AT_RISK') {
      alerts.push({ id: `risk-${order.id}`, type: 'RISK', severity: 'warning', orderId: order.id, po: order.poNumber, buyer: order.buyer, message: `${order.poNumber} AT RISK — monitor closely`, timestamp: new Date().toISOString() });
    }
    if (m.achievement >= 100) {
      alerts.push({ id: `done-${order.id}`, type: 'COMPLETE', severity: 'success', orderId: order.id, po: order.poNumber, buyer: order.buyer, message: `${order.poNumber} production COMPLETE`, timestamp: new Date().toISOString() });
    }
    if (m.efficiency < 50 && records.length > 3) {
      alerts.push({ id: `eff-${order.id}`, type: 'EFFICIENCY', severity: 'warning', orderId: order.id, po: order.poNumber, buyer: order.buyer, message: `${order.poNumber} efficiency at ${m.efficiency}% — below threshold`, timestamp: new Date().toISOString() });
    }
  });

  return alerts.sort((a, b) => {
    const sev = { danger: 0, warning: 1, success: 2 };
    return (sev[a.severity] || 3) - (sev[b.severity] || 3);
  });
}
