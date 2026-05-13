import React, { useMemo, useState } from 'react';
import { ChevronRight, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)', border: '1px solid #f1f5f9' };
const title = { margin: 0, fontSize: '1.05rem', color: '#0f172a' };
const sub = { margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' };
const select = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #0f172a', fontSize: '0.95rem', background: '#fff' };
const rowWrap = (withUnit) => ({
  display: 'grid',
  gridTemplateColumns: withUnit ? '1fr 40px 1fr 40px 1fr 40px 1fr 120px' : '1fr 40px 1fr 40px 1fr 120px',
  gap: '14px',
  alignItems: 'center',
});
const linkBtn = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  justifyContent: 'center',
  padding: '12px 14px',
  borderRadius: '999px',
  border: 'none',
  background: disabled ? '#94a3b8' : '#0b1a7a',
  color: '#fff',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
});
const saveBtn = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  padding: '14px 22px',
  borderRadius: '999px',
  border: 'none',
  background: disabled ? '#94a3b8' : '#0b1a7a',
  color: '#fff',
  fontWeight: 800,
  cursor: disabled ? 'not-allowed' : 'pointer',
  minWidth: '160px',
});
const mini = { fontSize: '0.78rem', color: '#64748b', marginTop: '6px' };

const normalizeType = (raw) => {
  const t = (raw || '').toString().trim().toLowerCase();
  if (!t) return '';
  if (t === 'appartment') return 'apartment';
  return t;
};

