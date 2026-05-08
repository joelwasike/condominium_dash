import React from 'react';
import { ArrowLeft, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

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

const emptyRow = { padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' };
const actionBtn = (bg) => ({ background: bg, color: '#fff', padding: '6px 14px', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' });

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={backBtn} onClick={() => setPmView('owner-detail')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Building {pmBuildingName} management</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          {firstImage && <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#1e293b' }}>{pmBuildingName.toUpperCase()}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Total of appartments: <strong>{totalApartments}</strong></p>
          </div>
          <button type="button" style={btnPrimary} onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
        </div>
        <div style={{ ...card, marginTop: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Appartements</th><th style={thStyle}>Type</th><th style={thStyle}>tenant</th><th style={thStyle}>price of rent</th><th style={thStyle}>Enter date</th><th style={thStyle}>Statut</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {units.map((row, i) => (
                  <tr key={row.id || i}>
                    <td style={tdStyle}>{row.unitNumber || row.name || `Appartment ${i + 1}`}</td>
                    <td style={tdStyle}>{row.type || '—'}</td>
                    <td style={tdStyle}>{row.tenant || '—'}</td>
                    <td style={tdStyle}>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                    <td style={tdStyle}>{row.enterDate || '—'}</td>
                    <td style={tdStyle}>{row.status || row.statut || '—'}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" style={actionBtn('#3b82f6')} onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}>View</button>
                        <button type="button" style={actionBtn('#6366f1')} onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }} title="Edit apartment details">Edit</button>
                        <button type="button" style={actionBtn('#ef4444')} onClick={async (e) => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={backBtn} onClick={() => setPmView('owner-detail')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Villa {pmBuildingName} management</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
          {firstImage && <img src={firstImage} alt={pmBuildingName} style={{ width: 280, height: 160, objectFit: 'cover', borderRadius: 8 }} />}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#1e293b' }}>{pmBuildingName.toUpperCase()}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>BIG HOUSE</p>
          </div>
        </div>
        <div style={{ ...card, marginTop: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Villa</th><th style={thStyle}>Type</th><th style={thStyle}>tenant</th><th style={thStyle}>price of rent</th><th style={thStyle}>Enter date</th><th style={thStyle}>Statut</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {units.map((row, i) => (
                  <tr key={row.id || i}>
                    <td style={tdStyle}>VILLA</td>
                    <td style={tdStyle}>{row.type || '—'}</td>
                    <td style={tdStyle}>{row.tenant || '—'}</td>
                    <td style={tdStyle}>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice || '—'} F CFA</td>
                    <td style={tdStyle}>{row.enterDate || '—'}</td>
                    <td style={tdStyle}>{row.status || row.statut || '—'}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" style={actionBtn('#3b82f6')} onClick={() => { setViewingUnit(row); setShowViewApartmentModal(true); }}>View</button>
                        <button type="button" style={actionBtn('#6366f1')} onClick={() => { setEditingUnit(row); setEditApartmentPictures(parseUnitPictures(row.picture)); setEditApartmentStatusChoice((row.status || row.statut || 'Vacant').toString()); setShowEditApartmentModal(true); }} title="Edit apartment details">Edit</button>
                        <button type="button" style={actionBtn('#ef4444')} onClick={async (e) => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={backBtn} onClick={() => { setPmView('owner-detail'); setLandDetail(null); }}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Land: {pmBuildingName}</h2>
        </div>
        <div style={{ ...card, marginTop: '20px', padding: '20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#334155' }}><strong>Name:</strong> {landDetail.name || landDetail.Address || '—'}</p>
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#334155' }}><strong>Location:</strong> {landDetail.location || landDetail.City || '—'}</p>
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#334155' }}><strong>Statut:</strong> {landDetail.statut || 'For sell'}</p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}><strong>Price:</strong> {typeof landDetail.rentPrice === 'number' ? landDetail.rentPrice.toLocaleString() : landDetail.rentPrice ?? '—'}</p>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={backBtn} onClick={() => { setPmView('list'); setOwnerAssets(null); setPmOwnerId(null); setPmOwnerName(''); }}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>{pmOwnerName} assets management</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button type="button" style={btnPrimary} onClick={() => setShowAddBuildingModal(true)}>ADD BUILDING</button>
          <button type="button" style={btnPrimary} onClick={() => setShowAddApartmentModal(true)}>ADD APPARTMENT</button>
          <button type="button" style={btnPrimary} onClick={() => setShowAddVillaModal(true)}>ADD VILLA</button>
          <button type="button" style={btnPrimary} onClick={() => setShowAddLandModal(true)}>ADD LAND</button>
        </div>
        {pmLoading && <p style={{ marginTop: 8, color: '#64748b' }}>Loading...</p>}
        <div style={{ ...card, marginTop: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>PROPERTY</th><th style={thStyle}>APPARTMENTS</th><th style={thStyle}>RENT PRICE</th><th style={thStyle}>LOCATION</th><th style={thStyle}>OCCUPANCY</th><th style={thStyle}>STATUT</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {assets.map((row) => (
                  <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => handleAssetClick(row)}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{row.name || row.building || '—'}</td>
                    <td style={tdStyle}>{row.apartmentsDisplay ?? row.apartments ?? '—'}</td>
                    <td style={tdStyle}>{typeof row.rentPrice === 'number' ? row.rentPrice.toLocaleString() : row.rentPrice ?? '—'}</td>
                    <td style={tdStyle}>{row.location || row.localisation || '—'}</td>
                    <td style={tdStyle}>{row.occupancy ?? '—'}</td>
                    <td style={tdStyle}>{row.statut ?? '—'}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" style={actionBtn('#3b82f6')} onClick={async () => {
                          setPmLoading(true);
                          try { const full = await salesManagerService.getProperty(row.id); setSelectedPropertyDetail(full); } catch (err) { addNotification('Failed to load property details', 'error'); } finally { setPmLoading(false); }
                        }} disabled={pmLoading}>View</button>
                        <button type="button" style={actionBtn('#22c55e')} onClick={() => openEditPropertyModal(row)}>Edit</button>
                        <button type="button" style={actionBtn('#ef4444')} onClick={async (e) => {
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
          {assets.length === 0 && !pmLoading && <p style={emptyRow}>No assets for this owner.</p>}
        </div>
      </div>
    );
  }

  // Property Management entry - owners list
  const unassignedProperties = properties.filter((p) => !getPropertyOwnerId(p));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>PROPERTY MANAGEMENT</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={btnPrimary} onClick={() => { setSelectedPropertyType(''); setCreatePropertyImages([]); setShowCreatePropertyModal(true); }}>
            <Plus size={18} /> Add Property
          </button>
          <button type="button" style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setPropertyImportFile(null); setShowPropertyImportModal(true); }}>
            <FileSpreadsheet size={18} /> Bulk Import
          </button>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
            <input type="text" placeholder="Search by member name" value={propertyManagementSearch} onChange={(e) => setPropertyManagementSearch(e.target.value)} style={{ ...searchBar, paddingLeft: '36px' }} />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Total of assets</th><th style={thStyle}>Property for sell</th><th style={thStyle}>Property for manage</th><th style={thStyle}>Occupancy</th><th style={thStyle}>Income (this month)</th></tr></thead>
            <tbody>
              {filteredOwners.map((owner, index) => {
                const ownerId = getOwnerId(owner);
                return (
                  <tr key={ownerId || index} style={{ cursor: 'pointer' }} onClick={() => handleSeeOwner(owner)}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{owner.name || owner.Name || 'N/A'}</td>
                    <td style={tdStyle}>{owner.email || owner.Email || '—'}</td>
                    <td style={tdStyle}>{owner.totalOfAssets ?? owner.numberOfAssetsManaged ?? 0}</td>
                    <td style={tdStyle}>{owner.propertyForSell ?? 0}</td>
                    <td style={tdStyle}>{owner.propertyForManage ?? 0}</td>
                    <td style={tdStyle}>{owner.occupancy ?? '0/0'}</td>
                    <td style={tdStyle}>{typeof (owner.incomeThisMonth ?? owner.revenue ?? 0) === 'number' ? (owner.incomeThisMonth ?? owner.revenue ?? 0).toLocaleString() : (owner.incomeThisMonth ?? owner.revenue ?? 0)}</td>
                  </tr>
                );
              })}
              {filteredOwners.length === 0 && (
                <tr><td colSpan={7} style={emptyRow}>No owners found. Ask the Agency Director to add property owners.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unassignedProperties.length > 0 && (
        <div style={{ ...card, marginTop: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Properties Without Owner</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>{unassignedProperties.length} properties not yet assigned to an owner</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>No</th><th style={thStyle}>Address</th><th style={thStyle}>Type</th><th style={thStyle}>Status</th><th style={thStyle}>Rent</th><th style={thStyle}>Bedrooms</th><th style={thStyle}>Bathrooms</th><th style={thStyle}></th></tr></thead>
              <tbody>
                {unassignedProperties.map((property, index) => (
                  <tr key={`unassigned-${property.ID || property.id || index}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedPropertyDetail(property)}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{property.Address || property.address || 'N/A'}</td>
                    <td style={tdStyle}>{property.Type || property.type || 'N/A'}</td>
                    <td style={tdStyle}><span style={statusPill((property.Status || property.status || 'unknown').toLowerCase())}>{property.Status || property.status || 'Unknown'}</span></td>
                    <td style={tdStyle}>{typeof (property.Rent || property.rent) === 'number' ? (property.Rent || property.rent).toLocaleString() : property.Rent || property.rent || 'N/A'}</td>
                    <td style={tdStyle}>{property.Bedrooms || property.bedrooms || 0}</td>
                    <td style={tdStyle}>{property.Bathrooms || property.bathrooms || 0}</td>
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" style={actionBtn('#3b82f6')} onClick={() => openEditPropertyModal(property)}>Edit</button>
                        <button type="button" style={actionBtn('#6366f1')} onClick={() => openScheduleVisit(property.Address || property.address)}>Schedule</button>
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
