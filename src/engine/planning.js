// Planning Engine - Auto-planning, load balancing, delay prediction
import { formulas, computeOrderMetrics } from './formulas.js';

export function recommendLine(order, lines, orders, productionRecords) {
  const scored = lines
    .filter(l => l.status === 'ACTIVE')
    .map(line => {
      const lineOrders = orders.filter(o => o.assignedLineId === line.id && o.status !== 'COMPLETED');
      const totalLoad = lineOrders.reduce((s, o) => {
        const m = computeOrderMetrics(o, productionRecords.filter(r => r.orderId === o.id));
        return s + m.sewingBalance;
      }, 0);
      const capacityDays = 30;
      const totalCapacity = line.capacity * capacityDays;
      const utilization = totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0;
      const availableCapacity = Math.max(0, totalCapacity - totalLoad);
      return { line, utilization, availableCapacity, score: availableCapacity - (order.smv || 10) * 0.1 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0] : null;
}

export function predictDelays(orders, productionRecords) {
  return orders
    .filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING')
    .map(order => {
      const records = productionRecords.filter(r => r.orderId === order.id);
      const metrics = computeOrderMetrics(order, records);
      const recentRecords = records.slice(-7);
      const avgDaily = recentRecords.length > 0
        ? recentRecords.reduce((s, r) => s + r.actualQty, 0) / recentRecords.length
        : metrics.dailyTarget;
      const projectedDays = avgDaily > 0 ? Math.ceil(metrics.sewingBalance / avgDaily) : 999;
      const projectedEnd = new Date();
      projectedEnd.setDate(projectedEnd.getDate() + projectedDays);

      return {
        orderId: order.id,
        order,
        metrics,
        avgDailyOutput: Math.round(avgDaily),
        projectedDays,
        projectedEndDate: projectedEnd.toISOString().split('T')[0],
        isDelayed: projectedDays > metrics.availableDays,
        delayDays: Math.max(0, projectedDays - metrics.availableDays),
        risk: projectedDays > metrics.availableDays * 1.2 ? 'HIGH' : projectedDays > metrics.availableDays * 0.9 ? 'MEDIUM' : 'LOW'
      };
    })
    .sort((a, b) => b.delayDays - a.delayDays);
}

export function smartLoadBalance(lines, orders, productionRecords) {
  const lineLoads = lines.filter(l => l.status === 'ACTIVE').map(line => {
    const lineOrders = orders.filter(o => o.assignedLineId === line.id && o.status !== 'COMPLETED');
    const totalLoad = lineOrders.reduce((s, o) => {
      const m = computeOrderMetrics(o, productionRecords.filter(r => r.orderId === o.id));
      return s + m.sewingBalance;
    }, 0);
    const capacity30 = line.capacity * 30;
    return {
      line,
      orders: lineOrders,
      totalLoad,
      capacity: capacity30,
      utilization: capacity30 > 0 ? +((totalLoad / capacity30) * 100).toFixed(1) : 0
    };
  });

  const overloaded = lineLoads.filter(l => l.utilization > 90);
  const underloaded = lineLoads.filter(l => l.utilization < 50);
  const suggestions = [];

  overloaded.forEach(ol => {
    const movableOrders = ol.orders.filter(o => o.status === 'PENDING');
    movableOrders.forEach(order => {
      const best = underloaded.find(ul => ul.capacity - ul.totalLoad >= order.orderQty * 0.5);
      if (best) {
        suggestions.push({
          type: 'MOVE',
          orderId: order.id,
          orderPO: order.poNumber,
          fromLine: ol.line.name,
          toLine: best.line.name,
          toLineId: best.line.id,
          reason: `${ol.line.name} at ${ol.utilization}% — ${best.line.name} at ${best.utilization}%`
        });
      }
    });
  });

  return { lineLoads, suggestions, overloaded: overloaded.length, underloaded: underloaded.length };
}

export function optimizationSuggestions(orders, productionRecords, lines) {
  const delays = predictDelays(orders, productionRecords);
  const suggestions = [];

  delays.filter(d => d.risk === 'HIGH').forEach(d => {
    const gap = d.projectedDays - d.metrics.availableDays;
    const extraPerDay = d.metrics.sewingBalance > 0 ? Math.ceil(d.metrics.sewingBalance / d.metrics.availableDays) - d.avgDailyOutput : 0;
    if (extraPerDay > 0) {
      suggestions.push({
        type: 'OVERTIME',
        orderId: d.orderId,
        po: d.order.poNumber,
        message: `Need +${extraPerDay} pcs/day. Consider 2hr overtime to recover ${gap} days delay.`
      });
    }
  });

  return suggestions;
}
