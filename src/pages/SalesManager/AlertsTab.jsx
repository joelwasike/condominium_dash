import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { salesManagerService } from '../../services/salesManagerService';

const card = { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #f1f5f9' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '14px 16px', fontSize: '0.88rem', color: '#334155', borderBottom: '1px solid #f8fafc' };
const emptyState = { textAlign: 'center', padding: '48px 24px', color: '#94a3b8', fontSize: '0.95rem' };
const btnPrimary = { padding: '8px 14px', borderRadius: '12px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const btnPrimaryBlue = { padding: '10px 22px', borderRadius: '12px', border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const btnOutline = { padding: '8px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' };
const pill = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 12px', borderRadius: '999px', border: '2px solid #86efac', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem', background: '#f0fdf4' };

const formatRatio = (a, b) => `${a}/${b}`;

const AlertsTab = () => {
  const [view, setView] = useState('list'); // list | detail
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [message, setMessage] = useState(`Hello everyone,\nAs a reminder, any rent payment via Orange Business,\nOrange Money, or Wave must be accompanied by a\nscreenshot of the receipt, which must be sent to validate the\npayment.\nOtherwise, the payment will not be taken into account.`);
  const [sendChannel, setSendChannel] = useState('sms'); // sms | email
  const [selectedUnitIds, setSelectedUnitIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const rows = useMemo(() => {
    const d = detail || {};
    const units = Array.isArray(d.units) ? d.units : [];
    // Show only overdue rows in the detail view to match "Recovery" purpose
    return units
      .map((u, idx) => ({ ...u, __key: u.id ?? `${u.unitNumber}-${idx}` }))
      .filter((u) => Number(u.arrears || u.balanceUnpaid || 0) > 0);
  }, [detail]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await salesManagerService.getRecoverySummary();
      const data = res?.data || res?.results || res?.items || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load recovery summary:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (item) => {
    setSelected(item);
    setView('detail');
    setSelectedUnitIds(new Set());
    setSendError('');
    try {
      setDetailLoading(true);
      const res = await salesManagerService.getPropertyBuildingDetail(item.propertyId || item.PropertyID || item.id);
      setDetail(res || {});
    } catch (e) {
      console.error('Failed to load building detail:', e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleToggleUnit = (unitId, checked) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(unitId);
      else next.delete(unitId);
      return next;
    });
  };

  const handleSend = async () => {
    if (!selected) return;
    const unitIds = Array.from(selectedUnitIds);
    if (unitIds.length === 0) {
      setSendError('Select at least one apartment.');
      return;
    }
    if (!message.trim()) {
      setSendError('Message is required.');
      return;
    }
    setSendError('');
    try {
      setSending(true);
      await salesManagerService.sendRecoveryReminder({
        propertyId: selected.propertyId || selected.PropertyID || selected.id,
        unitIds,
        channel: sendChannel,
        message,
      });
    } catch (e) {
      console.error('Failed to send reminders:', e);
      setSendError(e?.message || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  if (view === 'detail') {
    const propertyName = detail?.buildingName || selected?.property || selected?.Property || 'Property';
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <button type="button" style={{ ...btnOutline, display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => { setView('list'); setSelected(null); setDetail(null); }}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Recovery</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{propertyName}</div>
          </div>
        </div>

        <div style={card}>
          {detailLoading ? (
            <div style={emptyState}>Loading...</div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Appartments</th>
                      <th style={thStyle}>Tenants</th>
                      <th style={thStyle}>Rent</th>
                      <th style={thStyle}>Balance unpaid</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Send</th>
                      <th style={thStyle}>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? (
                      rows.map((u) => {
                        const unitId = u.id ?? u.ID;
                        const arrears = Number(u.arrears || u.balanceUnpaid || 0);
                        const rent = Number(u.rentPrice || u.rent || 0);
                        const dt = u.enterDate || u.lastPaymentDate || u.date || '';
                        return (
                          <tr key={u.__key}>
                            <td style={tdStyle}>{u.unitNumber || '—'}</td>
                            <td style={tdStyle}>{u.tenant || '—'}</td>
                            <td style={tdStyle}>{rent ? `${rent.toLocaleString()} FCFA` : '—'}</td>
                            <td style={tdStyle}>{arrears ? arrears.toLocaleString() : '—'}</td>
                            <td style={tdStyle}>{dt || '—'}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" style={{ ...btnPrimary, padding: '6px 16px' }} onClick={async () => {
                                  try {
                                    await salesManagerService.sendRecoveryReminder({
                                      propertyId: selected.propertyId || selected.PropertyID || selected.id,
                                      unitNumber: u.unitNumber,
                                      channel: 'sms',
                                      message,
                                    });
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}>SMS</button>
                                <button type="button" style={{ ...btnPrimary, padding: '6px 16px' }} onClick={async () => {
                                  try {
                                    await salesManagerService.sendRecoveryReminder({
                                      propertyId: selected.propertyId || selected.PropertyID || selected.id,
                                      unitNumber: u.unitNumber,
                                      channel: 'email',
                                      message,
                                    });
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}>Email</button>
                              </div>
                            </td>
                            <td style={tdStyle}>
                              <input
                                type="checkbox"
                                checked={unitId ? selectedUnitIds.has(unitId) : false}
                                onChange={(e) => unitId && handleToggleUnit(unitId, e.target.checked)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={emptyState}>No unpaid invoices for this property.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start', marginTop: '20px' }}>
                <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px', background: '#fff' }}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', minHeight: '140px', border: 'none', outline: 'none', resize: 'vertical', color: '#374151', fontSize: '0.95rem' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <button type="button" style={{ ...btnPrimary, height: '44px' }} onClick={() => setSendChannel('sms')}>SMS</button>
                    <button type="button" style={{ ...btnPrimary, height: '44px' }} onClick={() => setSendChannel('email')}>Email</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontWeight: 600 }}>
                      <input type="checkbox" checked={selectedUnitIds.size > 0} readOnly />
                      Select
                    </div>
                    <button type="button" disabled={sending} style={{ ...btnPrimaryBlue, opacity: sending ? 0.6 : 1 }} onClick={handleSend}>
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                    {sendError && <div style={{ color: '#b91c1c', fontWeight: 600 }}>{sendError}</div>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Recovery</h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Unpaid invoices per building</p>
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
                  <th style={thStyle}>Appartments</th>
                  <th style={thStyle}>occupancy</th>
                  <th style={thStyle}>Unpaid</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((it) => {
                    const occupied = Number(it.occupied ?? it.Occupied ?? 0);
                    const total = Number(it.total ?? it.Total ?? it.apartments ?? 0);
                    const unpaid = Number(it.unpaidCount ?? 0);
                    return (
                      <tr key={it.propertyId || it.PropertyID || it.id}>
                        <td style={tdStyle}>{it.property || it.Property || '—'}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 800, color: '#111827' }}>{total}</div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{(it.assetType || it.AssetType || 'Appartment').toString()}</div>
                        </td>
                        <td style={tdStyle}>{formatRatio(occupied, total)}</td>
                        <td style={tdStyle}>{formatRatio(unpaid, occupied || total || 1)}</td>
                        <td style={tdStyle}>
                          <button type="button" style={pill} onClick={() => openDetail(it)}>see</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={emptyState}>No recovery items found.</td>
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
