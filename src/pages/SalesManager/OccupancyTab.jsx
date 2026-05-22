import React from 'react';
import { ArrowLeft, Filter } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const statusPill = (s) => {
  const sl = (s || '').toLowerCase();
  const m = { occupied: { bg: '#dcfce7', c: '#166534' }, vacant: { bg: '#fef3c7', c: '#92400e' }, active: { bg: '#dcfce7', c: '#166534' }, inactive: { bg: '#fee2e2', c: '#991b1b' }, pending: { bg: '#fef3c7', c: '#92400e' }, completed: { bg: '#dcfce7', c: '#166534' }, available: { bg: '#dbeafe', c: '#1d4ed8' }, sold: { bg: '#f3e8ff', c: '#7c3aed' }, rented: { bg: '#d1fae5', c: '#065f46' } };
  const { bg, c } = m[sl] || { bg: '#f1f5f9', c: '#475569' };
  return { display: 'inline-block', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, background: bg, color: c };
};
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' };
const btnOutline = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '220px' };
const filterBtn = (active) => ({ padding: '8px 16px', borderRadius: '10px', border: active ? '2px solid #3b82f6' : '1px solid #e2e8f0', background: active ? '#eff6ff' : '#fff', color: active ? '#2563eb' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' });
const selectStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155', background: '#fff', cursor: 'pointer', outline: 'none' };
const backBtn = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 };

const metricCard = { background: '#fff', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 1px 8px rgba(15,23,42,0.05)', border: '1px solid #f1f5f9', minWidth: '140px', flex: '1 1 140px' };
const metricLabel = { margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 };
const metricValue = { margin: '6px 0 0', fontSize: '1.45rem', fontWeight: 700, color: '#1e293b' };
const emptyRow = { padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' };

const OccupancyTab = ({
  properties,
  clients,
  propertyStatusFilter,
  setPropertyStatusFilter,
  occupancyDetailView,
  setOccupancyDetailView,
  occupancySelectedProperty,
  setOccupancySelectedProperty,
  occupancyDetailData,
  setOccupancyDetailData,
  occupancyDetailLoading,
  handleOpenOccupancyDetail,
  openEditPropertyModal,
}) => {
  // Occupancy is only for rental/managed properties. Exclude "For Sale" listings.
  const isForSale = (p) => {
    const propertyType = (p.PropertyType || p.propertyType || '').toString().trim().toLowerCase();
    const status = (p.Status || p.status || '').toString().trim().toLowerCase();
    return propertyType === 'for sale' || status === 'for sale';
  };
  const rentableProperties = (Array.isArray(properties) ? properties : []).filter((p) => !isForSale(p));
  const totalProperties = rentableProperties.length;

  // Helper: filled units per property (from API or derived from status)
  const getFilledUnits = (property) => {
    const n = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
    const filled = property.filledUnits ?? property.occupiedUnits ?? property.FilledUnits ?? property.OccupiedUnits;
    if (filled !== undefined && filled !== null) return Number(filled);
    const status = (property.Status || property.status || '').toLowerCase();
    if (n <= 1) return status === 'occupied' ? 1 : 0;
    return 0;
  };

  // Villas: filter by Type, then use units to determine occupied vs vacant
  const isVilla = (p) => (p.Type || p.type || '').toString().trim().toLowerCase() === 'villa';
  const villas = rentableProperties.filter(isVilla);
  const totalVillas = villas.length;
  const occupiedVillas = villas.filter(v => {
    const total = v.NumberOfUnits ?? v.numberOfUnits ?? 1;
    const filled = getFilledUnits(v);
    return total > 0 && filled >= total;
  }).length;
  const vacantVillas = villas.filter(v => {
    const total = v.NumberOfUnits ?? v.numberOfUnits ?? 1;
    const filled = getFilledUnits(v);
    return total === 0 || filled < total;
  }).length;

  // All properties (for overall metrics)
  const occupiedProperties = rentableProperties.filter(p => {
    const total = p.NumberOfUnits ?? p.numberOfUnits ?? 1;
    const filled = getFilledUnits(p);
    return total > 0 && filled >= total;
  }).length;
  const vacantProperties = rentableProperties.filter(p => {
    const total = p.NumberOfUnits ?? p.numberOfUnits ?? 1;
    const filled = getFilledUnits(p);
    return total === 0 || filled < total;
  }).length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

  // Occupancy detail view: single property overview (units, tenants, graph)
  if (occupancyDetailView === 'detail') {
    const detail = occupancyDetailData || {};
    const units = detail.units || [];
    const buildingName = detail.buildingName || occupancySelectedProperty?.Address || occupancySelectedProperty?.address || 'Property';
    const totalUnits = detail.totalApartments ?? units.length;
    const isUnitOccupied = (u) => (u.occupancyStatus || u.status || u.statut || '').toString().trim().toLowerCase() === 'occupied';
    const occupiedUnits = units.filter(isUnitOccupied);
    const vacantUnits = units.filter((u) => !isUnitOccupied(u));
    const occupiedCountDetail = occupiedUnits.length;
    const vacantCountDetail = vacantUnits.length;
    const occupancyRateDetail = totalUnits > 0 ? Math.round((occupiedCountDetail / totalUnits) * 100) : 0;
    const totalRent = occupiedUnits.reduce((sum, u) => sum + (Number(u.rentPrice) || Number(u.rent) || 0), 0);
    const pieData = [
      { name: 'Occupied', value: occupiedCountDetail, color: '#22c55e' },
      { name: 'Vacant', value: vacantCountDetail, color: '#94a3b8' },
    ].filter((d) => d.value > 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={backBtn} onClick={() => { setOccupancyDetailView('list'); setOccupancySelectedProperty(null); setOccupancyDetailData(null); }}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Occupancy: {buildingName}</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Units, tenants and occupancy overview</p>
          </div>
        </div>
        {occupancyDetailLoading ? (
          <div style={{ ...card, padding: '48px', textAlign: 'center', marginTop: '20px' }}>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.88rem' }}>Loading...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
              <div style={metricCard}>
                <p style={metricLabel}>Total Units</p>
                <p style={metricValue}>{totalUnits}</p>
              </div>
              <div style={metricCard}>
                <p style={metricLabel}>Occupied</p>
                <p style={metricValue}>{occupiedCountDetail}</p>
              </div>
              <div style={metricCard}>
                <p style={metricLabel}>Vacant</p>
                <p style={metricValue}>{vacantCountDetail}</p>
              </div>
              <div style={metricCard}>
                <p style={metricLabel}>Occupancy Rate</p>
                <p style={metricValue}>{occupancyRateDetail}%</p>
              </div>
              <div style={metricCard}>
                <p style={metricLabel}>Total Rent (monthly)</p>
                <p style={metricValue}>{totalRent.toLocaleString()} XOF</p>
              </div>
            </div>
            {pieData.length > 0 && (
              <div style={{ ...card, marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e293b' }}>Occupancy</h3>
                <div style={{ width: '100%', maxWidth: 340, height: 260, margin: '0 auto' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={72}>
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Units']} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div style={{ ...card, marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>Occupied units</h3>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Units with current tenants</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Unit</th>
                      <th style={thStyle}>Tenant</th>
                      <th style={thStyle}>Rent</th>
                      <th style={thStyle}>Enter date</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupiedUnits.length > 0 ? (
                      occupiedUnits.map((u, i) => {
                        const tenantName = u.tenant || u.Tenant || '';
                        return (
                        <tr key={u.id || i}>
                          <td style={tdStyle}>
                            {u.unitNumber || u.name || `Unit ${i + 1}`}
                            {tenantName ? <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> – {tenantName}</span> : null}
                          </td>
                          <td style={tdStyle}>{tenantName || '—'}</td>
                          <td style={tdStyle}>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                          <td style={tdStyle}>{u.enterDate || '—'}</td>
                          <td style={tdStyle}><span style={statusPill(u.status || u.statut || 'Occupied')}>{u.status || u.statut || 'Occupied'}</span></td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} style={emptyRow}>No occupied units</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ ...card, marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>Vacant units</h3>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Available units</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Unit</th>
                      <th style={thStyle}>Rent</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacantUnits.length > 0 ? (
                      vacantUnits.map((u, i) => (
                        <tr key={u.id || i}>
                          <td style={tdStyle}>{u.unitNumber || u.name || `Unit ${i + 1}`}</td>
                          <td style={tdStyle}>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                          <td style={tdStyle}>{u.type || '—'}</td>
                          <td style={tdStyle}><span style={statusPill(u.status || u.statut || 'Vacant')}>{u.status || u.statut || 'Vacant'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={emptyRow}>No vacant units</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalUnits === 0 && (
              <div style={{ ...card, marginTop: '20px', padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                <p style={{ margin: 0 }}>This property has no units in the system yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Property Occupancy Overview</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Monitor occupancy status and manage vacant properties</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={metricCard}>
          <p style={metricLabel}>Total Properties</p>
          <p style={metricValue}>{totalProperties}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Total Villas</p>
          <p style={metricValue}>{totalVillas}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Total Tenants</p>
          <p style={metricValue}>{clients.length}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Occupied Properties</p>
          <p style={metricValue}>{occupiedProperties}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Vacant Properties</p>
          <p style={metricValue}>{vacantProperties}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Occupied Villas</p>
          <p style={metricValue}>{occupiedVillas}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Vacant Villas</p>
          <p style={metricValue}>{vacantVillas}</p>
        </div>
        <div style={metricCard}>
          <p style={metricLabel}>Occupancy Rate</p>
          <p style={metricValue}>{occupancyRate}%</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <button style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => {
          const filters = document.querySelector('[data-property-filters]');
          if (filters) filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
        }}>
          <Filter size={16} />
          Filter
        </button>
        <select
          style={selectStyle}
          value={propertyStatusFilter}
          onChange={(e) => setPropertyStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Vacant">Vacant</option>
          <option value="Occupied">Occupied</option>
        </select>
      </div>

      <div style={card}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Properties</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Manage all properties and their occupancy status.</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
          <thead>
            <tr>
                <th style={thStyle} />
                <th style={thStyle}>Property</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Units (filled / total)</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rentableProperties.length > 0 ? (
                rentableProperties.map(property => {
                  const propertyId = property.ID || property.id;
                  const totalUnits = property.NumberOfUnits ?? property.numberOfUnits ?? 1;
                  const filledUnits = getFilledUnits(property);
                  const remaining = Math.max(0, totalUnits - filledUnits);
                  const isFull = totalUnits > 0 && filledUnits >= totalUnits;
                  return (
                    <tr
                      key={propertyId}
                      onClick={() => handleOpenOccupancyDetail(property)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenOccupancyDetail(property); } }}
                    >
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{property.Address || property.address || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{property.Type || property.type || 'N/A'}</span>
                          {property.BuildingType || property.buildingType ? (
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>({property.BuildingType || property.buildingType})</span>
                          ) : null}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={statusPill(isFull ? 'occupied' : 'vacant')}>
                          {isFull ? 'Occupied' : (remaining > 0 ? 'Partially filled' : (property.Status || property.status || 'Unknown'))}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{filledUnits} / {totalUnits}</span>
                          {remaining > 0 && (
                            <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                              {remaining} remaining
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <button
                          style={{ ...btnOutline, padding: '6px 12px' }}
                          onClick={() => openEditPropertyModal(property)}
                          title="Edit Property"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={6} style={emptyRow}>No properties found. Create your first property to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default OccupancyTab;
