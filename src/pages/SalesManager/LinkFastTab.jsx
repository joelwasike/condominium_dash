import React, { useEffect, useMemo, useState } from 'react';
import { Search, Link2 } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const title = { margin: 0, fontSize: '1rem', color: '#0f172a' };
const sub = { margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' };
const input = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' };
const list = { marginTop: '12px', maxHeight: '520px', overflow: 'auto', border: '1px solid #f1f5f9', borderRadius: '12px' };
const row = (active) => ({
  padding: '10px 12px',
  borderBottom: '1px solid #f1f5f9',
  cursor: 'pointer',
  background: active ? '#eff6ff' : '#fff',
});
const btn = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '12px',
  border: 'none',
  background: disabled ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
  color: '#fff',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const LinkFastTab = ({ clients, properties, addNotification, loadData }) => {
  const [tenantSearch, setTenantSearch] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showUnlinkedOnly, setShowUnlinkedOnly] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [units, setUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [linking, setLinking] = useState(false);

  const clientsFiltered = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    const base = Array.isArray(clients) ? clients : [];
    const filtered = base.filter((c) => {
      const name = (c.Name || c.name || '').toString().toLowerCase();
      const email = (c.Email || c.email || '').toString().toLowerCase();
      const phone = (c.Phone || c.phone || '').toString().toLowerCase();
      const property = (c.Property || c.property || '').toString().toLowerCase();
      const unit = (c.UnitNumber || c.unitNumber || '').toString().toLowerCase();
      const linked = Boolean(property) && Boolean(unit);
      if (showUnlinkedOnly && linked) return false;
      if (!q) return true;
      return name.includes(q) || email.includes(q) || phone.includes(q) || property.includes(q) || unit.includes(q);
    });
    return filtered;
  }, [clients, tenantSearch, showUnlinkedOnly]);

  const propertiesFiltered = useMemo(() => {
    const q = propertySearch.trim().toLowerCase();
    const base = Array.isArray(properties) ? properties : [];
    return base.filter((p) => {
      const addr = (p.address ?? p.Address ?? '').toString().toLowerCase();
      const type = (p.type ?? p.Type ?? '').toString().toLowerCase();
      if (!q) return true;
      return addr.includes(q) || type.includes(q);
    });
  }, [properties, propertySearch]);

  useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      setSelectedUnitId(null);
      return;
    }
    let cancelled = false;
    setUnitsLoading(true);
    setUnits([]);
    setSelectedUnitId(null);
    (async () => {
      try {
        const detail = await salesManagerService.getPropertyBuildingDetail(selectedPropertyId);
        const raw = Array.isArray(detail?.units) ? detail.units : [];
        const available = raw.filter((u) => {
          const st = (u.status || u.Status || '').toString().toLowerCase();
          const tenant = (u.tenant || u.Tenant || '').toString().trim();
          return st !== 'occupied' && tenant === '';
        });
        if (!cancelled) setUnits(available);
      } catch (e) {
        if (!cancelled) {
          setUnits([]);
          addNotification('Failed to load units for that property.', 'error');
        }
      } finally {
        if (!cancelled) setUnitsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPropertyId, addNotification]);

  const doLink = async () => {
    if (!selectedClientId || !selectedPropertyId) return;
    // Units are optional only when property has no units; in our system most rentable units exist, so enforce selection when we loaded units.
    if (unitsLoading) return;
    if (units.length > 0 && !selectedUnitId) {
      addNotification('Select a vacant unit to link this tenant.', 'error');
      return;
    }
    setLinking(true);
    try {
      await salesManagerService.linkFastAssociate({
        clientId: selectedClientId,
        propertyId: selectedPropertyId,
        unitId: selectedUnitId || null,
        forceMove: true,
      });
      addNotification('Linked successfully.', 'success');
      setSelectedClientId(null);
      setSelectedUnitId(null);
      // Keep property selected to continue linking many tenants to same building
      await loadData();
    } catch (e) {
      addNotification(e?.message || 'Failed to link', 'error');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
      <div style={card}>
        <h3 style={title}>Imported tenants</h3>
        <p style={sub}>Select a tenant to link. Toggle “Unlinked only” to focus on those missing property/unit.</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
            <input style={{ ...input, paddingLeft: 34 }} value={tenantSearch} onChange={(e) => setTenantSearch(e.target.value)} placeholder="Search tenant…" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={showUnlinkedOnly} onChange={(e) => setShowUnlinkedOnly(e.target.checked)} />
            Unlinked only
          </label>
        </div>
        <div style={list}>
          {clientsFiltered.length === 0 ? (
            <div style={{ padding: '14px', color: '#64748b' }}>No tenants found.</div>
          ) : (
            clientsFiltered.map((c) => {
              const id = c.id ?? c.ID;
              const active = String(id) === String(selectedClientId);
              const name = c.Name || c.name || '—';
              const property = c.Property || c.property || '';
              const unit = c.UnitNumber || c.unitNumber || '';
              return (
                <div key={id} style={row(active)} onClick={() => setSelectedClientId(id)}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.82rem' }}>
                    {(c.Email || c.email || '').toString()} {property ? ` · ${property}` : ''}{unit ? ` · ${unit}` : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={card}>
        <h3 style={title}>Available properties / units</h3>
        <p style={sub}>Select a property, then choose a vacant unit (if applicable).</p>
        <div style={{ position: 'relative', marginTop: '12px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
          <input style={{ ...input, paddingLeft: 34 }} value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} placeholder="Search property…" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' }}>
          <select
            style={input}
            value={selectedPropertyId ?? ''}
            onChange={(e) => setSelectedPropertyId(e.target.value || null)}
          >
            <option value="">— Select property —</option>
            {propertiesFiltered.map((p) => {
              const id = p.id ?? p.ID;
              const addr = p.address ?? p.Address ?? '';
              const type = p.type ?? p.Type ?? '';
              return (
                <option key={id} value={id}>
                  {addr} {type ? `(${type})` : ''}
                </option>
              );
            })}
          </select>

          <select
            style={input}
            value={selectedUnitId ?? ''}
            onChange={(e) => setSelectedUnitId(e.target.value || null)}
            disabled={!selectedPropertyId || unitsLoading || units.length === 0}
          >
            <option value="">
              {!selectedPropertyId ? 'Select a property first' : unitsLoading ? 'Loading units…' : units.length === 0 ? 'No units (or none vacant)' : '— Select vacant unit —'}
            </option>
            {units.map((u) => {
              const uid = u.id ?? u.ID;
              const label = u.unitNumber ?? u.UnitNumber ?? u.name ?? `Unit ${uid}`;
              return (
                <option key={uid} value={uid}>
                  {label}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={doLink}
            disabled={!selectedClientId || !selectedPropertyId || linking || (units.length > 0 && !selectedUnitId)}
            style={btn(!selectedClientId || !selectedPropertyId || linking || (units.length > 0 && !selectedUnitId))}
          >
            <Link2 size={18} />
            {linking ? 'Linking…' : 'Associate / Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkFastTab;

