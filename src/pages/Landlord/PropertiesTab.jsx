import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PropertiesTab = ({
  properties, pmView, setPmView, buildingDetail, setBuildingDetail,
  pmBuildingName, setPmBuildingName, pmPropertyId, setPmPropertyId,
  pmLoading, setPmLoading, handleViewBuilding, handleViewVilla,
  addNotification, landlordService
}) => {
  const localHandleViewBuilding = handleViewBuilding || (async (property) => {
    const propId = property.id ?? property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await landlordService.getPropertyBuildingDetail(propId);
      setBuildingDetail(data);
      setPmPropertyId(propId);
      setPmBuildingName(data.buildingName || property.name || property.building || property.Address || property.address || 'Building');
      setPmView('building-detail');
    } catch (err) {
      console.error('Failed to load building detail:', err);
      addNotification('Failed to load building detail', 'error');
    } finally {
      setPmLoading(false);
    }
  });

  const localHandleViewVilla = handleViewVilla || (async (property) => {
    const propId = property.id ?? property.ID;
    if (!propId) return;
    setPmLoading(true);
    try {
      const data = await landlordService.getPropertyBuildingDetail(propId);
      setBuildingDetail(data);
      setPmPropertyId(propId);
      setPmBuildingName(data.buildingName || property.name || property.building || property.Address || property.address || 'Villa');
      setPmView('villa-detail');
    } catch (err) {
      console.error('Failed to load villa detail:', err);
      addNotification('Failed to load villa detail', 'error');
    } finally {
      setPmLoading(false);
    }
  });

  // Building detail view
  if ((pmView === 'building-detail' || pmView === 'villa-detail') && buildingDetail) {
    const units = buildingDetail.units || [];
    const totalApartments = buildingDetail.totalApartments ?? units.length;
    const images = buildingDetail.images || [];
    const firstImage = images[0];
    const isVilla = pmView === 'villa-detail';
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('list'); setBuildingDetail(null); setPmPropertyId(null); setPmBuildingName(''); }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div><h2>{isVilla ? 'Villa' : 'Building'} {pmBuildingName} management</h2></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          {firstImage && (<img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />)}
          {images.length > 1 && (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{images.slice(1, 5).map((img, i) => (<img key={i} src={img} alt={`${pmBuildingName} ${i + 2}`} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />))}</div>)}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Total of apartments: <strong>{totalApartments}</strong></p>
          </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>{isVilla ? 'Villa' : 'Apartments'}</th><th>Type</th><th>Tenant</th><th>Rent</th><th>Enter date</th><th>Status</th></tr></thead>
              <tbody>
                {units.map((row, i) => (
                  <tr key={row.id || i}>
                    <td>{row.unitNumber || row.name || (isVilla ? 'VILLA' : `Apartment ${i + 1}`)}</td>
                    <td>{row.type || '\u2014'}</td><td>{row.tenant || '\u2014'}</td>
                    <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '\u2014'} F CFA</td>
                    <td>{row.enterDate || '\u2014'}</td><td>{row.status || row.statut || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Properties list
  const propType = (p) => (p.Type || p.type || p.PropertyType || p.propertyType || '').toString().toLowerCase();
  const isBuilding = (p) => ['building', 'apartment', 'condo', 'house', 'studio'].some(t => propType(p).includes(t));
  const isVillaFn = (p) => propType(p).includes('villa');
  const buildings = properties.filter(isBuilding);
  const villas = properties.filter(isVillaFn);
  const others = properties.filter(p => !isBuilding(p) && !isVillaFn(p));

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div><h2>Property & Asset Management</h2><p>{properties.length} properties found \u2013 click a building or villa to see apartments</p></div>
      </div>
      {pmLoading && <p style={{ marginTop: 8 }}>Loading\u2026</p>}
      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Type</th><th>Apartments</th><th>Rent</th><th>Income</th><th>Location</th><th>Occupancy</th><th>Status</th><th /></tr></thead>
            <tbody>
              {[...buildings, ...villas, ...others].map((property, index) => {
                const type = propType(property);
                const isV = type.includes('villa');
                const handleClick = () => isV ? localHandleViewVilla(property) : localHandleViewBuilding(property);
                const apartmentsDisplay = property.apartmentsDisplay ?? property.apartments ?? property.NumberOfUnits ?? property.numberOfUnits ?? '\u2014';
                return (
                  <tr key={property.ID || property.id || `property-${index}`} style={{ cursor: 'pointer' }} onClick={handleClick} className="clickable-row">
                    <td className="sa-cell-main"><span className="sa-cell-title">{property.Address || property.address || property.name || property.building || 'Unknown'}</span></td>
                    <td>{property.Type || property.type || 'N/A'}</td>
                    <td>{apartmentsDisplay}</td>
                    <td>{typeof property.rentPrice === 'number' ? property.rentPrice.toLocaleString() : property.Rent?.toLocaleString() || property.rent?.toLocaleString() || '\u2014'}</td>
                    <td>{(property.income ?? property.Income ?? 0).toLocaleString()} XOF</td>
                    <td>{property.location || property.localisation || property.Address || property.address || '\u2014'}</td>
                    <td>{property.occupancy ?? '\u2014'}</td>
                    <td>{property.statut || property.Status || property.status || '\u2014'}</td>
                    <td onClick={(e) => e.stopPropagation()}><button type="button" className="sa-icon-button" title="View" onClick={handleClick}>\ud83d\udc41\ufe0f</button></td>
                  </tr>
                );
              })}
              {properties.length === 0 && !pmLoading && (<tr><td colSpan={9} className="sa-table-empty">No properties found</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropertiesTab;
