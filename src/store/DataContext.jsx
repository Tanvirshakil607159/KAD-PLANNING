import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LinesService, OrdersService, ProductionRecordsService, ShipmentsService } from '../services/SupabaseService.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({
    lines: [],
    orders: [],
    productionRecords: [],
    shipments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Initial Load from Supabase ──────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        const [lines, orders, productionRecords, shipments] = await Promise.all([
          LinesService.fetchAll(),
          OrdersService.fetchAll(),
          ProductionRecordsService.fetchAll(),
          ShipmentsService.fetchAll()
        ]);
        setData({ lines, orders, productionRecords, shipments });
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        setError('Failed to connect to database. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ─── Orders ──────────────────────────────────────────────────────
  const addOrder = useCallback(async (order) => {
    const inserted = await OrdersService.insert(order);
    if (inserted) {
      // Re-fetch to get the properly mapped row
      const orders = await OrdersService.fetchAll();
      setData(prev => ({ ...prev, orders }));
    }
  }, []);

  const updateOrder = useCallback(async (id, changes) => {
    await OrdersService.update(id, changes);
    const orders = await OrdersService.fetchAll();
    setData(prev => ({ ...prev, orders }));
  }, []);

  const deleteOrder = useCallback(async (id) => {
    await OrdersService.delete(id);
    setData(prev => ({ ...prev, orders: prev.orders.filter(o => o.id !== id) }));
  }, []);

  // ─── Lines ───────────────────────────────────────────────────────
  const addLine = useCallback(async (line) => {
    const inserted = await LinesService.insert(line);
    if (inserted) {
      setData(prev => ({ ...prev, lines: [inserted, ...prev.lines] }));
    }
  }, []);

  const updateLine = useCallback(async (id, changes) => {
    const updated = await LinesService.update(id, changes);
    if (updated) {
      setData(prev => ({ ...prev, lines: prev.lines.map(l => l.id === id ? { ...l, ...updated } : l) }));
    }
  }, []);

  const deleteLine = useCallback(async (id) => {
    await LinesService.delete(id);
    setData(prev => ({ ...prev, lines: prev.lines.filter(l => l.id !== id) }));
  }, []);

  // ─── Production Records ──────────────────────────────────────────
  const addProductionRecord = useCallback(async (record) => {
    const inserted = await ProductionRecordsService.insert(record);
    if (inserted) {
      const records = await ProductionRecordsService.fetchAll();
      setData(prev => ({ ...prev, productionRecords: records }));
    }
  }, []);

  const updateProductionRecord = useCallback(async (id, changes) => {
    await ProductionRecordsService.update(id, changes);
    const records = await ProductionRecordsService.fetchAll();
    setData(prev => ({ ...prev, productionRecords: records }));
  }, []);

  // ─── Shipments ───────────────────────────────────────────────────
  const addShipment = useCallback(async (shipment) => {
    const inserted = await ShipmentsService.insert(shipment);
    if (inserted) {
      const shipments = await ShipmentsService.fetchAll();
      setData(prev => ({ ...prev, shipments }));
    }
  }, []);

  // ─── Delete All Data ─────────────────────────────────────────────
  const deleteAllData = useCallback(async () => {
    await Promise.all([
      ShipmentsService.deleteAll(),
      ProductionRecordsService.deleteAll(),
      OrdersService.deleteAll(),
      LinesService.deleteAll()
    ]);
    setData({ lines: [], orders: [], productionRecords: [], shipments: [] });
  }, []);

  // ─── Export / Import ─────────────────────────────────────────────
  const exportAllData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback(async (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.orders || !parsed.lines) return false;

      // Clear existing data first
      await Promise.all([
        ShipmentsService.deleteAll(),
        ProductionRecordsService.deleteAll(),
        OrdersService.deleteAll(),
        LinesService.deleteAll()
      ]);

      // Insert all imported data
      for (const line of (parsed.lines || [])) { await LinesService.insert(line); }
      for (const order of (parsed.orders || [])) { await OrdersService.insert(order); }
      for (const record of (parsed.productionRecords || [])) { await ProductionRecordsService.insert(record); }
      for (const shipment of (parsed.shipments || [])) { await ShipmentsService.insert(shipment); }

      // Reload everything
      const [lines, orders, productionRecords, shipments] = await Promise.all([
        LinesService.fetchAll(),
        OrdersService.fetchAll(),
        ProductionRecordsService.fetchAll(),
        ShipmentsService.fetchAll()
      ]);
      setData({ lines, orders, productionRecords, shipments });
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  }, []);

  // ─── Refresh from DB ─────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    const [lines, orders, productionRecords, shipments] = await Promise.all([
      LinesService.fetchAll(),
      OrdersService.fetchAll(),
      ProductionRecordsService.fetchAll(),
      ShipmentsService.fetchAll()
    ]);
    setData({ lines, orders, productionRecords, shipments });
  }, []);

  const value = {
    ...data,
    loading,
    error,
    addOrder, updateOrder, deleteOrder,
    addLine, updateLine, deleteLine,
    addProductionRecord, updateProductionRecord,
    addShipment,
    deleteAllData, exportAllData, importData,
    refreshData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
