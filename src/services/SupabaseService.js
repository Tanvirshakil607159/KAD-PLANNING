import { supabase } from '../lib/supabase.js';

// ─── Generic CRUD Helpers ─────────────────────────────────────────────

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) { console.error(`Fetch ${table} error:`, error); return []; }
  return data || [];
}

async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) { console.error(`Insert ${table} error:`, error); return null; }
  return data;
}

async function updateRow(table, id, changes) {
  const { data, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) { console.error(`Update ${table} error:`, error); return null; }
  return data;
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { console.error(`Delete ${table} error:`, error); return false; }
  return true;
}

async function deleteAllRows(table) {
  const { error } = await supabase.from(table).delete().neq('id', '');
  if (error) { console.error(`Delete all ${table} error:`, error); return false; }
  return true;
}

// ─── Lines ────────────────────────────────────────────────────────────

export const LinesService = {
  fetchAll: () => fetchAll('lines'),
  insert: (line) => insertRow('lines', line),
  update: (id, changes) => updateRow('lines', id, changes),
  delete: (id) => deleteRow('lines', id),
  deleteAll: () => deleteAllRows('lines')
};

// ─── Orders ───────────────────────────────────────────────────────────

export const OrdersService = {
  fetchAll: async () => {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Fetch orders error:', error); return []; }
    return (data || []).map(mapOrderFromDB);
  },
  insert: (order) => insertRow('orders', mapOrderToDB(order)),
  update: (id, changes) => updateRow('orders', id, mapOrderToDB(changes)),
  delete: (id) => deleteRow('orders', id),
  deleteAll: () => deleteAllRows('orders')
};

// Map camelCase (frontend) ↔ snake_case (Supabase)
function mapOrderFromDB(row) {
  return {
    id: row.id,
    buyer: row.buyer,
    poNumber: row.po_number,
    style: row.style,
    itemType: row.item_type,
    smv: row.smv,
    shipDate: row.ship_date,
    orderQty: row.order_qty,
    unitValue: row.unit_value,
    sewingStartDate: row.sewing_start_date,
    sewingEndDate: row.sewing_end_date,
    assignedLineId: row.assigned_line_id,
    assignedFloor: row.assigned_floor,
    fabricStatus: row.fabric_status,
    status: row.status,
    planningDays: row.planning_days,
    workingHours: row.working_hours,
    createdAt: row.created_at
  };
}

function mapOrderToDB(order) {
  const mapped = {};
  if (order.id !== undefined) mapped.id = order.id;
  if (order.buyer !== undefined) mapped.buyer = order.buyer;
  if (order.poNumber !== undefined) mapped.po_number = order.poNumber;
  if (order.style !== undefined) mapped.style = order.style;
  if (order.itemType !== undefined) mapped.item_type = order.itemType;
  if (order.smv !== undefined) mapped.smv = order.smv;
  if (order.shipDate !== undefined) mapped.ship_date = order.shipDate;
  if (order.orderQty !== undefined) mapped.order_qty = order.orderQty;
  if (order.unitValue !== undefined) mapped.unit_value = order.unitValue;
  if (order.sewingStartDate !== undefined) mapped.sewing_start_date = order.sewingStartDate;
  if (order.sewingEndDate !== undefined) mapped.sewing_end_date = order.sewingEndDate;
  if (order.assignedLineId !== undefined) mapped.assigned_line_id = order.assignedLineId;
  if (order.assignedFloor !== undefined) mapped.assigned_floor = order.assignedFloor;
  if (order.fabricStatus !== undefined) mapped.fabric_status = order.fabricStatus;
  if (order.status !== undefined) mapped.status = order.status;
  if (order.planningDays !== undefined) mapped.planning_days = order.planningDays;
  if (order.workingHours !== undefined) mapped.working_hours = order.workingHours;
  if (order.createdAt !== undefined) mapped.created_at = order.createdAt;
  return mapped;
}

// ─── Production Records ──────────────────────────────────────────────

export const ProductionRecordsService = {
  fetchAll: async () => {
    const { data, error } = await supabase.from('production_records').select('*').order('date', { ascending: false });
    if (error) { console.error('Fetch production_records error:', error); return []; }
    return (data || []).map(mapRecordFromDB);
  },
  insert: (record) => insertRow('production_records', mapRecordToDB(record)),
  update: (id, changes) => updateRow('production_records', id, mapRecordToDB(changes)),
  delete: (id) => deleteRow('production_records', id),
  deleteAll: () => deleteAllRows('production_records')
};

function mapRecordFromDB(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    lineId: row.line_id,
    date: row.date,
    plannedQty: row.planned_qty,
    actualQty: row.actual_qty,
    defects: row.defects,
    hoursWorked: row.hours_worked,
    overtimeHours: row.overtime_hours,
    remarks: row.remarks
  };
}

function mapRecordToDB(record) {
  const mapped = {};
  if (record.id !== undefined) mapped.id = record.id;
  if (record.orderId !== undefined) mapped.order_id = record.orderId;
  if (record.lineId !== undefined) mapped.line_id = record.lineId;
  if (record.date !== undefined) mapped.date = record.date;
  if (record.plannedQty !== undefined) mapped.planned_qty = record.plannedQty;
  if (record.actualQty !== undefined) mapped.actual_qty = record.actualQty;
  if (record.defects !== undefined) mapped.defects = record.defects;
  if (record.hoursWorked !== undefined) mapped.hours_worked = record.hoursWorked;
  if (record.overtimeHours !== undefined) mapped.overtime_hours = record.overtimeHours;
  if (record.remarks !== undefined) mapped.remarks = record.remarks;
  return mapped;
}

// ─── Shipments ────────────────────────────────────────────────────────

export const ShipmentsService = {
  fetchAll: async () => {
    const { data, error } = await supabase.from('shipments').select('*').order('ship_date', { ascending: false });
    if (error) { console.error('Fetch shipments error:', error); return []; }
    return (data || []).map(mapShipmentFromDB);
  },
  insert: (shipment) => insertRow('shipments', mapShipmentToDB(shipment)),
  update: (id, changes) => updateRow('shipments', id, mapShipmentToDB(changes)),
  delete: (id) => deleteRow('shipments', id),
  deleteAll: () => deleteAllRows('shipments')
};

function mapShipmentFromDB(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    shipDate: row.ship_date,
    shippedQty: row.shipped_qty,
    invoiceNo: row.invoice_no,
    status: row.status
  };
}

function mapShipmentToDB(shipment) {
  const mapped = {};
  if (shipment.id !== undefined) mapped.id = shipment.id;
  if (shipment.orderId !== undefined) mapped.order_id = shipment.orderId;
  if (shipment.shipDate !== undefined) mapped.ship_date = shipment.shipDate;
  if (shipment.shippedQty !== undefined) mapped.shipped_qty = shipment.shippedQty;
  if (shipment.invoiceNo !== undefined) mapped.invoice_no = shipment.invoiceNo;
  if (shipment.status !== undefined) mapped.status = shipment.status;
  return mapped;
}
