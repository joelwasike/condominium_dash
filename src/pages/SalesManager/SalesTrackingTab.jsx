import React from 'react';

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

  return (
    <div className="sa-occupancy-page">
      <div className="sa-occupancy-header">
        <div>
          <h2>Sales Tracking</h2>
          <p>Monitor all properties that are strictly for sale.</p>
        </div>
      </div>

      <div className="sa-occupancy-metrics">
        <div className="sa-metric-card">
          <p className="sa-metric-label">Total For Sale</p>
          <p className="sa-metric-value">{totalSales}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Houses</p>
          <p className="sa-metric-value">{typeCounts.house}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Apartments</p>
          <p className="sa-metric-value">{typeCounts.apartment}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Villas</p>
          <p className="sa-metric-value">{typeCounts.villa}</p>
        </div>
        <div className="sa-metric-card">
          <p className="sa-metric-label">Land</p>
          <p className="sa-metric-value">{typeCounts.land}</p>
        </div>
      </div>

      <div className="sa-transactions-filters">
        <button className="sa-filter-button" onClick={() => setSalesTypeFilter('')}>All Types</button>
        <button className={`sa-filter-button ${salesTypeFilter === 'house' ? 'active' : ''}`} onClick={() => setSalesTypeFilter('house')}>Houses</button>
        <button className={`sa-filter-button ${salesTypeFilter === 'apartment' ? 'active' : ''}`} onClick={() => setSalesTypeFilter('apartment')}>Apartments</button>
        <button className={`sa-filter-button ${salesTypeFilter === 'villa' ? 'active' : ''}`} onClick={() => setSalesTypeFilter('villa')}>Villas</button>
        <button className={`sa-filter-button ${salesTypeFilter === 'land' ? 'active' : ''}`} onClick={() => setSalesTypeFilter('land')}>Land</button>
      </div>

      <div className="sa-section-card">
        <div className="sa-section-header">
          <h3>Properties for Sale</h3>
          <p>All houses, apartments, villas, and land that are currently for sale.</p>
        </div>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Type</th>
                <th>Bedrooms</th>
                <th>Bathrooms</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((property, index) => (
                <tr key={property.id || index}>
                  <td>{property.address || property.Address || 'N/A'}</td>
                  <td>{property.type || property.Type || 'N/A'}</td>
                  <td>{property.bedrooms || property.Bedrooms || 0}</td>
                  <td>{property.bathrooms || property.Bathrooms || 0}</td>
                  <td>{property.price || property.Price || 'N/A'}</td>
                  <td>{property.status || property.Status || 'N/A'}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="sa-table-empty">
                    No properties for sale found for the selected filters.
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
