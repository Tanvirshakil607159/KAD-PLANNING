// KAD Production Planning - Formula Engine

export const formulas = {
  orderWithBuffer: (qty, bufferPct = 2) => Math.ceil(qty * (1 + bufferPct / 100)),
  dailyTarget: (qty, days) => days > 0 ? Math.ceil(qty / days) : 0,
  hourlyTarget: (dailyTarget, hours) => hours > 0 ? Math.ceil(dailyTarget / hours) : 0,
  sewingBalance: (orderQty, producedQty) => Math.max(0, orderQty - producedQty),
  daysRequired: (balance, dailyTarget) => dailyTarget > 0 ? Math.ceil(balance / dailyTarget) : Infinity,
  achievement: (produced, orderQty) => orderQty > 0 ? +((produced / orderQty) * 100).toFixed(1) : 0,
  totalValue: (qty, unitValue) => +(qty * unitValue).toFixed(2),
  balanceValue: (balance, unitValue) => +(balance * unitValue).toFixed(2),
  efficiency: (actual, planned) => planned > 0 ? +((actual / planned) * 100).toFixed(1) : 0,
  lossQty: (planned, actual) => Math.max(0, planned - actual),
  lossValue: (lossQty, unitValue) => +(lossQty * unitValue).toFixed(2),
  shipBalance: (orderQty, shippedQty) => Math.max(0, orderQty - shippedQty),
  productionDays: (start, end) => {
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return Math.max(0, Math.ceil(ms / 86400000));
  },
  dynamicEndDate: (daysRequired) => {
    const d = new Date();
    d.setDate(d.getDate() + daysRequired);
    return d.toISOString().split('T')[0];
  },
  lineOutput: (hourlyTarget, hours, days) => hourlyTarget * hours * days,
  delayStatus: (daysRequired, availableDays) => {
    if (daysRequired <= 0) return 'DONE';
    if (daysRequired > availableDays * 1.2) return 'TIGHT';
    if (daysRequired > availableDays * 0.9) return 'AT_RISK';
    return 'OK';
  }
};

export function computeOrderMetrics(order, productionRecords = [], shipments = []) {
  const producedQty = productionRecords.reduce((s, r) => s + (r.actualQty || 0), 0);
  const plannedProduced = productionRecords.reduce((s, r) => s + (r.plannedQty || 0), 0);
  const shippedQty = shipments.reduce((s, r) => s + (r.shippedQty || 0), 0);
  const planDays = order.planningDays || formulas.productionDays(order.sewingStartDate, order.sewingEndDate) || 30;
  const dailyTgt = formulas.dailyTarget(order.orderQty, planDays);
  const hourlyTgt = formulas.hourlyTarget(dailyTgt, order.workingHours || 10);
  const balance = formulas.sewingBalance(order.orderQty, producedQty);
  const daysReq = formulas.daysRequired(balance, dailyTgt);
  const shipDate = new Date(order.shipDate);
  const today = new Date();
  const availDays = Math.max(0, Math.ceil((shipDate - today) / 86400000));

  return {
    producedQty,
    plannedProduced,
    shippedQty,
    orderWithBuffer: formulas.orderWithBuffer(order.orderQty),
    dailyTarget: dailyTgt,
    hourlyTarget: hourlyTgt,
    sewingBalance: balance,
    daysRequired: daysReq === Infinity ? 999 : daysReq,
    achievement: formulas.achievement(producedQty, order.orderQty),
    totalValue: formulas.totalValue(order.orderQty, order.unitValue),
    balanceValue: formulas.balanceValue(balance, order.unitValue),
    efficiency: formulas.efficiency(producedQty, plannedProduced),
    lossQty: formulas.lossQty(plannedProduced, producedQty),
    lossValue: formulas.lossValue(formulas.lossQty(plannedProduced, producedQty), order.unitValue),
    shipBalance: formulas.shipBalance(order.orderQty, shippedQty),
    dynamicEndDate: balance > 0 ? formulas.dynamicEndDate(daysReq === Infinity ? 999 : daysReq) : order.sewingEndDate,
    availableDays: availDays,
    status: formulas.delayStatus(daysReq === Infinity ? 999 : daysReq, availDays),
    planningDays: planDays
  };
}
