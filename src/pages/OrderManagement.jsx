import { useState, useMemo } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { formatNumber, formatCurrency, formatDate, uid } from '../utils/format';
import { Plus, Download, Upload, Trash2, Edit, Search, X, FileSpreadsheet } from 'lucide-react';

const BUYERS = ['H&M', 'ZARA', 'PRIMARK', 'NEXT', 'C&A', 'WALMART', 'TARGET', 'GAP', 'UNIQLO', 'PUMA'];
const ITEMS = ['Polo Shirt', 'T-Shirt', 'Hoodie', 'Jogger Pants', 'Winter Jacket', 'Floral Dress', 'Oxford Shirt', 'Chino Shorts', 'Sweater', 'Tank Top'];
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SHIPPED'];
const FABRIC = ['INHOUSE', 'NOT_READY', 'PARTIAL'];

const emptyOrder = { buyer: '', poNumber: '', style: '', itemType: '', smv: '', shipDate: '', orderQty: '', unitValue: '', sewingStartDate: '', assignedLineId: '', assignedFloor: '', fabricStatus: 'INHOUSE', status: 'PENDING', planningDays: 30, workingHours: 10 };

export default function OrderManagement() {
  const { orders, lines, productionRecords, shipments, settings, addOrder, updateOrder, deleteOrder } = useData();
  const [search, setSearch] = useState('');
  const [filterBuyer, setFilterBuyer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | order obj
  const [form, setForm] = useState({ ...emptyOrder });
  const [selected, setSelected] = useState(new Set());

  const buyers = useMemo(() => [...new Set(orders.map(o => o.buyer))].sort(), [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filterBuyer && o.buyer !== filterBuyer) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return o.buyer.toLowerCase().includes(s) || o.poNumber.toLowerCase().includes(s) || o.style.toLowerCase().includes(s) || o.itemType.toLowerCase().includes(s);
      }
      return true;
    });
  }, [orders, search, filterBuyer, filterStatus]);

  const metricsMap = useMemo(() => {
    const map = {};
    filtered.forEach(o => { map[o.id] = computeOrderMetrics(o, productionRecords.filter(r => r.orderId === o.id), shipments.filter(s => s.orderId === o.id)); });
    return map;
  }, [filtered, productionRecords, shipments]);

  function openAdd() { setForm({ ...emptyOrder, workingHours: settings?.workingHours || 10 }); setModal('add'); }
  function openEdit(order) { setForm({ ...order }); setModal(order); }
  function closeModal() { setModal(null); }

  function handleSave() {
    if (!form.buyer || !form.poNumber || !form.orderQty) return;
    const data = { ...form, orderQty: +form.orderQty, unitValue: +form.unitValue || 0, smv: +form.smv || 0, planningDays: +form.planningDays || 30, workingHours: +form.workingHours || 10 };
    if (modal === 'add') {
      addOrder({ ...data, id: uid('ord'), createdAt: new Date().toISOString().split('T')[0] });
    } else {
      updateOrder(modal.id, data);
    }
    closeModal();
  }

  function handleDelete(id) { if (confirm('Delete this order?')) deleteOrder(id); }
  function handleBulkDelete() { if (confirm(`Delete ${selected.size} orders?`)) { selected.forEach(id => deleteOrder(id)); setSelected(new Set()); } }

  function toggleSelect(id) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleAll() { setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id))); }

  function handleExport() {
    const rows = filtered.map(o => {
      const m = metricsMap[o.id] || {};
      return { Buyer: o.buyer, PO: o.poNumber, Style: o.style, Item: o.itemType, SMV: o.smv, 'Ship Date': o.shipDate, 'Order Qty': o.orderQty, 'Unit Value': o.unitValue, Status: o.status, 'Produced': m.producedQty || 0, 'Balance': m.sewingBalance || 0, 'Achievement%': m.achievement || 0, 'Total Value': m.totalValue || 0 };
    });
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `KAD_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  const statusBadge = (s) => {
    const cls = s === 'COMPLETED' || s === 'SHIPPED' ? 'success' : s === 'IN_PROGRESS' ? 'info' : s === 'PENDING' ? 'muted' : 'warning';
    return <span className={`badge badge-${cls}`}>{s.replace('_', ' ')}</span>;
  };

  const delaybadge = (status) => {
    const cls = status === 'TIGHT' ? 'danger' : status === 'AT_RISK' ? 'warning' : status === 'DONE' ? 'primary' : 'success';
    const label = status === 'TIGHT' ? 'DELAYED' : status === 'AT_RISK' ? 'AT RISK' : status === 'DONE' ? 'DONE' : 'ON TRACK';
    return <span className={`badge badge-${cls}`}>{label}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Order Management</h2><p>{formatNumber(orders.length)} orders — {formatNumber(filtered.length)} showing</p></div>
        <div className="page-actions">
          {selected.size > 0 && <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}><Trash2 size={14} />Delete ({selected.size})</button>}
          <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={14} />Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />New Order</button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search PO, buyer, style..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '34px', minWidth: '240px' }} />
        </div>
        <select className="select" value={filterBuyer} onChange={e => setFilterBuyer(e.target.value)} style={{ minWidth: '140px' }}>
          <option value="">All Buyers</option>
          {buyers.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '140px' }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="data-table-wrap" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
              <th>Buyer</th><th>PO Number</th><th>Style</th><th>Item</th><th>SMV</th>
              <th>Ship Date</th><th className="num">Order Qty</th><th className="num">Produced</th>
              <th className="num">Balance</th><th className="num">Achievement</th><th>Delay</th>
              <th>Status</th><th className="num">Total Value</th><th style={{ width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const m = metricsMap[o.id] || {};
              return (
                <tr key={o.id}>
                  <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                  <td style={{ fontWeight: 600 }}>{o.buyer}</td>
                  <td style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>{o.poNumber}</td>
                  <td>{o.style}</td><td>{o.itemType}</td><td className="num">{o.smv}</td>
                  <td>{formatDate(o.shipDate)}</td>
                  <td className="num">{formatNumber(o.orderQty)}</td>
                  <td className="num" style={{ color: 'var(--success)' }}>{formatNumber(m.producedQty || 0)}</td>
                  <td className="num" style={{ color: (m.sewingBalance || 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>{formatNumber(m.sewingBalance || 0)}</td>
                  <td className="num">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <div className="progress-bar" style={{ width: '60px' }}>
                        <div className={`progress-fill ${(m.achievement || 0) >= 100 ? 'success' : (m.achievement || 0) >= 50 ? 'primary' : 'warning'}`} style={{ width: `${Math.min(100, m.achievement || 0)}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.achievement || 0}%</span>
                    </div>
                  </td>
                  <td>{delaybadge(m.status || 'OK')}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td className="num">{formatCurrency(m.totalValue || 0)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => openEdit(o)}><Edit size={13} /></button>
                      <button className="btn-icon" style={{ width: '28px', height: '28px', color: 'var(--danger)' }} onClick={() => handleDelete(o.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'New Order' : `Edit ${form.poNumber}`}</h2>
              <button className="btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                <div className="form-group"><label className="form-label">Buyer</label>
                  <select className="select" value={form.buyer} onChange={e => setForm(f => ({ ...f, buyer: e.target.value }))}><option value="">Select Buyer</option>{BUYERS.map(b => <option key={b}>{b}</option>)}</select></div>
                <div className="form-group"><label className="form-label">PO Number</label><input className="input" value={form.poNumber} onChange={e => setForm(f => ({ ...f, poNumber: e.target.value }))} placeholder="PO-2025-XXXX" /></div>
                <div className="form-group"><label className="form-label">Style</label><input className="input" value={form.style} onChange={e => setForm(f => ({ ...f, style: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Item Type</label>
                  <select className="select" value={form.itemType} onChange={e => setForm(f => ({ ...f, itemType: e.target.value }))}><option value="">Select</option>{ITEMS.map(i => <option key={i}>{i}</option>)}</select></div>
                <div className="form-group"><label className="form-label">SMV</label><input className="input" type="number" step="0.1" value={form.smv} onChange={e => setForm(f => ({ ...f, smv: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Ship Date</label><input className="input" type="date" value={form.shipDate} onChange={e => setForm(f => ({ ...f, shipDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Order Qty</label><input className="input" type="number" value={form.orderQty} onChange={e => setForm(f => ({ ...f, orderQty: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Unit Value ($)</label><input className="input" type="number" step="0.01" value={form.unitValue} onChange={e => setForm(f => ({ ...f, unitValue: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Sewing Start</label><input className="input" type="date" value={form.sewingStartDate} onChange={e => setForm(f => ({ ...f, sewingStartDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Assign Line</label>
                  <select className="select" value={form.assignedLineId} onChange={e => { const l = lines.find(ln => ln.id === e.target.value); setForm(f => ({ ...f, assignedLineId: e.target.value, assignedFloor: l ? l.floor : '' })); }}>
                    <option value="">Select Line</option>{lines.map(l => <option key={l.id} value={l.id}>{l.name} ({l.floor})</option>)}</select></div>
                <div className="form-group"><label className="form-label">Fabric Status</label>
                  <select className="select" value={form.fabricStatus} onChange={e => setForm(f => ({ ...f, fabricStatus: e.target.value }))}>{FABRIC.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Planning Days</label><input className="input" type="number" value={form.planningDays} onChange={e => setForm(f => ({ ...f, planningDays: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Working Hours</label><input className="input" type="number" value={form.workingHours} onChange={e => setForm(f => ({ ...f, workingHours: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create Order' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
