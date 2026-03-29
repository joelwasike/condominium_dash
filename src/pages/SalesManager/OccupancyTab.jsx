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

const OccupancyTab = ({
  properties,
  clients,
  propertyStatusFilter,
  setPropertyStatusFilter,
  propertyTypeFilter,
  setPropertyTypeFilter,
  propertyUrgencyFilter,
  setPropertyUrgencyFilter,
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
  const totalProperties = properties.length;

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
  const villas = properties.filter(isVilla);
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
  const occupiedProperties = properties.filter(p => {
    const total = p.NumberOfUnits ?? p.numberOfUnits ?? 1;
    const filled = getFilledUnits(p);
    return total > 0 && filled >= total;
  }).length;
  const vacantProperties = properties.filter(p => {
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
      <div className="sa-occupancy-page">
        <div className="sa-occupancy-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setOccupancyDetailView('list'); setOccupancySelectedProperty(null); setOccupancyDetailData(null); }}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h2>Occupancy: {buildingName}</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Units, tenants and occupancy overview</p>
          </div>
        </div>
        {occupancyDetailLoading ? (
          <div className="sa-section-card" style={{ padding: '48px', textAlign: 'center' }}>
            <p className="sa-cell-sub" style={{ margin: 0 }}>Loading…</p>
          </div>
        ) : (
          <>
            <div className="sa-occupancy-metrics" style={{ marginTop: '20px' }}>
              <div className="sa-metric-card">
                <p className="sa-metric-label">Total Units</p>
                <p className="sa-metric-value">{totalUnits}</p>
              </div>
              <div className="sa-metric-card">
                <p className="sa-metric-label">Occupied</p>
                <p className="sa-metric-value">{occupiedCountDetail}</p>
              </div>
              <div className="sa-metric-card">
                <p className="sa-metric-label">Vacant</p>
                <p className="sa-metric-value">{vacantCountDetail}</p>
              </div>
              <div className="sa-metric-card">
                <p className="sa-metric-label">Occupancy Rate</p>
                <p className="sa-metric-value">{occupancyRateDetail}%</p>
              </div>
              <div className="sa-metric-card">
                <p className="sa-metric-label">Total Rent (monthly)</p>
                <p className="sa-metric-value">{totalRent.toLocaleString()} XOF</p>
              </div>
            </div>
            {pieData.length > 0 && (
              <div className="sa-section-card" style={{ marginTop: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Occupancy</h3>
                <div style={{ width: '100%', maxWidth: 340, height: 260, margin: '0 auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
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
            <div className="sa-section-card" style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Occupied units</h3>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Units with current tenants</p>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Tenant</th>
                      <th>Rent</th>
                      <th>Enter date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupiedUnits.length > 0 ? (
                      occupiedUnits.map((u, i) => {
                        const tenantName = u.tenant || u.Tenant || '';
                        return (
                        <tr key={u.id || i}>
                          <td>
                            {u.unitNumber || u.name || `Unit ${i + 1}`}
                            {tenantName ? <span style={{ color: '#6b7280', fontSize: '0.875rem' }}> – {tenantName}</span> : null}
                          </td>
                          <td>{tenantName || '—'}</td>
                          <td>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                          <td>{u.enterDate || '—'}</td>
                          <td><span className="sa-status-pill occupied">{u.status || u.statut || 'Occupied'}</span></td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={5} className="sa-table-empty">No occupied units</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sa-section-card" style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0' }}>Vacant units</h3>
              <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>Available units</p>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Rent</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacantUnits.length > 0 ? (
                      vacantUnits.map((u, i) => (
                        <tr key={u.id || i}>
                          <td>{u.unitNumber || u.name || `Unit ${i + 1}`}</td>
                          <td>{typeof u.rentPrice === 'number' ? u.rentPrice.toLocaleString() : u.rentPrice || u.rent || '—'} F CFA</td>
                          <td>{u.type || '—'}</td>
                          <td><span className="sa-status-pill vacant">{u.status || u.statut || 'Vacant'}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="sa-table-empty">No vacant units</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalUnits === 0 && (
              <div className="sa-section-card" style={{ marginTop: '20px', padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                <p style={{ margin: 0 }}>This property has no units in the system yet.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="sa-occupancy-page">
      <div className="sa-occupancy-header">
        <div>
          <h2>Property Occupancy Overview</h2>
        <p>Monitor occupancy status and manage vacant properties</p>
        </div>
      </div>

      <div className="sa-occupancy-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Properties</p>
          <p className="sa-metric-value">{totalProperties}</p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Villas</p>
          <p className="sa-metric-value">{totalVillas}</p>
          </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total Tenants</p>
          <p className="sa-metric-value">{clients.length}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Occupied Properties</p>
          <p className="sa-metric-value">{occupiedProperties}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Vacant Properties</p>
          <p className="sa-metric-value">{vacantProperties}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Occupied Villas</p>
          <p className="sa-metric-value">{occupiedVillas}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Vacant Villas</p>
          <p className="sa-metric-value">{vacantVillas}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Occupancy Rate</p>
          <p className="sa-metric-value">{occupancyRate}%</p>
        </div>
      </div>

      <div className="sa-transactions-filters">
        <button className="sa-filter-button" onClick={() => {
          const filters = document.querySelector('.sa-property-filters');
          if (filters) filters.style.display = filters.style.display === 'none' ? 'flex' : 'none';
        }}>
          <Filter size={16} />
          Filter
        </button>
        <select
          className="sa-filter-button"
          value={propertyStatusFilter}
          onChange={(e) => setPropertyStatusFilter(e.target.value)}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <option value="">All Status</option>
          <option value="Vacant">Vacant</option>
          <option value="Occupied">Occupied</option>
          </select>
        <select
          className="sa-filter-button"
          value={propertyTypeFilter}
          onChange={(e) => setPropertyTypeFilter(e.target.value)}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <option value="">All Types</option>
          <option value="Apartment">Apartment</option>
          <option value="House">House</option>
          <option value="Condo">Condo</option>
          <option value="Studio">Studio</option>
          </select>
        <select
          className="sa-filter-button"
          value={propertyUrgencyFilter}
          onChange={(e) => setPropertyUrgencyFilter(e.target.value)}
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <option value="">All Urgency</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h3>Properties</h3>
            <p>Manage all properties and their occupancy status.</p>
          </div>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
          <thead>
            <tr>
                <th />
                <th>Property</th>
              <th>Type</th>
              <th>Status</th>
              <th>Units (filled / total)</th>
              <th>Property Type</th>
              <th>Rent</th>
              <th>Urgency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.length > 0 ? (
                properties.map(property => {
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property.Address || property.address || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property.Type || property.type || 'N/A'}</span>
                          {property.BuildingType || property.buildingType ? (
                            <span className="sa-cell-sub">({property.BuildingType || property.buildingType})</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`sa-status-pill ${isFull ? 'occupied' : 'vacant'}`}>
                          {isFull ? 'Occupied' : (remaining > 0 ? 'Partially filled' : (property.Status || property.status || 'Unknown'))}
                    </span>
                  </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{filledUnits} / {totalUnits}</span>
                          {remaining > 0 && (
                            <span className="sa-cell-sub" style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                              {remaining} remaining
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="sa-cell-main">
                          <span className="sa-cell-title">{property.PropertyType || property.propertyType || 'N/A'}</span>
                        </div>
                      </td>
                      <td>{property.Rent || property.rent ? `${property.Rent || property.rent} XOF/month` : 'N/A'}</td>
                      <td>
                        {property.Urgency || property.urgency ? (
                          <span className={`sa-status-pill ${(property.Urgency || property.urgency).toLowerCase()}`}>
                            {property.Urgency || property.urgency}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="sa-action-button"
                          onClick={() => openEditPropertyModal(property)}
                          title="Edit Property"
                        >
                          ✏️
                    </button>
                  </td>
                </tr>
                  );
                })
            ) : (
              <tr>
                  <td colSpan={9} className="sa-table-empty">No properties found. Create your first property to get started.</td>
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
