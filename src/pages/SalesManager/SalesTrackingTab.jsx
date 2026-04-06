import React from 'react';
import { Package } from 'lucide-react';

/* ── shared inline styles ── */
const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { available: { bg: '#dcfce7', c: '#166534' }, sold: { bg: '#fee2e2', c: '#991b1b' }, pending: { bg: '#fef3c7', c: '#92400e' }, reserved: { bg: '#dbeafe', c: '#1d4ed8' }, 'for sale': { bg: '#dcfce7', c: '#166534' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const filterBtn = (active) => ({ padding: '8px 16px', borderRadius: '10px', border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' });
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };

const metricColors = [
  { accent: '#3b82f6', bg: '#eff6ff' },
  { accent: '#f59e0b', bg: '#fffbeb' },
  { accent: '#8b5cf6', bg: '#f5f3ff' },
  { accent: '#ec4899', bg: '#fdf2f8' },
  { accent: '#10b981', bg: '#ecfdf5' },
];

const SalesTrackingTab = ({
  salesProperties,
  salesTypeFilter,
  setSalesTypeFilter,
}) => {
  const normalizeType = (type) => (type || '').toLowerCase();

  const filteredSales = salesProperties.filter((property) => {
    if (!salesTypeFilter) return true;
    return normalizeType(property.Type || property.type) === salesTypeFilter;
  });

  const totalSales = salesProperties.length;
  const typeCounts = {
    house: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'house').length,
    apartment: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'apartment').length,
    villa: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'villa').length,
    land: salesProperties.filter((p) => normalizeType(p.Type || p.type) === 'land').length,
  };

  const metrics = [
    { label: 'Total For Sale', value: totalSales },
    { label: 'Houses', value: typeCounts.house },
    { label: 'Apartments', value: typeCounts.apartment },
    { label: 'Villas', value: typeCounts.villa },
    { label: 'Land', value: typeCounts.land },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#1e293b' }}>Sales Tracking</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Monitor all properties that are strictly for sale.</p>
      </div>

      {/* Metric cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {metrics.map((m, i) => {
          const col = metricColors[i % metricColors.length];
          return (
            <div key={m.label} style={{ ...card, borderLeft: `4px solid ${col.accent}`, background: col.bg, padding: '20px' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
              <p style={{ margin: '8px 0 0', fontSize: '1.6rem', fontWeight: 700, color: col.accent }}>{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Type filter buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button style={filterBtn(!salesTypeFilter)} onClick={() => setSalesTypeFilter('')}>All Types</button>
        <button style={filterBtn(salesTypeFilter === 'house')} onClick={() => setSalesTypeFilter('house')}>Houses</button>
        <button style={filterBtn(salesTypeFilter === 'apartment')} onClick={() => setSalesTypeFilter('apartment')}>Apartments</button>
        <button style={filterBtn(salesTypeFilter === 'villa')} onClick={() => setSalesTypeFilter('villa')}>Villas</button>
        <button style={filterBtn(salesTypeFilter === 'land')} onClick={() => setSalesTypeFilter('land')}>Land</button>
      </div>

      {/* Table card */}
      <div style={card}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Properties for Sale</h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>All houses, apartments, villas, and land that are currently for sale.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Bedrooms</th>
                <th style={thStyle}>Bathrooms</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Price</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((property, index) => {
                const price = property.price || property.Price;
                const formattedPrice = price ? `${Number(price).toLocaleString()} XOF` : 'N/A';
                const status = property.status || property.Status || 'N/A';
                return (
                  <tr key={property.id || index} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{property.address || property.Address || 'N/A'}</td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }}>
                        {property.type || property.Type || 'N/A'}
                      </span>
                    </td>
                    <td style={tdStyle}>{property.bedrooms || property.Bedrooms || 0}</td>
                    <td style={tdStyle}>{property.bathrooms || property.Bathrooms || 0}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formattedPrice}</td>
                    <td style={tdStyle}>
                      <span style={statusPill(status)}>{status}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} style={emptyState}>
                    <Package size={40} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                    <div>No properties for sale found for the selected filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesTrackingTab;
