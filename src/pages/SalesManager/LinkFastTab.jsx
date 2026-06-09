import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Link2, Save } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)', border: '1px solid #f1f5f9' };
const title = { margin: 0, fontSize: '1.05rem', color: '#0f172a' };
const sub = { margin: '6px 0 0', color: '#64748b', fontSize: '0.85rem' };
const select = { width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' };
const buttonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderRadius: '999px',
  border: 'none',
  fontWeight: 800,
  cursor: 'pointer',
};
const modeBtn = (active) => ({
  ...buttonBase,
  background: active ? '#0b1a7a' : '#eef2ff',
  color: active ? '#fff' : '#0b1a7a',
  border: active ? '1px solid #0b1a7a' : '1px solid #c7d2fe',
});
const saveBtn = (disabled) => ({
  ...buttonBase,
  background: disabled ? '#94a3b8' : '#0b1a7a',
  color: '#fff',
  minWidth: '180px',
  cursor: disabled ? 'not-allowed' : 'pointer',
});
const badge = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 10px',
  borderRadius: '999px',
  background: bg,
  color,
  fontSize: '0.76rem',
  fontWeight: 700,
});

const normalizeText = (value) => (value ?? '').toString().trim();
const normalizeType = (raw) => {
  const t = normalizeText(raw).toLowerCase();
  if (!t) return '';
  if (t === 'appartment') return 'apartment';
  return t;
};
const isForRentProperty = (property) => {
  const type = normalizeType(property?.propertyType || property?.PropertyType || property?.type || property?.Type);
  return type !== 'for sale' && type !== 'sale';
};
const getPropertyKind = (property) => normalizeType(property?.type || property?.Type);
const getPropertyId = (property) => property?.id ?? property?.ID ?? property?.Id ?? null;
const getPropertyLabel = (property) => {
  const label =
    property?.address ??
    property?.Address ??
    property?.name ??
    property?.Name ??
    property?.building ??
    property?.Building ??
    property?.title ??
    property?.Title ??
    '';
  return normalizeText(label) || `Property #${getPropertyId(property) ?? ''}`.trim();
};
const getUnitLabel = (unit, index) => {
  const label = unit?.unitNumber ?? unit?.UnitNumber ?? unit?.name ?? unit?.Name ?? '';
  return normalizeText(label) || `Unit ${index + 1}`;
};
const getUnitStatus = (unit) => normalizeType(unit?.status || unit?.Status || unit?.statut);
const getUnitRent = (unit) => unit?.rent ?? unit?.Rent ?? unit?.rentPrice ?? unit?.RentPrice ?? '';
const getUnitTenantText = (unit) => {
  const tenant = unit?.tenant ?? unit?.Tenant ?? unit?.clientName ?? unit?.ClientName ?? '';
  return normalizeText(tenant);
};
const getPropertyTenantText = (property) => {
  const tenant = property?.tenant ?? property?.Tenant ?? property?.clientName ?? property?.ClientName ?? '';
  return normalizeText(tenant);
};
const getTenantIdFromProperty = (property) => property?.clientId ?? property?.clientID ?? property?.ClientID ?? property?.tenantId ?? property?.tenantID ?? null;
const isAlreadyLinkedTenant = (tenant) => {
  const property = normalizeText(tenant?.property || tenant?.Property);
  const unitNumber = normalizeText(tenant?.unitNumber || tenant?.UnitNumber);
  return Boolean(property || unitNumber);
};
const isOccupiedProperty = (property) => {
  const status = normalizeType(property?.status || property?.Status || property?.statut);
  const tenantText = getPropertyTenantText(property);
  return status === 'occupied' || status === 'active' || Boolean(tenantText);
};

