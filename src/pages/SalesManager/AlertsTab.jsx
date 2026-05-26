import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };
const btnPrimary = { padding: '8px 14px', borderRadius: '12px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const btnOutline = { padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' };
const pill = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', borderRadius: '999px', border: '2px solid #86efac', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', background: '#f0fdf4', cursor: 'pointer' };

const AlertsTab = () => {
  const [view, setView] = useState('list'); // list | detail | bulk-select | bulk-unpaid | bulk-all
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [compose, setCompose] = useState(null); // { tenant, channel }
  const [bulkChannel, setBulkChannel] = useState('sms');
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkTenants, setBulkTenants] = useState([]);
  const [bulkTenantsLoading, setBulkTenantsLoading] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkUnpaidGroups, setBulkUnpaidGroups] = useState([]);
  const [bulkUnpaidLoading, setBulkUnpaidLoading] = useState(false);
  const [bulkAllGroups, setBulkAllGroups] = useState([]);
  const [bulkAllLoading, setBulkAllLoading] = useState(false);

  const [message, setMessage] = useState('Hello,\nThis is a reminder from Saaf Immo.\nPlease take note of this message and contact the agency if needed.');
  const [subject, setSubject] = useState('Alert');
  const [sendingId, setSendingId] = useState(null);
  const [sendError, setSendError] = useState('');

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await salesManagerService.getAlertProperties();
      setProperties(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load properties:', e);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const openProperty = async (p) => {
    setSelectedProperty(p);
    setView('detail');
    setSendError('');
    setCompose(null);
    setTenants([]);
    try {
      setTenantsLoading(true);
      const res = await salesManagerService.getAlertPropertyTenants(p.id || p.ID);
      setTenants(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Failed to load tenants:', e);
      setTenants([]);
    } finally {
      setTenantsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const sortedTenants = useMemo(() => {
    const list = Array.isArray(tenants) ? tenants : [];
    return [...list].sort((a, b) => String(a.unitNumber || '').localeCompare(String(b.unitNumber || '')));
  }, [tenants]);

  const sendAlert = async ({ clientId, channel }) => {
    if (!message.trim()) {
      setSendError('Message is required.');
      return;
    }
    setSendError('');
    try {
      setSendingId(clientId);
      await salesManagerService.sendTenantAlert({
        clientId,
        channel,
        message,
        subject: channel === 'email' ? (subject || 'Alert') : undefined,
        urgency: 'Low',
      });
      await loadProperties();
      if (selectedProperty?.id || selectedProperty?.ID) {
        const res = await salesManagerService.getAlertPropertyTenants(selectedProperty.id || selectedProperty.ID);
        setTenants(Array.isArray(res) ? res : []);
      }
      setCompose(null);
    } catch (e) {
      console.error(e);
      setSendError(e?.message || 'Failed to send alert.');
    } finally {
      setSendingId(null);
    }
  };

  if (view === 'detail') {
    const title = selectedProperty?.address || selectedProperty?.Address || 'Property';
    return (
      <div>
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button type="button" style={btnOutline} onClick={() => { setView('list'); setSelectedProperty(null); setTenants([]); }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>{title}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Tenants with unpaid or incomplete rent</p>
          </div>
        </div>

        <div style={card}>
          {compose ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px', alignItems: 'start', marginBottom: '18px' }}>
              <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, color: '#111827' }}>
                    Send via {compose.channel === 'email' ? 'Email' : 'SMS'} to {compose.tenant?.name || compose.tenant?.Name || 'Tenant'}
                  </div>
                  <button type="button" style={btnOutline} onClick={() => { setCompose(null); setSendError(''); }} disabled={sendingId != null}>
                    Cancel
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', minHeight: '140px', border: 'none', outline: 'none', resize: 'vertical', color: '#374151', fontSize: '0.95rem' }}
                  placeholder="Type alert message..."
                />
              </div>
              <div>
                {compose.channel === 'email' ? (
                  <>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email subject</label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Alert subject"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                    />
                  </>
                ) : (
                  <div style={{ color: '#64748b', fontWeight: 700, paddingTop: 6 }}>SMS will be sent to the tenant phone number.</div>
                )}
                {sendError && <div style={{ color: '#b91c1c', fontWeight: 600, marginTop: 10 }}>{sendError}</div>}
              </div>
            </div>
          ) : null}

          {tenantsLoading ? (
            <div style={emptyState}>Loading tenants...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tenant</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Arrears</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTenants.length > 0 ? (
                    sortedTenants.map((t) => {
                      const id = t.id || t.ID;
                      const arrears = t.arrears ?? t.Arrears;
                      return (
                        <tr key={id}>
                          <td style={tdStyle}><span style={{ fontWeight: 700, color: '#111827' }}>{t.name || t.Name || '—'}</span></td>
                          <td style={tdStyle}>{t.unitNumber || '—'}</td>
                          <td style={tdStyle}>{typeof arrears === 'number' ? `${arrears.toLocaleString()} XOF` : '—'}</td>
                          <td style={tdStyle}>{t.phone || '—'}</td>
                          <td style={tdStyle}>{t.email || '—'}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                style={{ ...btnPrimary, opacity: sendingId === id ? 0.6 : 1 }}
                                disabled={sendingId === id}
                                onClick={() => { setCompose({ tenant: t, channel: 'sms' }); setSendError(''); }}
                              >
                                SMS
                              </button>
                              <button
                                type="button"
                                style={{ ...btnPrimary, opacity: sendingId === id ? 0.6 : 1 }}
                                disabled={sendingId === id}
                                onClick={() => { setCompose({ tenant: t, channel: 'email' }); setSendError(''); }}
                              >
                                Email
                              </button>
                              {compose?.tenant && (compose.tenant.id || compose.tenant.ID) === id ? (
                                <button
                                  type="button"
                                  style={{ ...btnPrimary, background: '#2563eb', opacity: sendingId === id ? 0.6 : 1 }}
                                  disabled={sendingId === id}
                                  onClick={() => sendAlert({ clientId: id, channel: compose.channel })}
                                >
                                  {sendingId === id ? 'Sending...' : 'Send'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={emptyState}>No unpaid tenants for this property.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'bulk-select') {
    if (!selectedProperty) {
      return (
        <div>
          <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              style={btnOutline}
              onClick={() => {
                setView('list');
                setBulkSelectedIds([]);
                setBulkTenants([]);
                setSendError('');
              }}
            >
              <ArrowLeft size={16} style={{ marginRight: 6 }} />
              Back
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Select a building</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Choose a property, then select tenants to send one message</p>
            </div>
          </div>

          <div style={card}>
            {loading ? (
              <div style={emptyState}>Loading...</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Property</th>
                      <th style={thStyle}>Occupancy</th>
                      <th style={thStyle}>Unpaid</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.length > 0 ? (
                      properties.map((p) => {
                        const total = p.numberOfUnits ?? p.NumberOfUnits ?? 1;
                        const occupied = p.occupiedUnits ?? p.OccupiedUnits ?? 0;
                        const unpaid = p.unpaidUnits ?? p.UnpaidUnits ?? 0;
                        const label = (p.name || p.Name || p.address || p.Address || '—').toString().trim();
                        const addr = (p.address || p.Address || '').toString().trim();
                        return (
                          <tr key={p.id || p.ID || label}>
                            <td style={tdStyle}>
                              <div>
                                <div style={{ fontWeight: 800, color: '#111827' }}>{label}</div>
                                {addr && addr !== label ? <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{addr}</div> : null}
                              </div>
                            </td>
                            <td style={tdStyle}>{`${occupied}/${total}`}</td>
                            <td style={tdStyle}>{`${unpaid}/${total}`}</td>
                            <td style={tdStyle}>
                              <span
                                style={pill}
                                role="button"
                                tabIndex={0}
                                onClick={async () => {
                                  setSelectedProperty(p);
                                  setBulkTenants([]);
                                  setBulkSelectedIds([]);
                                  setBulkTenantsLoading(true);
                                  try {
                                    const res = await salesManagerService.getAlertPropertyTenantsAll(p.id || p.ID);
                                    setBulkTenants(Array.isArray(res) ? res : []);
                                  } finally {
                                    setBulkTenantsLoading(false);
                                  }
                                }}
                              >
                                select
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={emptyState}>No properties found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    const propertyTitle = selectedProperty?.name || selectedProperty?.Name || selectedProperty?.address || selectedProperty?.Address || 'Property';
    const selectedSet = new Set(bulkSelectedIds);
    const allSelected = bulkTenants.length > 0 && bulkTenants.every((t) => selectedSet.has(t.id || t.ID));
    const toggleAll = () => {
      if (bulkTenants.length === 0) return;
      if (allSelected) {
        setBulkSelectedIds([]);
        return;
      }
      setBulkSelectedIds(bulkTenants.map((t) => t.id || t.ID).filter(Boolean));
    };
    const toggleOne = (id) => {
      if (!id) return;
      setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    return (
      <div>
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            style={btnOutline}
            onClick={() => {
              setView('list');
              setSelectedProperty(null);
              setBulkSelectedIds([]);
              setBulkTenants([]);
              setSendError('');
            }}
            disabled={bulkSending}
          >
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>{propertyTitle}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Select tenants to send one alert message</p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <button type="button" style={btnOutline} onClick={toggleAll} disabled={bulkTenantsLoading || bulkSending || bulkTenants.length === 0}>
              {allSelected ? 'Unselect all' : 'Select all'}
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('sms')} disabled={bulkSending} aria-pressed={bulkChannel === 'sms'}>
              SMS
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('email')} disabled={bulkSending} aria-pressed={bulkChannel === 'email'}>
              Email
            </button>
            <div style={{ marginLeft: 'auto', color: '#64748b', fontWeight: 700 }}>
              Selected: {bulkSelectedIds.length}
            </div>
          </div>

          {bulkChannel === 'email' ? (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Alert subject"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                disabled={bulkSending}
              />
            </div>
          ) : null}

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', minHeight: '140px', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical', color: '#374151', fontSize: '0.95rem' }}
              placeholder="Type alert message..."
              disabled={bulkSending}
            />
            {sendError && <div style={{ color: '#b91c1c', fontWeight: 600, marginTop: 10 }}>{sendError}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              type="button"
              style={{ ...btnPrimary, opacity: bulkSending ? 0.6 : 1 }}
              disabled={bulkSending || bulkSelectedIds.length === 0 || !message.trim()}
              onClick={async () => {
                if (!message.trim()) {
                  setSendError('Message is required.');
                  return;
                }
                setSendError('');
                setBulkSending(true);
                try {
                  await salesManagerService.sendTenantAlertBulk({
                    clientIds: bulkSelectedIds,
                    channel: bulkChannel,
                    message: message.trim(),
                    subject: bulkChannel === 'email' ? (subject || 'Alert') : undefined,
                    urgency: 'Low',
                  });
                  await loadProperties();
                  setBulkSelectedIds([]);
                } catch (e) {
                  setSendError(e?.message || 'Failed to send alert.');
                } finally {
                  setBulkSending(false);
                }
              }}
            >
              {bulkSending ? 'Sending...' : 'Send to selected'}
            </button>
          </div>

          {bulkTenantsLoading ? (
            <div style={emptyState}>Loading tenants...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle} />
                    <th style={thStyle}>Tenant</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkTenants.length > 0 ? (
                    bulkTenants.map((t) => {
                      const id = t.id || t.ID;
                      const unit = t.unitNumber || t.UnitNumber || '—';
                      return (
                        <tr key={id}>
                          <td style={tdStyle}>
                            <input type="checkbox" checked={selectedSet.has(id)} onChange={() => toggleOne(id)} disabled={bulkSending} />
                          </td>
                          <td style={tdStyle}><span style={{ fontWeight: 700, color: '#111827' }}>{t.name || t.Name || '—'}</span></td>
                          <td style={tdStyle}>{unit}</td>
                          <td style={tdStyle}>{t.phone || t.Phone || '—'}</td>
                          <td style={tdStyle}>{t.email || t.Email || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={emptyState}>No tenants found for this property.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'bulk-unpaid') {
    const groupTenantIds = (g) => (Array.isArray(g.tenants) ? g.tenants.map((t) => t.ID || t.id).filter(Boolean) : []);
    const allTenantIds = bulkUnpaidGroups.flatMap((g) => groupTenantIds(g));
    const selectedSet = new Set(bulkSelectedIds);
    const allSelected = allTenantIds.length > 0 && allTenantIds.every((id) => selectedSet.has(id));
    const toggleAll = () => setBulkSelectedIds(allSelected ? [] : allTenantIds);
    const toggleGroup = (g) => {
      const ids = groupTenantIds(g);
      if (ids.length === 0) return;
      const groupAllSelected = ids.every((id) => selectedSet.has(id));
      if (groupAllSelected) {
        setBulkSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      } else {
        setBulkSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
      }
    };
    return (
      <div>
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            style={btnOutline}
            onClick={() => {
              setView('list');
              setBulkUnpaidGroups([]);
              setSendError('');
            }}
            disabled={bulkSending}
          >
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Unpaid Tenants</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Send one alert message to all tenants with unpaid rent</p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <button type="button" style={btnOutline} onClick={toggleAll} disabled={bulkSending || allTenantIds.length === 0}>
              {allSelected ? 'Unselect all' : 'Select all'}
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('sms')} disabled={bulkSending} aria-pressed={bulkChannel === 'sms'}>
              SMS
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('email')} disabled={bulkSending} aria-pressed={bulkChannel === 'email'}>
              Email
            </button>
            <div style={{ marginLeft: 'auto', color: '#64748b', fontWeight: 700 }}>
              Selected: {bulkSelectedIds.length}
            </div>
          </div>

          {bulkChannel === 'email' ? (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Alert subject"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                disabled={bulkSending}
              />
            </div>
          ) : null}

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', minHeight: '140px', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical', color: '#374151', fontSize: '0.95rem' }}
              placeholder="Type alert message..."
              disabled={bulkSending}
            />
            {sendError && <div style={{ color: '#b91c1c', fontWeight: 600, marginTop: 10 }}>{sendError}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              type="button"
              style={{ ...btnPrimary, opacity: bulkSending ? 0.6 : 1 }}
              disabled={bulkSending || bulkSelectedIds.length === 0 || !message.trim()}
              onClick={async () => {
                if (!message.trim()) {
                  setSendError('Message is required.');
                  return;
                }
                setSendError('');
                setBulkSending(true);
                try {
                  await salesManagerService.sendTenantAlertBulk({
                    clientIds: bulkSelectedIds,
                    channel: bulkChannel,
                    message: message.trim(),
                    subject: bulkChannel === 'email' ? (subject || 'Alert') : undefined,
                    urgency: 'High',
                  });
                  await loadProperties();
                } catch (e) {
                  setSendError(e?.message || 'Failed to send alert.');
                } finally {
                  setBulkSending(false);
                }
              }}
            >
              {bulkSending ? 'Sending...' : 'Send to selected'}
            </button>
          </div>

          {bulkUnpaidLoading ? (
            <div style={emptyState}>Loading unpaid tenants...</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {bulkUnpaidGroups.length > 0 ? (
                bulkUnpaidGroups.map((g, idx) => (
                  <div key={g.propertyId || g.address || idx} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{g.name || g.address || 'Property'}</div>
                      <button type="button" style={btnOutline} onClick={() => toggleGroup(g)} disabled={bulkSending}>
                        Select all in building
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle} />
                            <th style={thStyle}>Tenant</th>
                            <th style={thStyle}>Unit</th>
                            <th style={thStyle}>Arrears</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(g.tenants || []).map((t) => {
                            const id = t.ID || t.id;
                            const arrears = t.Arrears ?? t.arrears;
                            return (
                              <tr key={id}>
                                <td style={tdStyle}>
                                  <input type="checkbox" checked={selectedSet.has(id)} onChange={() => setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))} disabled={bulkSending} />
                                </td>
                                <td style={tdStyle}>{t.Name || t.name || '—'}</td>
                                <td style={tdStyle}>{t.UnitNumber || t.unitNumber || '—'}</td>
                                <td style={tdStyle}>{typeof arrears === 'number' ? `${arrears.toLocaleString()} XOF` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyState}>No unpaid tenants found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'bulk-all') {
    const groupTenantIds = (g) => (Array.isArray(g.tenants) ? g.tenants.map((t) => t.ID || t.id).filter(Boolean) : []);
    const allTenantIds = bulkAllGroups.flatMap((g) => groupTenantIds(g));
    const selectedSet = new Set(bulkSelectedIds);
    const allSelected = allTenantIds.length > 0 && allTenantIds.every((id) => selectedSet.has(id));
    const toggleAll = () => setBulkSelectedIds(allSelected ? [] : allTenantIds);
    const toggleGroup = (g) => {
      const ids = groupTenantIds(g);
      if (ids.length === 0) return;
      const groupAllSelected = ids.every((id) => selectedSet.has(id));
      if (groupAllSelected) {
        setBulkSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      } else {
        setBulkSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
      }
    };

    return (
      <div>
        <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            style={btnOutline}
            onClick={() => {
              setView('list');
              setBulkAllGroups([]);
              setBulkSelectedIds([]);
              setSendError('');
            }}
            disabled={bulkSending}
          >
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            Back
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>All Tenants</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Select tenants per building, or send to everyone in the agency</p>
          </div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <button type="button" style={btnOutline} onClick={toggleAll} disabled={bulkSending || allTenantIds.length === 0}>
              {allSelected ? 'Unselect all' : 'Select all'}
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('sms')} disabled={bulkSending} aria-pressed={bulkChannel === 'sms'}>
              SMS
            </button>
            <button type="button" style={btnOutline} onClick={() => setBulkChannel('email')} disabled={bulkSending} aria-pressed={bulkChannel === 'email'}>
              Email
            </button>
            <div style={{ marginLeft: 'auto', color: '#64748b', fontWeight: 700 }}>
              Selected: {bulkSelectedIds.length}
            </div>
          </div>

          {bulkChannel === 'email' ? (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Alert subject"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                disabled={bulkSending}
              />
            </div>
          ) : null}

          <div style={{ marginBottom: 12 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', minHeight: '140px', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, outline: 'none', resize: 'vertical', color: '#374151', fontSize: '0.95rem' }}
              placeholder="Type alert message..."
              disabled={bulkSending}
            />
            {sendError && <div style={{ color: '#b91c1c', fontWeight: 600, marginTop: 10 }}>{sendError}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              type="button"
              style={{ ...btnPrimary, opacity: bulkSending ? 0.6 : 1 }}
              disabled={bulkSending || bulkSelectedIds.length === 0 || !message.trim()}
              onClick={async () => {
                if (!message.trim()) {
                  setSendError('Message is required.');
                  return;
                }
                setSendError('');
                setBulkSending(true);
                try {
                  await salesManagerService.sendTenantAlertBulk({
                    clientIds: bulkSelectedIds,
                    channel: bulkChannel,
                    message: message.trim(),
                    subject: bulkChannel === 'email' ? (subject || 'Alert') : undefined,
                    urgency: 'Medium',
                  });
                  await loadProperties();
                } catch (e) {
                  setSendError(e?.message || 'Failed to send alert.');
                } finally {
                  setBulkSending(false);
                }
              }}
            >
              {bulkSending ? 'Sending...' : 'Send to selected'}
            </button>
          </div>

          {bulkAllLoading ? (
            <div style={emptyState}>Loading tenants...</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {bulkAllGroups.length > 0 ? (
                bulkAllGroups.map((g, idx) => (
                  <div key={g.propertyId || g.address || idx} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{g.name || g.address || 'Property'}</div>
                      <button type="button" style={btnOutline} onClick={() => toggleGroup(g)} disabled={bulkSending}>
                        Select all in building
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle} />
                            <th style={thStyle}>Tenant</th>
                            <th style={thStyle}>Unit</th>
                            <th style={thStyle}>Arrears</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(g.tenants || []).map((t) => {
                            const id = t.ID || t.id;
                            const arrears = t.Arrears ?? t.arrears;
                            return (
                              <tr key={id}>
                                <td style={tdStyle}>
                                  <input type="checkbox" checked={selectedSet.has(id)} onChange={() => setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))} disabled={bulkSending} />
                                </td>
                                <td style={tdStyle}>{t.Name || t.name || '—'}</td>
                                <td style={tdStyle}>{t.UnitNumber || t.unitNumber || '—'}</td>
                                <td style={tdStyle}>{typeof arrears === 'number' && arrears > 0 ? `${arrears.toLocaleString()} XOF` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyState}>No tenants found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Alerts</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Select a property to send alerts to tenants</p>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <button
            type="button"
            style={btnOutline}
            onClick={async () => {
              setSendError('');
              setView('bulk-select');
              setSelectedProperty(null);
              setBulkTenants([]);
              setBulkSelectedIds([]);
              // User must pick a building first: we re-use the property list below (click "see")
            }}
          >
            Send alert (select tenants)
          </button>
          <button
            type="button"
            style={btnOutline}
            onClick={async () => {
              setSendError('');
              setView('bulk-all');
              setBulkSelectedIds([]);
              setBulkAllGroups([]);
              setBulkAllLoading(true);
              try {
                const res = await salesManagerService.getAlertAllTenants();
                setBulkAllGroups(Array.isArray(res) ? res : []);
              } catch (e) {
                setBulkAllGroups([]);
              } finally {
                setBulkAllLoading(false);
              }
            }}
          >
            Send to all tenants (agency)
          </button>
          <button
            type="button"
            style={btnOutline}
            onClick={async () => {
              setSendError('');
              setView('bulk-unpaid');
              setBulkUnpaidGroups([]);
              setBulkUnpaidLoading(true);
              try {
                const res = await salesManagerService.getAlertUnpaidTenants();
                setBulkUnpaidGroups(Array.isArray(res) ? res : []);
              } catch (e) {
                setBulkUnpaidGroups([]);
              } finally {
                setBulkUnpaidLoading(false);
              }
            }}
          >
            Send to all unpaid tenants
          </button>
        </div>
        {loading ? (
          <div style={emptyState}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Occupancy</th>
                  <th style={thStyle}>Unpaid</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {properties.length > 0 ? (
                  properties.map((p) => {
                    const total = p.numberOfUnits ?? p.NumberOfUnits ?? 1;
                    const occupied = p.occupiedUnits ?? p.OccupiedUnits ?? 0;
                    const unpaid = p.unpaidUnits ?? p.UnpaidUnits ?? 0;
                    const label = (p.name || p.Name || p.address || p.Address || '—').toString().trim();
                    const addr = (p.address || p.Address || '').toString().trim();
                    return (
                      <tr key={p.id || p.ID || label}>
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#111827' }}>{label}</div>
                            {addr && addr !== label ? (
                              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{addr}</div>
                            ) : null}
                          </div>
                        </td>
                        <td style={tdStyle}>{`${occupied}/${total}`}</td>
                        <td style={tdStyle}>{`${unpaid}/${total}`}</td>
                        <td style={tdStyle}>
                          <span
                            style={pill}
                            role="button"
                            tabIndex={0}
                            onClick={async () => {
                              if (view === 'bulk-select') {
                                setSelectedProperty(p);
                                setBulkTenants([]);
                                setBulkSelectedIds([]);
                                setBulkTenantsLoading(true);
                                try {
                                  const res = await salesManagerService.getAlertPropertyTenantsAll(p.id || p.ID);
                                  setBulkTenants(Array.isArray(res) ? res : []);
                                } finally {
                                  setBulkTenantsLoading(false);
                                }
                                return;
                              }
                              openProperty(p);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                if (view === 'bulk-select') {
                                  e.preventDefault();
                                }
                              }
                            }}
                          >
                            see
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={emptyState}>No properties found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsTab;
