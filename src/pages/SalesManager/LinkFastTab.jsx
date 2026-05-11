import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)', border: '1px solid #f1f5f9' };
const title = { margin: 0, fontSize: '1.05rem', color: '#0f172a' };
const sub = { margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' };
const select = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #0f172a', fontSize: '0.95rem', background: '#fff' };
const rowWrap = { display: 'grid', gridTemplateColumns: '1fr 40px 1fr 120px', gap: '14px', alignItems: 'center' };
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

const LinkFastTab = ({ clients, properties, addNotification, loadData }) => {
  const tenants = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const props = useMemo(() => (Array.isArray(properties) ? properties : []), [properties]);

  const [rows, setRows] = useState(() => ([
    { id: `${Date.now()}-0`, clientId: '', propertyId: '', unitId: null, unitLabel: '', status: 'idle', error: '' },
  ]));
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, clientId: '', propertyId: '', unitId: null, unitLabel: '', status: 'idle', error: '' }]);
  };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id, patch) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));

  const loadFirstVacantUnit = async (rowId, propertyId) => {
    if (!propertyId) {
      updateRow(rowId, { unitId: null, unitLabel: '' });
      return;
    }
    updateRow(rowId, { status: 'loading', error: '' });
    try {
      const detail = await salesManagerService.getPropertyBuildingDetail(propertyId);
      const raw = Array.isArray(detail?.units) ? detail.units : [];
      const available = raw.filter((u) => {
        const st = (u.status || u.Status || '').toString().toLowerCase();
        const tenantVal = (u.tenant || u.Tenant || '').toString().trim();
        return st !== 'occupied' && tenantVal === '';
      });
      if (available.length === 0) {
        updateRow(rowId, { unitId: null, unitLabel: '', status: 'idle', error: 'No vacant unit found (you can still save: tenant will be linked to property only).' });
        return;
      }
      const u = available[0];
      const unitId = u.id ?? u.ID;
      const label = u.unitNumber ?? u.UnitNumber ?? u.name ?? `Unit ${unitId}`;
      updateRow(rowId, { unitId, unitLabel: label, status: 'idle', error: '' });
    } catch (e) {
      updateRow(rowId, { unitId: null, unitLabel: '', status: 'idle', error: 'Failed to load units for this property.' });
    }
  };

  const queueLink = async (rowId) => {
    const r = rows.find((x) => x.id === rowId);
    if (!r) return;
    if (!r.clientId || !r.propertyId) {
      addNotification('Select both tenant and property.', 'error');
      return;
    }
    // Ensure we attempted to resolve a vacant unit (best-effort) before queuing
    if (r.unitId === undefined) {
      await loadFirstVacantUnit(rowId, r.propertyId);
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
        <p style={sub}>Select a tenant and property, click Link to queue, then Save once.</p>
      </div>

      <div style={{ display: 'flex', gap: '26px', alignItems: 'flex-start', marginTop: '18px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {rows.map((r, idx) => (
            <div key={r.id}>
              <div style={rowWrap}>
                <select
                  style={select}
                  value={r.clientId}
                  onChange={(e) => updateRow(r.id, { clientId: e.target.value, error: '' })}
                  disabled={r.status === 'saving' || r.status === 'linked'}
                >
                  <option value="">{'Tenant'}</option>
                  {tenants.map((t) => {
                    const id = t.id ?? t.ID;
                    const name = t.Name || t.name || t.Email || t.email || `Tenant #${id}`;
                    return <option key={id} value={String(id)}>{name}</option>;
                  })}
                </select>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ChevronRight size={22} color="#0f172a" />
                </div>

                <select
                  style={select}
                  value={r.propertyId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    updateRow(r.id, { propertyId: pid, unitId: null, unitLabel: '', error: '' });
                    if (pid) loadFirstVacantUnit(r.id, pid);
                  }}
                  disabled={r.status === 'saving' || r.status === 'linked'}
                >
                  <option value="">{'property'}</option>
                  {props.map((p) => {
                    const id = p.id ?? p.ID;
                    const addr = p.address ?? p.Address ?? `Property #${id}`;
                    return <option key={id} value={String(id)}>{addr}</option>;
                  })}
                </select>

                <button
                  type="button"
                  style={linkBtn(!(r.clientId && r.propertyId) || r.status === 'queued' || r.status === 'linked' || r.status === 'saving' || r.status === 'loading')}
                  onClick={() => queueLink(r.id)}
                  disabled={!(r.clientId && r.propertyId) || r.status === 'queued' || r.status === 'linked' || r.status === 'saving' || r.status === 'loading'}
                >
                  <Link2 size={18} />
                  {r.status === 'queued' ? 'Queued' : r.status === 'linked' ? 'Linked' : r.status === 'saving' ? 'Saving…' : 'Link'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={mini}>
                  {r.unitLabel ? `Vacant unit auto-selected: ${r.unitLabel}` : ''}
                  {r.error ? ` ${r.error}` : ''}
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
