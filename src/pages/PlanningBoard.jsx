import { useMemo, useRef } from 'react';
import { useData } from '../store/DataContext';
import { computeOrderMetrics } from '../engine/formulas';
import { formatDateShort } from '../utils/format';

export default function PlanningBoard() {
  const { orders, lines, productionRecords, shipments } = useData();
  const scrollRef = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { startDate, days, dateArray } = useMemo(() => {
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    const totalDays = 60;
    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return { startDate: start, days: totalDays, dateArray: arr };
  }, []);

  const lineRows = useMemo(() => {
    return lines.filter(l => l.status === 'ACTIVE').map(line => {
      const lineOrders = orders.filter(o => o.assignedLineId === line.id && o.status !== 'SHIPPED');
      const bars = lineOrders.map(order => {
        const m = computeOrderMetrics(order, productionRecords.filter(r => r.orderId === order.id), shipments.filter(s => s.orderId === order.id));
        const sewStart = order.sewingStartDate ? new Date(order.sewingStartDate) : new Date();
        const sewEnd = m.dynamicEndDate ? new Date(m.dynamicEndDate) : new Date(order.shipDate);
        const startOffset = Math.max(0, Math.floor((sewStart - startDate) / 86400000));
        const duration = Math.max(1, Math.ceil((sewEnd - sewStart) / 86400000));
        const statusClass = order.status === 'COMPLETED' ? 'done' : order.status === 'PENDING' ? 'pending' : m.status === 'TIGHT' ? 'tight' : m.status === 'AT_RISK' ? 'at_risk' : 'ok';
        return { order, metrics: m, startOffset, duration, statusClass };
      });
      return { line, bars };
    });
  }, [lines, orders, productionRecords, shipments, startDate]);

  const todayIdx = Math.floor((today - startDate) / 86400000);
  const cellW = 42;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Planning Board</h2><p>Gantt chart — line-wise order allocation timeline</p></div>
        <div className="page-actions">
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ cls: 'ok', lbl: 'On Track' }, { cls: 'at_risk', lbl: 'At Risk' }, { cls: 'tight', lbl: 'Delayed' }, { cls: 'done', lbl: 'Done' }].map(l => (
              <div key={l.cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div className={`gantt-bar ${l.cls}`} style={{ position: 'static', transform: 'none', width: '16px', height: '12px', padding: 0 }} />
                {l.lbl}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gantt-container" ref={scrollRef} style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div className="gantt-header">
          <div className="gantt-label" style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)' }}>LINE</div>
          <div className="gantt-cells">
            {dateArray.map((d, i) => {
              const isToday = i === todayIdx;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div key={i} className={`gantt-header-cell${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}`}>
                  <div>{d.toLocaleDateString('en-US', { day: 'numeric' })}</div>
                  <div style={{ fontSize: '8px', opacity: .6 }}>{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rows */}
        {lineRows.map(({ line, bars }) => (
          <div key={line.id} className="gantt-row">
            <div className="gantt-label">
              <div className={`status-dot ${line.status === 'ACTIVE' ? 'success' : 'warning'}`} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{line.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{line.floor}</div>
              </div>
            </div>
            <div className="gantt-cells" style={{ position: 'relative' }}>
              {dateArray.map((d, i) => {
                const isToday = i === todayIdx;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return <div key={i} className={`gantt-cell${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}`} />;
              })}
              {bars.map(b => (
                <div key={b.order.id} className={`gantt-bar ${b.statusClass}`}
                  style={{ left: `${b.startOffset * cellW}px`, width: `${Math.max(1, b.duration) * cellW - 4}px` }}
                  title={`${b.order.poNumber} | ${b.order.buyer} | ${b.metrics.achievement}%`}>
                  {b.duration >= 3 ? `${b.order.poNumber} (${b.metrics.achievement}%)` : b.order.poNumber}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
