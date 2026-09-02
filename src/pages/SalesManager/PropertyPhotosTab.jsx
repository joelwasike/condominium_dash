import React, { useMemo, useRef, useState } from 'react';
import { Search, ImagePlus, Loader2, CheckCircle2, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { cloudinaryService } from '../../services/cloudinaryService';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '260px' };

const parsePropertyImages = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

function Dropzone({ label, hasPhoto, uploading, onFiles, size = 110, iconSize = 22 }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      style={{
        height: `${size}px`,
        borderRadius: '12px',
        border: `2px dashed ${dragOver ? '#3b82f6' : hasPhoto ? '#86efac' : '#cbd5e1'}`,
        background: dragOver ? '#eff6ff' : hasPhoto ? '#f0fdf4' : '#f8fafc',
        color: hasPhoto ? '#16a34a' : '#64748b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: uploading ? 'default' : 'pointer',
        fontSize: '0.78rem',
        fontWeight: 500,
        width: '100%',
        transition: 'all 0.15s',
      }}
    >
      {uploading ? (
        <>
          <Loader2 size={iconSize} className="spin-icon" style={{ color: '#3b82f6' }} />
          Uploading...
        </>
      ) : hasPhoto ? (
        <>
          <CheckCircle2 size={iconSize} />
          Add more photos
        </>
      ) : (
        <>
          <ImagePlus size={iconSize} style={{ color: '#94a3b8' }} />
          {label}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
      />
    </button>
  );
}

function PropertyPhotoCard({ property, onSaved, addNotification }) {
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [units, setUnits] = useState(null); // null = not fetched yet

  const id = property.id ?? property.ID;
  const label = property.address || property.Address || `Property #${id}`;
  const existingImages = parsePropertyImages(property.images ?? property.Images);
  const numberOfUnits = property.numberOfUnits ?? property.NumberOfUnits ?? 1;
  const isBuildingLike = numberOfUnits > 1 || String(property.type || property.Type || '').toLowerCase() === 'building';

  const handleBuildingFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type && f.type.startsWith('image/'));
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await cloudinaryService.uploadFile(file, 'property-images');
        if (result.success && result.url) uploadedUrls.push(result.url);
      }
      if (uploadedUrls.length === 0) {
        addNotification(`Failed to upload photo(s) for ${label}`, 'error');
        return;
      }
      const merged = [...existingImages, ...uploadedUrls];
      await salesManagerService.updateProperty(id, { images: merged });
      addNotification(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} added to ${label}`, 'success');
      onSaved();
    } catch (err) {
      console.error('Quick photo upload error:', err);
      addNotification(`Failed to save photo(s) for ${label}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const loadUnits = async () => {
    setUnitsLoading(true);
    try {
      const data = await salesManagerService.getPropertyBuildingDetail(id);
      setUnits(Array.isArray(data?.units) ? data.units : []);
    } catch (err) {
      console.error('Failed to load apartments:', err);
      addNotification(`Failed to load apartments for ${label}`, 'error');
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && units === null) loadUnits();
  };

  const handleUnitSaved = (unitId, newPictureList) => {
    setUnits((prev) => (prev || []).map((u) => (u.id === unitId ? { ...u, picture: newPictureList } : u)));
  };

  const missingUnitsCount = Array.isArray(units) ? units.filter((u) => !(Array.isArray(u.picture) && u.picture.length > 0)).length : null;

  return (
    <div style={{ ...card, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.92rem', color: '#1e293b' }}>
          {isBuildingLike && <Building2 size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
          {property.type || property.Type || 'Property'}
          {(property.rent || property.Rent) ? ` · ${Number(property.rent || property.Rent).toLocaleString()} XOF` : ''}
          {isBuildingLike ? ` · ${numberOfUnits} apartment${numberOfUnits > 1 ? 's' : ''}` : ''}
        </div>
      </div>

      <Dropzone
        label={isBuildingLike ? 'Drop building photos or click to upload' : 'Drop photos or click to upload'}
        hasPhoto={existingImages.length > 0}
        uploading={uploading}
        onFiles={handleBuildingFiles}
      />

      {isBuildingLike && (
        <>
          <button
            type="button"
            onClick={toggleExpanded}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span>
              {expanded ? 'Hide' : 'Manage'} apartment photos
              {missingUnitsCount !== null && missingUnitsCount > 0 ? ` · ${missingUnitsCount} missing` : ''}
            </span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            unitsLoading ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                <Loader2 size={18} className="spin-icon" style={{ marginBottom: '4px' }} />
                <div>Loading apartments...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {(units || []).map((unit) => (
                  <UnitPhotoDropzone
                    key={unit.id}
                    propertyId={id}
                    unit={unit}
                    onSaved={handleUnitSaved}
                    addNotification={addNotification}
                  />
                ))}
                {(units || []).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '8px' }}>
                    No apartments recorded for this building yet.
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

function UnitPhotoDropzone({ propertyId, unit, onSaved, addNotification }) {
  const [uploading, setUploading] = useState(false);
  const pictures = Array.isArray(unit.picture) ? unit.picture : [];
  const label = unit.unitNumber || 'Unit';

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type && f.type.startsWith('image/'));
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const result = await cloudinaryService.uploadFile(file, 'property-images');
        if (result.success && result.url) uploadedUrls.push(result.url);
      }
      if (uploadedUrls.length === 0) {
        addNotification(`Failed to upload photo for ${label}`, 'error');
        return;
      }
      const merged = [...pictures, ...uploadedUrls];
      await salesManagerService.updatePropertyUnit(propertyId, unit.id, { picture: JSON.stringify(merged) });
      addNotification(`Photo added to ${label}`, 'success');
      onSaved(unit.id, merged);
    } catch (err) {
      console.error('Unit photo upload error:', err);
      addNotification(`Failed to save photo for ${label}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <Dropzone
        label="Add photo"
        hasPhoto={pictures.length > 0}
        uploading={uploading}
        onFiles={handleFiles}
        size={72}
        iconSize={16}
      />
    </div>
  );
}

export default function PropertyPhotosTab({ properties, addNotification, loadData }) {
  const [search, setSearch] = useState('');

  // Only properties sourced from the Sales Manager's own Property table can be updated
  // through this screen (Agency Director-sourced entries live in a different table).
  const manageable = useMemo(() => {
    return (properties || []).filter((p) => {
      const source = p.source || p.Source;
      if (source && source !== 'Sales Manager') return false;
      const numberOfUnits = p.numberOfUnits ?? p.NumberOfUnits ?? 1;
      const isBuildingLike = numberOfUnits > 1 || String(p.type || p.Type || '').toLowerCase() === 'building';
      // Buildings always show, so their individual apartments can be managed even once the
      // building itself has a cover photo. Standalone properties only show while missing one.
      if (isBuildingLike) return true;
      const images = parsePropertyImages(p.images ?? p.Images);
      return images.length === 0;
    });
  }, [properties]);

  const filtered = useMemo(() => {
    if (!search.trim()) return manageable;
    const q = search.trim().toLowerCase();
    return manageable.filter((p) => (p.address || p.Address || '').toLowerCase().includes(q));
  }, [manageable, search]);

  const standaloneMissing = manageable.filter((p) => {
    const numberOfUnits = p.numberOfUnits ?? p.NumberOfUnits ?? 1;
    return !(numberOfUnits > 1 || String(p.type || p.Type || '').toLowerCase() === 'building');
  }).length;
  const buildingCount = manageable.length - standaloneMissing;

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Property Photos</h2>
          <p>
            {manageable.length === 0
              ? 'Every property has at least one photo.'
              : `${standaloneMissing} propert${standaloneMissing === 1 ? 'y' : 'ies'} still need a photo` +
                (buildingCount > 0 ? ` · ${buildingCount} building${buildingCount > 1 ? 's' : ''} — expand to manage individual apartments` : '')}
          </p>
        </div>
        <div className="sa-clients-header-right">
          <div style={searchBar}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {manageable.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <CheckCircle2 size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>All caught up</div>
          <div style={{ fontSize: '0.88rem' }}>Every property in your portfolio has at least one photo.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {filtered.map((property) => {
            const id = property.id ?? property.ID;
            return (
              <PropertyPhotoCard
                key={id}
                property={property}
                onSaved={loadData}
                addNotification={addNotification}
              />
            );
          })}
          {filtered.length === 0 && (
            <div style={{ ...card, gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8' }}>
              No properties match "{search}".
            </div>
          )}
        </div>
      )}

      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
