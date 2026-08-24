import React, { useMemo, useRef, useState } from 'react';
import { Search, ImagePlus, Loader2, CheckCircle2 } from 'lucide-react';
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

function PhotoDropzone({ property, onSaved, addNotification }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const id = property.id ?? property.ID;
  const label = property.address || property.Address || `Property #${id}`;

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
        addNotification(`Failed to upload photo${files.length > 1 ? 's' : ''} for ${label}`, 'error');
        return;
      }
      await salesManagerService.updateProperty(id, { images: uploadedUrls });
      addNotification(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} added to ${label}`, 'success');
      onSaved(id);
    } catch (err) {
      console.error('Quick photo upload error:', err);
      addNotification(`Failed to save photo(s) for ${label}`, 'error');
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <div
      style={{
        ...card,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderColor: dragOver ? '#3b82f6' : '#f1f5f9',
        background: dragOver ? '#eff6ff' : '#fff',
        transition: 'all 0.15s',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
          {property.type || property.Type || 'Property'}
          {(property.rent || property.Rent) ? ` · ${Number(property.rent || property.Rent).toLocaleString()} XOF` : ''}
        </div>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          height: '110px',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1',
          background: '#f8fafc',
          color: '#64748b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: uploading ? 'default' : 'pointer',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        {uploading ? (
          <>
            <Loader2 size={22} className="spin-icon" style={{ color: '#3b82f6' }} />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus size={22} style={{ color: '#94a3b8' }} />
            Drop photos or click to upload
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </div>
  );
}

export default function PropertyPhotosTab({ properties, addNotification, loadData }) {
  const [search, setSearch] = useState('');

  // Only properties sourced from the Sales Manager's own Property table can be updated
  // through this screen (Agency Director-sourced entries live in a different table).
  const missingPhotos = useMemo(() => {
    return (properties || []).filter((p) => {
      const source = p.source || p.Source;
      if (source && source !== 'Sales Manager') return false;
      const images = parsePropertyImages(p.images ?? p.Images);
      return images.length === 0;
    });
  }, [properties]);

  const filtered = useMemo(() => {
    if (!search.trim()) return missingPhotos;
    const q = search.trim().toLowerCase();
    return missingPhotos.filter((p) => (p.address || p.Address || '').toLowerCase().includes(q));
  }, [missingPhotos, search]);

  const totalCount = properties?.length || 0;
  const withPhotosCount = totalCount - missingPhotos.length;

  const handleSaved = () => {
    // Refresh from the server so this property drops off the list once its new
    // images are reflected in the shared `properties` state.
    loadData();
  };

  return (
    <div className="sa-clients-page">
      <div className="sa-clients-header">
        <div>
          <h2>Property Photos</h2>
          <p>
            {missingPhotos.length === 0
              ? 'Every property has at least one photo.'
              : `${missingPhotos.length} of ${totalCount} properties still need photos · ${withPhotosCount} already have some`}
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

      {missingPhotos.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
          <CheckCircle2 size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>All caught up</div>
          <div style={{ fontSize: '0.88rem' }}>Every property in your portfolio has at least one photo.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {filtered.map((property) => {
            const id = property.id ?? property.ID;
            return (
              <PhotoDropzone
                key={id}
                property={property}
                onSaved={handleSaved}
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
