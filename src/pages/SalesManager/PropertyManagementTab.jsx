import React from 'react';
import { ArrowLeft, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const PropertyManagementTab = ({
  properties,
  owners,
  loading,
  pmView,
  setPmView,
  pmOwnerId,
  setPmOwnerId,
  pmOwnerName,
  setPmOwnerName,
  ownerAssets,
  setOwnerAssets,
  pmPropertyId,
  pmBuildingName,
  buildingDetail,
  setBuildingDetail,
  landDetail,
  setLandDetail,
  pmLoading,
  setPmLoading,
  propertyManagementSearch,
  setPropertyManagementSearch,
  setShowAddBuildingModal,
  setShowAddVillaModal,
  setShowAddLandModal,
  setShowAddApartmentModal,
  setShowEditApartmentModal,
  setEditingUnit,
  setEditApartmentPictures,
  setEditApartmentStatusChoice,
  setShowViewApartmentModal,
  setViewingUnit,
  setShowCreatePropertyModal,
  setShowPropertyImportModal,
  setPropertyImportFile,
  setSelectedPropertyType,
  setCreatePropertyImages,
  setSelectedPropertyDetail,
  openEditPropertyModal,
  openScheduleVisit,
  addNotification,
  loadData,
  handleSeeOwner,
  handleViewBuilding,
  handleViewVilla,
  handleViewLand,
  parseUnitPictures,
}) => {
  const getPropertyOwnerId = (property) => property.LandlordID || property.landlordId || property.landlordID || property.landlord_id || property.LandlordId;
  const getOwnerId = (owner) => owner.id || owner.ID;

  // Filter owners by search (member name)
  const searchLower = (propertyManagementSearch || '').trim().toLowerCase();
  const filteredOwners = searchLower
    ? owners.filter((o) => (o.name || o.Name || '').toLowerCase().includes(searchLower))
    : owners;

  // Building management view
  if (pmView === 'building-detail' && buildingDetail) {
    const units = buildingDetail.units || [];
    const totalApartments = buildingDetail.totalApartments ?? units.length;
    const images = buildingDetail.images || [];
    const firstImage = images[0];
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => setPmView('owner-detail')}>
              <ArrowLeft size={18} /> Back
            </button>
            <div><h2>Building {pmBuildingName} management</h2></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          {firstImage && <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Total of appartments: <strong>{totalApartments}</strong></p>
          </div>
          <button type="button" className="sa-primary-cta" onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>Appartements</th><th>Type</th><th>tenant</th><th>price of rent</th><th>Enter date</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {units.map((row, i) => (
                  <tr key={row.id || i}>
                    <td>{row.unitNumber || row.name || `Appartment ${i + 1}`}</td>
                    <td>{row.type || '—'}</td>
                    <td>{row.tenant || '—'}</td>
                    <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                    <td>{row.enterDate || '—'}</td>
                    <td>{row.status || row.statut || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="table-action-button edit" style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }} onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}>View</button>
                        <button type="button" className="table-action-button contact" style={{ padding: '6px 12px' }} onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }} title="Edit apartment details">Edit</button>
                        <button type="button" className="table-action-button" style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }} onClick={async (e) => {
                          e.stopPropagation();
                          const label = row.unitNumber || row.name || `Apartment ${i + 1}`;
                          if (!window.confirm(`Delete "${label}"? This will remove the unit. If it had a tenant, they will be set to Inactive. This cannot be undone.`)) return;
                          setPmLoading(true);
                          try { await salesManagerService.deletePropertyUnit(pmPropertyId, row.id); addNotification('Unit deleted successfully', 'success'); const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId); setBuildingDetail(data); } catch (err) { addNotification(err.message || 'Failed to delete unit', 'error'); } finally { setPmLoading(false); }
                        }} disabled={pmLoading}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Villa management view
  if (pmView === 'villa-detail' && buildingDetail) {
    const units = buildingDetail.units || [];
    const images = buildingDetail.images || [];
    const firstImage = images[0];
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => setPmView('owner-detail')}>
              <ArrowLeft size={18} /> Back
            </button>
            <div><h2>Villa {pmBuildingName} management</h2></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          {firstImage && <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{pmBuildingName.toUpperCase()}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>BIG HOUSE</p>
          </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>Villa</th><th>Type</th><th>tenant</th><th>price of rent</th><th>Enter date</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {units.map((row, i) => (
                  <tr key={row.id || i}>
                    <td>VILLA</td>
                    <td>{row.type || '—'}</td>
                    <td>{row.tenant || '—'}</td>
                    <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                    <td>{row.enterDate || '—'}</td>
                    <td>{row.status || row.statut || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="table-action-button edit" style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }} onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}>View</button>
                        <button type="button" className="table-action-button contact" style={{ padding: '6px 12px' }} onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }} title="Edit apartment details">Edit</button>
                        <button type="button" className="table-action-button" style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }} onClick={async (e) => {
                          e.stopPropagation();
                          const label = row.unitNumber || row.name || `Unit ${i + 1}`;
                          if (!window.confirm(`Delete "${label}"? This will remove the unit. If it had a tenant, they will be set to Inactive. This cannot be undone.`)) return;
                          setPmLoading(true);
                          try { await salesManagerService.deletePropertyUnit(pmPropertyId, row.id); addNotification('Unit deleted successfully', 'success'); const data = await salesManagerService.getPropertyBuildingDetail(pmPropertyId); setBuildingDetail(data); } catch (err) { addNotification(err.message || 'Failed to delete unit', 'error'); } finally { setPmLoading(false); }
                        }} disabled={pmLoading}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Land detail view
  if (pmView === 'land-detail' && landDetail) {
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('owner-detail'); setLandDetail(null); }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div><h2>Land: {pmBuildingName}</h2></div>
          </div>
        </div>
        <div className="sa-section-card" style={{ marginTop: '20px', padding: '20px' }}>
          <p><strong>Name:</strong> {landDetail.name || landDetail.Address || '—'}</p>
          <p><strong>Location:</strong> {landDetail.location || landDetail.City || '—'}</p>
          <p><strong>Statut:</strong> {landDetail.statut || 'For sell'}</p>
          <p><strong>Price:</strong> {typeof landDetail.rentPrice === 'number' ? landDetail.rentPrice.toLocaleString() : landDetail.rentPrice ?? '—'}</p>
        </div>
      </div>
    );
  }

  // Owner assets view
  if (pmView === 'owner-detail' && ownerAssets) {
    const assets = ownerAssets.assets || [];
    const handleAssetClick = (asset) => {
      const type = (asset.type || '').toLowerCase();
      if (type === 'building') handleViewBuilding(asset);
      else if (type === 'villa') handleViewVilla(asset);
      else if (type === 'land') handleViewLand(asset);
      else handleViewBuilding(asset);
    };
    return (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" className="sa-primary-cta" style={{ padding: '8px 12px' }} onClick={() => { setPmView('list'); setOwnerAssets(null); setPmOwnerId(null); setPmOwnerName(''); }}>
              <ArrowLeft size={18} /> Back
            </button>
            <div><h2>{pmOwnerName} assets management</h2></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button type="button" className="sa-primary-cta" onClick={() => setShowAddBuildingModal(true)}>ADD BUILDING</button>
          <button type="button" className="sa-primary-cta" onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
          <button type="button" className="sa-primary-cta" onClick={() => setShowAddVillaModal(true)}>ADD VILLA</button>
          <button type="button" className="sa-primary-cta" onClick={() => setShowAddLandModal(true)}>ADD LAND</button>
        </div>
        {pmLoading && <p style={{ marginTop: 8 }}>Loading…</p>}
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>PROPERTY</th><th>APPARTMENTS</th><th>RENT PRICE</th><th>LOCATION</th><th>OCCUPANCY</th><th>STATUT</th><th>Actions</th></tr></thead>
              <tbody>
                {assets.map((row) => (
                  <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleAssetClick(row)} className="clickable-row">
                    <td className="sa-cell-main">{row.name || row.building || '—'}</td>
                    <td>{row.apartmentsDisplay ?? row.apartments ?? '—'}</td>
                    <td>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice ?? '—'}</td>
                    <td>{row.location || row.localisation || '—'}</td>
                    <td>{row.occupancy ?? '—'}</td>
                    <td>{row.statut ?? '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" className="table-action-button edit" style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px' }} onClick={async () => {
                          setPmLoading(true);
                          try { const full = await salesManagerService.getProperty(row.id); setSelectedPropertyDetail(full); } catch (err) { addNotification('Failed to load property details', 'error'); } finally { setPmLoading(false); }
                        }} disabled={pmLoading}>View</button>
                        <button type="button" className="table-action-button edit" style={{ background: '#22c55e', color: '#fff', padding: '6px 12px' }} onClick={() => openEditPropertyModal(row)}>Edit</button>
                        <button type="button" className="table-action-button" style={{ background: '#ef4444', color: '#fff', padding: '6px 12px' }} onClick={async (e) => {
                          e.stopPropagation();
                          const name = row.name || row.building || row.address || 'this property';
                          if (!window.confirm(`Delete "${name}"? This will remove the property and all its units. This action cannot be undone.`)) return;
                          setPmLoading(true);
                          try { await salesManagerService.deleteProperty(row.id); addNotification('Property deleted successfully', 'success'); const data = await salesManagerService.getOwnerAssets(pmOwnerId); setOwnerAssets(data); await loadData(); } catch (err) { addNotification(err.message || 'Failed to delete property', 'error'); } finally { setPmLoading(false); }
                        }} disabled={pmLoading}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assets.length === 0 && !pmLoading && <p className="sa-table-empty">No assets for this owner.</p>}
        </div>
      </div>
    );
  }

  // Property Management entry - owners list
  const unassignedProperties = properties.filter((p) => !getPropertyOwnerId(p));
  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div><h2>PROPERTY MANAGEMENT</h2></div>
        <div className="sa-clients-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" className="sa-primary-cta" onClick={() => { setSelectedPropertyType(''); setCreatePropertyImages([]); setShowCreatePropertyModal(true); }}>
            <Plus size={18} style={{ marginRight: '4px' }} /> Add Property
          </button>
          <button type="button" className="sa-primary-cta secondary" onClick={() => { setPropertyImportFile(null); setShowPropertyImportModal(true); }}>
            <FileSpreadsheet size={18} style={{ marginRight: '4px' }} /> Import from CSV
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input type="text" placeholder="Search by member name" value={propertyManagementSearch} onChange={(e) => setPropertyManagementSearch(e.target.value)} style={{ padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '220px' }} />
          </div>
        </div>
      </div>

      <div className="sa-section-card" style={{ marginTop: '20px' }}>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Total of assets</th><th>Property for sell</th><th>Property for manage</th><th>Occupancy</th><th>Income (this month)</th></tr></thead>
            <tbody>
              {filteredOwners.map((owner, index) => {
                const ownerId = getOwnerId(owner);
                return (
                  <tr key={ownerId || index} style={{ cursor: 'pointer' }} onClick={() => handleSeeOwner(owner)} className="clickable-row">
                    <td className="sa-cell-main"><span className="sa-cell-title">{owner.name || owner.Name || 'N/A'}</span></td>
                    <td>{owner.email || owner.Email || '—'}</td>
                    <td>{owner.totalOfAssets ?? owner.numberOfAssetsManaged ?? 0}</td>
                    <td>{owner.propertyForSell ?? 0}</td>
                    <td>{owner.propertyForManage ?? 0}</td>
                    <td>{owner.occupancy ?? '0/0'}</td>
                    <td>{typeof (owner.incomeThisMonth ?? owner.revenue ?? 0) === 'number' ? (owner.incomeThisMonth ?? owner.revenue ?? 0).toLocaleString() : (owner.incomeThisMonth ?? owner.revenue ?? 0)}</td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr><td colSpan={7} className="sa-table-empty">No owners found. Ask the Agency Director to add property owners.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unassignedProperties.length > 0 && (
        <div className="sa-section-card" style={{ marginTop: '20px' }}>
          <div className="sa-section-header">
            <div>
              <h3>Properties Without Owner</h3>
              <p>{unassignedProperties.length} properties not yet assigned to an owner</p>
            </div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>No</th><th>Address</th><th>Type</th><th>Status</th><th>Rent</th><th>Bedrooms</th><th>Bathrooms</th><th></th></tr></thead>
              <tbody>
                {unassignedProperties.map((property, index) => (
                  <tr key={`unassigned-${property.ID || property.id || index}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedPropertyDetail(property)}>
                    <td>{index + 1}</td>
                    <td className="sa-cell-main"><span className="sa-cell-title">{property.Address || property.address || 'N/A'}</span></td>
                    <td>{property.Type || property.type || 'N/A'}</td>
                    <td><span className={`sa-status-pill ${(property.Status || property.status || 'unknown').toLowerCase()}`}>{property.Status || property.status || 'Unknown'}</span></td>
                    <td>{typeof (property.Rent || property.rent) === 'number' ? (property.Rent || property.rent).toLocaleString() : property.Rent || property.rent || 'N/A'}</td>
                    <td>{property.Bedrooms || property.bedrooms || 0}</td>
                    <td>{property.Bathrooms || property.bathrooms || 0}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="sa-row-actions">
                        <button type="button" className="table-action-button edit" onClick={() => openEditPropertyModal(property)}>Edit</button>
                        <button type="button" className="table-action-button contact" onClick={() => openScheduleVisit(property.Address || property.address)}>Schedule</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyManagementTab;
