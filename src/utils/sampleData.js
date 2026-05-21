// Demo/Sample Data Generator
const uid = (pre) => `${pre}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const BUYERS = ['H&M', 'ZARA', 'PRIMARK', 'NEXT', 'C&A', 'WALMART', 'TARGET', 'GAP'];
const STYLES = ['POLO-BAS', 'TEE-CREW', 'HOODIE-P', 'JOGGER-S', 'JACKET-W', 'DRESS-FL', 'SHIRT-OX', 'SHORT-CH'];
const ITEMS = ['Polo Shirt', 'T-Shirt', 'Hoodie', 'Jogger Pants', 'Winter Jacket', 'Floral Dress', 'Oxford Shirt', 'Chino Shorts'];
const FABRIC_STATUSES = ['INHOUSE', 'INHOUSE', 'INHOUSE', 'NOT_READY', 'PARTIAL'];
const FLOORS = ['Floor-1', 'Floor-2', 'Floor-3'];

function randomDate(startDays, endDays) {
  const d = new Date();
  d.setDate(d.getDate() + startDays + Math.floor(Math.random() * (endDays - startDays)));
  return d.toISOString().split('T')[0];
}

export function generateLines() {
  const lines = [];
  let idx = 1;
  FLOORS.forEach((floor, fi) => {
    const count = fi === 0 ? 4 : fi === 1 ? 3 : 3;
    for (let i = 0; i < count; i++) {
      lines.push({
        id: `line-${String(idx).padStart(2, '0')}`,
        name: `Line ${String(idx).padStart(2, '0')}`,
        floor,
        factory: 'Factory-A',
        capacity: 400 + Math.floor(Math.random() * 500),
        operators: 30 + Math.floor(Math.random() * 25),
        machines: 25 + Math.floor(Math.random() * 25),
        efficiency: 55 + Math.floor(Math.random() * 25),
        status: Math.random() > 0.1 ? 'ACTIVE' : 'MAINTENANCE'
      });
      idx++;
    }
  });
  return lines;
}

export function generateOrders(lines) {
  const MERCHANTS = ['Alex Rivera', 'Sarah Jenkins', 'David Chen', 'Emily Rodriguez', 'Michael Chang'];
  const REMARKS = ['Fabric in-house', 'Lining pending AQL', 'Awaiting buyer trim approval', 'Packing started', 'Shipment on hold', 'On schedule'];
  const orders = [];
  for (let i = 0; i < 15; i++) {
    const bi = i % BUYERS.length;
    const si = i % STYLES.length;
    const qty = (3000 + Math.floor(Math.random() * 20000));
    const line = lines[i % lines.length];
    const startDays = -20 + Math.floor(Math.random() * 10);
    const planDays = 15 + Math.floor(Math.random() * 30);
    const status = i < 2 ? 'COMPLETED' : i < 4 ? 'PENDING' : 'IN_PROGRESS';
    
    const sewingStart = randomDate(startDays, startDays + 3);
    const sewingStartD = new Date(sewingStart);
    
    const cuttingD = new Date(sewingStartD);
    cuttingD.setDate(cuttingD.getDate() - 5);
    const cuttingDate = cuttingD.toISOString().split('T')[0];
    
    const inputD = new Date(sewingStartD);
    inputD.setDate(inputD.getDate() - 2);
    const inputDate = inputD.toISOString().split('T')[0];
    
    const sewingClosingD = new Date(sewingStartD);
    sewingClosingD.setDate(sewingClosingD.getDate() + planDays);
    const sewingClosingDate = sewingClosingD.toISOString().split('T')[0];
    const sewingEndDate = sewingClosingDate;
    
    const ppMeetingD = new Date(sewingStartD);
    ppMeetingD.setDate(ppMeetingD.getDate() - 10);
    const ppMeetingDate = ppMeetingD.toISOString().split('T')[0];
    
    const bulkCuttingStartD = new Date(sewingStartD);
    bulkCuttingStartD.setDate(bulkCuttingStartD.getDate() - 4);
    const bulkCuttingStartDate = bulkCuttingStartD.toISOString().split('T')[0];
    
    const actualSewingEndDate = status === 'COMPLETED' ? sewingEndDate : null;
    const delayDate = status === 'IN_PROGRESS' && Math.random() > 0.7 ? randomDate(planDays + 2, planDays + 8) : null;

    orders.push({
      id: `ord-${String(i + 1).padStart(3, '0')}`,
      buyer: BUYERS[bi],
      poNumber: `PO-2025-${String(1000 + i)}`,
      style: `${STYLES[si]}-${String(100 + i)}`,
      itemType: ITEMS[si],
      smv: +(8 + Math.random() * 12).toFixed(1),
      shipDate: randomDate(planDays - 5, planDays + 20),
      orderQty: qty,
      unitValue: +(2.5 + Math.random() * 6).toFixed(2),
      sewingStartDate: sewingStart,
      sewingEndDate,
      assignedLineId: line.id,
      assignedFloor: line.floor,
      fabricStatus: FABRIC_STATUSES[Math.floor(Math.random() * FABRIC_STATUSES.length)],
      status,
      planningDays: planDays,
      workingHours: 10,
      createdAt: randomDate(-30, -10),
      concernMerchant: MERCHANTS[i % MERCHANTS.length],
      cuttingDate,
      inputDate,
      sewingClosingDate,
      ppMeetingDate,
      bulkCuttingStartDate,
      actualSewingEndDate,
      delayDate,
      remarks: i % 3 === 0 ? REMARKS[i % REMARKS.length] : ''
    });
  }
  return orders;
}

export function generateProductionRecords(orders) {
  const records = [];
  orders.forEach(order => {
    if (order.status === 'PENDING') return;
    const days = order.status === 'COMPLETED' ? order.planningDays : Math.min(order.planningDays, Math.floor(Math.random() * 20) + 5);
    const dailyTgt = Math.ceil(order.orderQty / order.planningDays);
    for (let d = 0; d < days; d++) {
      const date = new Date(order.sewingStartDate);
      date.setDate(date.getDate() + d);
      const variance = 0.7 + Math.random() * 0.5;
      const actual = Math.min(Math.floor(dailyTgt * variance), order.orderQty);
      records.push({
        id: uid('prod'),
        orderId: order.id,
        lineId: order.assignedLineId,
        date: date.toISOString().split('T')[0],
        plannedQty: dailyTgt,
        actualQty: actual,
        defects: Math.floor(Math.random() * 15),
        hoursWorked: order.workingHours,
        overtimeHours: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
        remarks: ''
      });
    }
  });
  return records;
}

export function generateShipments(orders) {
  const shipments = [];
  orders.filter(o => o.status === 'COMPLETED').forEach(order => {
    shipments.push({
      id: uid('ship'),
      orderId: order.id,
      shipDate: order.shipDate,
      shippedQty: order.orderQty,
      invoiceNo: `INV-2025-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'SHIPPED'
    });
  });
  return shipments;
}

export function generateAllDemoData() {
  const lines = generateLines();
  const orders = generateOrders(lines);
  const productionRecords = generateProductionRecords(orders);
  const shipments = generateShipments(orders);
  return { lines, orders, productionRecords, shipments };
}