const LinkFastTab = ({ clients, properties, addNotification, loadData }) => {
  const tenants = useMemo(() => (Array.isArray(clients) ? clients : []), [clients]);
  const props = useMemo(() => (Array.isArray(properties) ? properties : []), [properties]);

  const [mode, setMode] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [buildingDetailCache, setBuildingDetailCache] = useState({});

  const tenantOptions = useMemo(() => {
    return tenants
      .filter((tenant) => !isAlreadyLinkedTenant(tenant))
      .map((tenant) => {
        const id = tenant.id ?? tenant.ID;
        if (id == null) return null;
        return {
          id: String(id),
          label: tenant.Name || tenant.name || tenant.Email || tenant.email || `Tenant #${id}`,
          search: `${tenant.Name || tenant.name || ''} ${tenant.Email || tenant.email || ''} ${tenant.Phone || tenant.phone || ''}`.toLowerCase(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tenants]);

  const buildingOptions = useMemo(() => {
    return props
      .filter((property) => getPropertyKind(property) === 'building' && isForRentProperty(property))
      .map((property) => ({
        id: String(getPropertyId(property)),
        label: getPropertyLabel(property),
      }))
      .filter((item) => item.id !== 'null' && item.id !== 'undefined')
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [props]);

  const propertyOptionsByMode = useMemo(() => {
    const map = new Map();
    for (const property of props) {
      if (!isForRentProperty(property)) continue;
      if (isOccupiedProperty(property)) continue;
      const kind = getPropertyKind(property);
      if (!kind) continue;
      if (kind === 'building') continue;
      if (!map.has(kind)) map.set(kind, []);
      map.get(kind).push(property);
    }
    for (const [kind, list] of map.entries()) {
      list.sort((a, b) => getPropertyLabel(a).localeCompare(getPropertyLabel(b)));
      map.set(kind, list);
    }
    return map;
  }, [props]);

  const findTenantIdFromText = (text) => {
    const needle = normalizeText(text).toLowerCase();
    if (!needle) return '';
    const exactMatch = tenantOptions.find((tenant) => tenant.search.includes(needle) || tenant.label.toLowerCase() === needle);
    return exactMatch?.id || '';
  };

  const buildRowFromUnit = (unit, property, propertyId, index = 0) => {
    const tenantText = getUnitTenantText(unit) || getPropertyTenantText(property);
    const existingTenantId = getTenantIdFromProperty(unit) || findTenantIdFromText(tenantText);
    const rentValue = getUnitRent(unit) || property?.rent || property?.Rent || property?.rentPrice || property?.RentPrice || '';
    const status = getUnitStatus(unit);
    return {
      id: `${propertyId}-${unit?.id ?? unit?.ID ?? index}`,
      propertyId: String(propertyId),
      unitId: unit?.id ?? unit?.ID ?? null,
      label: `${getPropertyLabel(property)} · ${getUnitLabel(unit, index)}`,
      rent: rentValue,
      currentTenant: tenantText,
      tenantId: existingTenantId ? String(existingTenantId) : '',
      status,
    };
  };

  const buildRowFromProperty = (property, index = 0) => {
    const propertyId = getPropertyId(property);
    const tenantText = getPropertyTenantText(property);
    const existingTenantId = getTenantIdFromProperty(property) || findTenantIdFromText(tenantText);
    return {
      id: `${propertyId}-${index}`,
      propertyId: String(propertyId),
      unitId: null,
      label: getPropertyLabel(property),
      rent: property?.rent ?? property?.Rent ?? property?.rentPrice ?? property?.RentPrice ?? '',
      currentTenant: tenantText,
      tenantId: existingTenantId ? String(existingTenantId) : '',
      status: normalizeType(property?.status || property?.Status || property?.statut) || 'vacant',
    };
  };

  const loadBuildingRows = async (buildingId) => {
    if (!buildingId) {
      setRows([]);
      return;
    }

    setLoadingRows(true);
    try {
      let detail = buildingDetailCache[buildingId];
      if (!detail) {
        detail = await salesManagerService.getPropertyBuildingDetail(buildingId);
        setBuildingDetailCache((prev) => ({ ...prev, [buildingId]: detail }));
      }

      const property = props.find((item) => String(getPropertyId(item)) === String(buildingId));
      const units = Array.isArray(detail?.units) ? detail.units : [];
      const nextRows = units
        .filter((unit) => {
          const status = getUnitStatus(unit);
          const tenantText = getUnitTenantText(unit) || getPropertyTenantText(property);
          return status !== 'occupied' && status !== 'active' && !tenantText;
        })
        .map((unit, index) => buildRowFromUnit(unit, property || {}, buildingId, index));
      setRows(nextRows);
    } catch (error) {
      console.error('Failed to load building units:', error);
      setRows([]);
      addNotification(error?.message || 'Failed to load building apartments', 'error');
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    if (mode === 'building') {
      if (!selectedBuildingId) {
        setRows([]);
        return;
      }
      loadBuildingRows(selectedBuildingId);
      return;
    }

    if (mode === 'apartment' || mode === 'villa') {
      const modeProperties = propertyOptionsByMode.get(mode) || [];
      const nextRows = [];
      modeProperties.forEach((property, index) => {
        const propertyUnits = Array.isArray(property?.units) ? property.units : [];
        if (propertyUnits.length > 0) {
          propertyUnits
            .filter((unit) => {
              const status = getUnitStatus(unit);
              const tenantText = getUnitTenantText(unit) || getPropertyTenantText(property);
              return status !== 'occupied' && status !== 'active' && !tenantText;
            })
            .forEach((unit, unitIndex) => {
              nextRows.push(buildRowFromUnit(unit, property, getPropertyId(property), `${index}-${unitIndex}`));
            });
        } else {
          if (!isOccupiedProperty(property)) {
            nextRows.push(buildRowFromProperty(property, index));
          }
        }
      });
      setRows(nextRows);
      return;
    }

    setRows([]);
  }, [mode, selectedBuildingId, propertyOptionsByMode, buildingDetailCache]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const canSave = rows.some((row) => row.tenantId) && !saving && !loadingRows;

  const saveAll = async () => {
    const rowsToSave = rows.filter((row) => row.tenantId);
    if (rowsToSave.length === 0) {
      addNotification('Select at least one tenant before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      let failedCount = 0;

      for (const row of rowsToSave) {
        try {
          await salesManagerService.linkFastAssociate({
            clientId: Number(row.tenantId),
            propertyId: Number(row.propertyId),
            unitId: row.unitId ? Number(row.unitId) : null,
            forceMove: true,
          });
          updateRow(row.id, { status: 'linked', error: '' });
          successCount += 1;
        } catch (error) {
          updateRow(row.id, { status: 'error', error: error?.message || 'Link failed' });
          failedCount += 1;
        }
      }

      await loadData();
      if (successCount > 0) {
        addNotification(`Link Fast saved: ${successCount} succeeded${failedCount > 0 ? `, ${failedCount} failed` : ''}.`, 'success');
      } else {
        addNotification('No links were saved.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const modeLabel = mode ? mode.charAt(0).toUpperCase() + mode.slice(1) : 'Select a type';

  return (
    <div style={card}>
      <div>
        <h3 style={title}>Link Fast</h3>
        <p style={sub}>
          Pick a property group, select the apartments or units that should be managed, then choose the tenant for each row and save.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
        <button type="button" style={modeBtn(mode === 'building')} onClick={() => { setMode('building'); setSelectedBuildingId(buildingOptions[0]?.id || ''); }}>
          Building
        </button>
        <button type="button" style={modeBtn(mode === 'apartment')} onClick={() => { setMode('apartment'); setSelectedBuildingId(''); }}>
          Apartments
        </button>
        <button type="button" style={modeBtn(mode === 'villa')} onClick={() => { setMode('villa'); setSelectedBuildingId(''); }}>
          Villa
        </button>
      </div>

      <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {mode === 'building' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
            <select
              style={select}
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              <option value="">{buildingOptions.length > 0 ? 'Select a building' : 'No building found'}</option>
              {buildingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div style={badge('#eff6ff', '#1d4ed8')}>Units auto-list below</div>
          </div>
        )}

        {mode && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: '#0f172a' }}>{modeLabel}</strong>
              <div style={{ ...sub, margin: '4px 0 0' }}>
                {mode === 'building' && !selectedBuildingId
                  ? 'Choose a building to load its apartments.'
                  : rows.length > 0
                    ? `${rows.length} item(s) ready for assignment.`
                    : loadingRows
                      ? 'Loading rows...'
                      : 'No rent-managed properties found for this selection.'}
              </div>
            </div>
            <div style={badge('#f8fafc', '#334155')}>
              <Link2 size={14} />
              Rent only
            </div>
          </div>
        )}

        {mode && rows.length > 0 && (
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Property / Unit</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Rent</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Current tenant</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Select tenant</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ color: '#0f172a' }}>{row.label}</strong>
                        <span style={{ color: '#64748b', fontSize: '0.84rem' }}>
                          Property #{row.propertyId}
                          {row.unitId ? ` · Unit #${row.unitId}` : ''}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: '#334155' }}>
                      {row.rent ? `${Number(row.rent).toLocaleString()} XOF` : '—'}
                    </td>
                    <td style={{ padding: '14px', color: '#334155' }}>
                      {row.currentTenant || '—'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <select
                        style={select}
                        value={row.tenantId}
                        onChange={(e) => updateRow(row.id, { tenantId: e.target.value })}
                      >
                        <option value="">Select tenant</option>
                        {tenantOptions.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '14px' }}>
                      {row.status === 'occupied' ? (
                        <span style={badge('#dcfce7', '#166534')}>Occupied</span>
                      ) : row.status === 'vacant' ? (
                        <span style={badge('#fef3c7', '#92400e')}>Vacant</span>
                      ) : (
                        <span style={badge('#f1f5f9', '#475569')}>{row.status || 'Pending'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!mode && (
          <div style={{ padding: '22px', borderRadius: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#475569' }}>
            Select <strong>Building</strong>, <strong>Apartments</strong>, or <strong>Villa</strong> to auto-list the rent-managed units and assign tenants.
          </div>
        )}

        {mode && !loadingRows && rows.length === 0 && (
          <div style={{ padding: '22px', borderRadius: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#475569' }}>
            No eligible rent-managed units found for this selection.
          </div>
        )}

        {mode && rows.some((row) => row.error) && (
          <div style={{ padding: '14px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
            Some rows failed to link. Review the row-level errors after saving.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
          <button type="button" style={saveBtn(!canSave)} onClick={saveAll} disabled={!canSave}>
            <Save size={18} />
            {saving ? 'Saving…' : 'Save all assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkFastTab;
