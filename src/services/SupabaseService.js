import { supabase } from '../lib/supabase.js';

// ─── Generic CRUD Helpers ─────────────────────────────────────────────

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(`Fetch ${table} error:`, error);
    throw new Error(error.message || `Failed to fetch from ${table}`);
  }
  return data || [];
}

async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) {
    console.error(`Insert ${table} error:`, error);
    throw new Error(error.message || `Failed to insert into ${table}`);
  }
  return data;
}

async function updateRow(table, id, changes) {
  const { data, error } = await supabase.from(table).update(changes).eq('id', id).select().single();
  if (error) {
    console.error(`Update ${table} error:`, error);
    throw new Error(error.message || `Failed to update ${table}`);
  }
  return data;
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`Delete ${table} error:`, error);
    throw new Error(error.message || `Failed to delete from ${table}`);
  }
  return true;
}

async function deleteAllRows(table) {
  const { error } = await supabase.from(table).delete().neq('id', '');
  if (error) {
    console.error(`Delete all ${table} error:`, error);
    throw new Error(error.message || `Failed to clear ${table}`);
  }
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
    createdAt: row.created_at,
    concernMerchant: row.concern_merchant,
    cuttingDate: row.cutting_date,
    inputDate: row.input_date,
    sewingClosingDate: row.sewing_closing_date,
    ppMeetingDate: row.pp_meeting_date,
    bulkCuttingStartDate: row.bulk_cutting_start_date,
    actualSewingEndDate: row.actual_sewing_end_date,
    delayDate: row.delay_date,
    remarks: row.remarks
  };
}

function mapOrderToDB(order) {
  const mapped = {};
  if (order.id !== undefined) mapped.id = order.id || null;
  if (order.buyer !== undefined) mapped.buyer = order.buyer || null;
  if (order.poNumber !== undefined) mapped.po_number = order.poNumber || null;
  if (order.style !== undefined) mapped.style = order.style || null;
  if (order.itemType !== undefined) mapped.item_type = order.itemType || null;
  if (order.smv !== undefined) mapped.smv = order.smv === '' || order.smv === null ? null : Number(order.smv);
  if (order.shipDate !== undefined) mapped.ship_date = order.shipDate || null;
  if (order.orderQty !== undefined) mapped.order_qty = order.orderQty === '' || order.orderQty === null ? null : Number(order.orderQty);
  if (order.unitValue !== undefined) mapped.unit_value = order.unitValue === '' || order.unitValue === null ? null : Number(order.unitValue);
  if (order.sewingStartDate !== undefined) mapped.sewing_start_date = order.sewingStartDate || null;
  if (order.sewingEndDate !== undefined) mapped.sewing_end_date = order.sewingEndDate || null;
  if (order.assignedLineId !== undefined) mapped.assigned_line_id = order.assignedLineId || null;
  if (order.assignedFloor !== undefined) mapped.assigned_floor = order.assignedFloor || null;
  if (order.fabricStatus !== undefined) mapped.fabric_status = order.fabricStatus || null;
  if (order.status !== undefined) mapped.status = order.status || null;
  if (order.planningDays !== undefined) mapped.planning_days = order.planningDays === '' || order.planningDays === null ? null : Number(order.planningDays);
  if (order.workingHours !== undefined) mapped.working_hours = order.workingHours === '' || order.workingHours === null ? null : Number(order.workingHours);
  if (order.createdAt !== undefined) mapped.created_at = order.createdAt || null;
  if (order.concernMerchant !== undefined) mapped.concern_merchant = order.concernMerchant || null;
  if (order.cuttingDate !== undefined) mapped.cutting_date = order.cuttingDate || null;
  if (order.inputDate !== undefined) mapped.input_date = order.inputDate || null;
  if (order.sewingClosingDate !== undefined) mapped.sewing_closing_date = order.sewingClosingDate || null;
  if (order.ppMeetingDate !== undefined) mapped.pp_meeting_date = order.ppMeetingDate || null;
  if (order.bulkCuttingStartDate !== undefined) mapped.bulk_cutting_start_date = order.bulkCuttingStartDate || null;
  if (order.actualSewingEndDate !== undefined) mapped.actual_sewing_end_date = order.actualSewingEndDate || null;
  if (order.delayDate !== undefined) mapped.delay_date = order.delayDate || null;
  if (order.remarks !== undefined) mapped.remarks = order.remarks || null;
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
  if (record.id !== undefined) mapped.id = record.id || null;
  if (record.orderId !== undefined) mapped.order_id = record.orderId || null;
  if (record.lineId !== undefined) mapped.line_id = record.lineId || null;
  if (record.date !== undefined) mapped.date = record.date || null;
  if (record.plannedQty !== undefined) mapped.planned_qty = record.plannedQty === '' || record.plannedQty === null ? null : Number(record.plannedQty);
  if (record.actualQty !== undefined) mapped.actual_qty = record.actualQty === '' || record.actualQty === null ? null : Number(record.actualQty);
  if (record.defects !== undefined) mapped.defects = record.defects === '' || record.defects === null ? null : Number(record.defects);
  if (record.hoursWorked !== undefined) mapped.hours_worked = record.hoursWorked === '' || record.hoursWorked === null ? null : Number(record.hoursWorked);
  if (record.overtimeHours !== undefined) mapped.overtime_hours = record.overtimeHours === '' || record.overtimeHours === null ? null : Number(record.overtimeHours);
  if (record.remarks !== undefined) mapped.remarks = record.remarks || null;
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
  if (shipment.id !== undefined) mapped.id = shipment.id || null;
  if (shipment.orderId !== undefined) mapped.order_id = shipment.orderId || null;
  if (shipment.shipDate !== undefined) mapped.ship_date = shipment.shipDate || null;
  if (shipment.shippedQty !== undefined) mapped.shipped_qty = shipment.shippedQty === '' || shipment.shippedQty === null ? null : Number(shipment.shippedQty);
  if (shipment.invoiceNo !== undefined) mapped.invoice_no = shipment.invoiceNo || null;
  if (shipment.status !== undefined) mapped.status = shipment.status || null;
  return mapped;
}

// ─── Settings ────────────────────────────────────────────────────────

export const SettingsService = {
  fetch: async () => {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
    if (error) {
      console.error('Fetch settings error:', error);
      return {
        id: 'global',
        factoryName: 'Factory-A',
        workingHours: 10,
        workingDays: 6,
        defaultEfficiency: 65
      };
    }
    if (!data) return null;
    return {
      id: data.id,
      factoryName: data.factory_name,
      workingHours: data.working_hours,
      workingDays: data.working_days,
      defaultEfficiency: data.default_efficiency
    };
  },
  update: async (changes) => {
    const dbChanges = {
      factory_name: changes.factoryName,
      working_hours: Number(changes.workingHours),
      working_days: Number(changes.workingDays),
      default_efficiency: Number(changes.defaultEfficiency)
    };
    const { data, error } = await supabase.from('settings').upsert({ id: 'global', ...dbChanges }).select().single();
    if (error) {
      console.error('Update settings error:', error);
      throw new Error(error.message || 'Failed to update settings');
    }
    return {
      id: data.id,
      factoryName: data.factory_name,
      workingHours: data.working_hours,
      workingDays: data.working_days,
      defaultEfficiency: data.default_efficiency
    };
  }
};