const labelType = (t) => {
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const LinkFastTab = ({ clients, properties, addNotification, loadData }) => {
  const tenants = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const props = useMemo(() => (Array.isArray(properties) ? properties : []), [properties]);

  const [rows, setRows] = useState(() => ([
    { id: `${Date.now()}-0`, propertyType: '', propertyId: '', unitId: '', clientId: '', status: 'idle', error: '' },
  ]));
  const [saving, setSaving] = useState(false);
  const [unitsByPropertyId, setUnitsByPropertyId] = useState(() => ({}));
  const [unitsLoadingByPropertyId, setUnitsLoadingByPropertyId] = useState(() => ({}));

  const addRow = () => {
    setRows((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, propertyType: '', propertyId: '', unitId: '', clientId: '', status: 'idle', error: '' }]);
  };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id, patch) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  const propertyTypes = useMemo(() => {
    const set = new Set();
    for (const p of props) {
      const t = normalizeType(p.type ?? p.Type);
      if (t) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [props]);

  const propertiesByType = useMemo(() => {
    const m = new Map();
    for (const p of props) {
      const t = normalizeType(p.type ?? p.Type);
      if (!t) continue;
      if (!m.has(t)) m.set(t, []);
      m.get(t).push(p);
    }
    for (const [t, list] of m.entries()) {
      list.sort((a, b) => {
        const aa = (a.address ?? a.Address ?? a.name ?? a.Name ?? '').toString();
        const bb = (b.address ?? b.Address ?? b.name ?? b.Name ?? '').toString();
        return aa.localeCompare(bb);
      });
    }
    return m;
  }, [props]);

  const loadUnitsForBuilding = async (propertyId) => {
    if (!propertyId) return;
    if (unitsByPropertyId[propertyId]) return;
    if (unitsLoadingByPropertyId[propertyId]) return;
    setUnitsLoadingByPropertyId((prev) => ({ ...prev, [propertyId]: true }));
    try {
      const detail = await salesManagerService.getPropertyBuildingDetail(propertyId);
      const raw = Array.isArray(detail?.units) ? detail.units : [];
      const available = raw
        .filter((u) => {
          const st = (u.status || u.Status || u.statut || '').toString().toLowerCase();
          const tenantVal = (u.tenant || u.Tenant || '').toString().trim();
          return st !== 'occupied' && tenantVal === '';
        })
        .map((u) => ({
          id: u.id ?? u.ID,
          label: u.unitNumber ?? u.UnitNumber ?? u.name ?? u.Name ?? `Unit ${(u.id ?? u.ID) ?? ''}`,
        }))
        .filter((u) => u.id != null);

      setUnitsByPropertyId((prev) => ({ ...prev, [propertyId]: available }));
    } catch (e) {
      setUnitsByPropertyId((prev) => ({ ...prev, [propertyId]: [] }));
    } finally {
      setUnitsLoadingByPropertyId((prev) => ({ ...prev, [propertyId]: false }));
    }
  };

  const queueLink = async (rowId) => {
    const r = rows.find((x) => x.id === rowId);
    if (!r) return;
    if (!r.propertyType) {
      addNotification('Select property type.', 'error');
      return;
    }
    if (!r.propertyId) {
      addNotification('Select property.', 'error');
      return;
    }
    if (normalizeType(r.propertyType) === 'building' && !r.unitId) {
      addNotification('Select apartment unit.', 'error');
      return;
    }
    if (!r.clientId) {
      addNotification('Select tenant.', 'error');
      return;
    }
    updateRow(rowId, { status: 'queued', error: '' });
    // Auto-add a new row for faster batch work
    setTimeout(() => addRow(), 0);
  };

  const queuedRows = useMemo(() => rows.filter((r) => r.status === 'queued'), [rows]);
  const canSave = queuedRows.length > 0 && !saving;

  const saveAll = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      for (const r of queuedRows) {
        updateRow(r.id, { status: 'saving', error: '' });
        try {
          await salesManagerService.linkFastAssociate({
            clientId: Number(r.clientId),
            propertyId: Number(r.propertyId),
            unitId: r.unitId ? Number(r.unitId) : null,
            forceMove: true,
          });
          updateRow(r.id, { status: 'linked', error: '' });
        } catch (e) {
          updateRow(r.id, { status: 'error', error: e?.message || 'Link failed' });
        }
      }
      await loadData();
      addNotification('Link Fast: saved.', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={card}>
      <div>
        <h3 style={title}>Link Fast</h3>
        <p style={sub}>Choose property type → property (and unit for buildings) → tenant. Click Link to queue, then Save once.</p>
      </div>

      <div style={{ display: 'flex', gap: '26px', alignItems: 'flex-start', marginTop: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {rows.map((r, idx) => (
            <div key={r.id}>
              {(() => {
                const isBuilding = normalizeType(r.propertyType) === 'building';
                const rowDisabled = r.status === 'saving' || r.status === 'linked';
                const typeProps = r.propertyType ? (propertiesByType.get(normalizeType(r.propertyType)) || []) : [];
                const unitOptions = isBuilding && r.propertyId ? (unitsByPropertyId[r.propertyId] || []) : [];
                const unitsLoading = isBuilding && r.propertyId ? !!unitsLoadingByPropertyId[r.propertyId] : false;
                const canLink = r.propertyType && r.propertyId && r.clientId && (!isBuilding || r.unitId);
                const linkDisabled = !canLink || r.status === 'queued' || r.status === 'linked' || r.status === 'saving' || (isBuilding && r.propertyId && unitsLoading);

                return (
                  <div style={rowWrap(isBuilding)}>
                    <select
                      style={select}
                      value={r.propertyType}
                      onChange={(e) => {
                        const t = e.target.value;
                        updateRow(r.id, { propertyType: t, propertyId: '', unitId: '', clientId: '', error: '' });
                      }}
                      disabled={rowDisabled}
                    >
                      <option value="">{'Property type'}</option>
                      {propertyTypes.map((t) => (
                        <option key={t} value={t}>{labelType(t)}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ChevronRight size={22} color="#0f172a" />
                    </div>

                    <select
                      style={select}
                      value={r.propertyId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        updateRow(r.id, { propertyId: pid, unitId: '', error: '' });
                        if (isBuilding && pid) loadUnitsForBuilding(pid);
                      }}
                      disabled={rowDisabled || !r.propertyType}
                    >
                      <option value="">{r.propertyType ? labelType(normalizeType(r.propertyType)) : 'Property'}</option>
                      {typeProps.map((p) => {
                        const id = p.id ?? p.ID;
                        const addr = p.address ?? p.Address ?? p.name ?? p.Name ?? `Property #${id}`;
                        return <option key={id} value={String(id)}>{addr}</option>;
                      })}
                    </select>

                    {isBuilding && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <ChevronRight size={22} color="#0f172a" />
                        </div>
                        <select
                          style={select}
                          value={r.unitId}
                          onChange={(e) => updateRow(r.id, { unitId: e.target.value, error: '' })}
                          disabled={rowDisabled || !r.propertyId || unitsLoading}
                        >
                          <option value="">{unitsLoading ? 'Loading units…' : 'Apartment unit'}</option>
                          {unitOptions.map((u) => (
                            <option key={u.id} value={String(u.id)}>{u.label}</option>
                          ))}
                        </select>
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <ChevronRight size={22} color="#0f172a" />
                    </div>

                    <select
                      style={select}
                      value={r.clientId}
                      onChange={(e) => updateRow(r.id, { clientId: e.target.value, error: '' })}
                      disabled={rowDisabled}
                    >
                      <option value="">{'Tenant'}</option>
                      {tenants.map((t) => {
                        const id = t.id ?? t.ID;
                        const name = t.Name || t.name || t.Email || t.email || `Tenant #${id}`;
                        return <option key={id} value={String(id)}>{name}</option>;
                      })}
                    </select>

                    <button
                      type="button"
                      style={linkBtn(linkDisabled)}
                      onClick={() => queueLink(r.id)}
                      disabled={linkDisabled}
                    >
                      <Link2 size={18} />
                      {r.status === 'queued' ? 'Queued' : r.status === 'linked' ? 'Linked' : r.status === 'saving' ? 'Saving…' : 'Link'}
                    </button>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={mini}>
                  {r.error ? `${r.error}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {idx === rows.length - 1 && (
                    <button type="button" onClick={addRow} style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Plus size={16} /> Add row
                    </button>
                  )}
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(r.id)} style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: '0 0 220px', display: 'flex', justifyContent: 'center', paddingTop: '30px' }}>
          <button type="button" style={saveBtn(!canSave)} onClick={saveAll} disabled={!canSave}>
            <Save size={18} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkFastTab;
