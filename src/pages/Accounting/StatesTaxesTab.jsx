import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { accountingService } from '../../services/accountingService';

const StatesTaxesTab = (props) => {
  const { loading, setLoading, selectedMonth, setSelectedMonth, addNotification } = props;
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await accountingService.getDailyReport(selectedMonth);
        setReport(data || null);
      } catch (e) {
        console.error(e);
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMonth, setLoading]);

  const general = report?.generalInformation || {};
  const rows = useMemo(() => {
    const sourceRows = Array.isArray(report?.statusOfTenantPayments) ? report.statusOfTenantPayments : [];
    const uniqueRows = [];
    const seen = new Set();

    sourceRows.forEach((row, index) => {
      const key = String(
        row.propertyId ??
        row.propertyID ??
        row.property ??
        row.Property ??
        `row-${index}`
      ).trim().toLowerCase();

      if (seen.has(key)) return;
      seen.add(key);
      uniqueRows.push(row);
    });

    return uniqueRows;
  }, [report]);
  const summary = report?.summaryOfMonth || {};

  const money = (v) => `${Number(v || 0).toLocaleString()} FCFA`;

  const totals = useMemo(() => {
    const t = {
      numberOfTenants: 0,
      numberOfTenantsWhoPaid: 0,
      rentAwaited: 0,
      rentCollected: 0,
      remainingRent: 0,
    };
    rows.forEach((r) => {
      t.numberOfTenants += Number(r.numberOfTenants || 0);
      t.numberOfTenantsWhoPaid += Number(r.numberOfTenantsWhoPaid || r.numberOfTenantsWhoPaid || 0);
      t.rentAwaited += Number(r.rentAwaited || 0);
      t.rentCollected += Number(r.rentCollected || 0);
      t.remainingRent += Number(r.remainingRent || 0);
    });
    return t;
  }, [rows]);

  const synchronizedSummary = useMemo(() => ({
    totalExpectedRentAllProperties: totals.rentAwaited,
    totalExpectedMonthlyRents: totals.rentAwaited,
    totalCollectedRentForTheMonth: totals.rentCollected,
    totalUnpaidRentForTheMonth: totals.remainingRent,
    totalImpayes: totals.remainingRent,
  }), [totals]);

  return (
    <div>
      <div className="sa-section-card">
        <div className="sa-section-header">
          <div>
            <h2>Daily Report</h2>
            <p>Daily balance sheet (monthly view)</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="sa-input"
              style={{ minWidth: '160px' }}
            />
            <button
              className="sa-primary-cta"
              onClick={() => addNotification('Export coming soon', 'info')}
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading daily report...</div>
        ) : !report ? (
          <div className="no-data">No data available</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Reporting period</p>
                <p style={{ margin: '6px 0 0', fontWeight: 800, color: '#111827' }}>{general.reportingPeriod || selectedMonth}</p>
              </div>
              <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Report manager</p>
                <p style={{ margin: '6px 0 0', fontWeight: 800, color: '#111827' }}>{general.reportManager || '—'}</p>
              </div>
              <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Date</p>
                <p style={{ margin: '6px 0 0', fontWeight: 800, color: '#111827' }}>{general.date || '—'}</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Status of tenant payments</h3>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>Properties</th>
                      <th>Number of tenants</th>
                      <th>Tenants who paid</th>
                      <th>Rent awaited</th>
                      <th>Rent collected</th>
                      <th>Remaining rent</th>
                      <th>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length > 0 ? rows.map((r, idx) => (
                      <tr key={r.propertyId || r.propertyID || r.property || idx}>
                        <td><span className="sa-cell-title">{r.property || r.Property || '—'}</span></td>
                        <td>{Number(r.numberOfTenants || 0)}</td>
                        <td>{Number(r.numberOfTenantsWhoPaid || 0)}</td>
                        <td>{money(r.rentAwaited)}</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>{money(r.rentCollected)}</td>
                        <td style={{ color: '#dc2626', fontWeight: 700 }}>{money(r.remainingRent)}</td>
                        <td>{Number(r.collectionRatePercent || 0).toFixed(2)}%</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="no-data">No properties found</td></tr>
                    )}
                    <tr>
                      <td style={{ fontWeight: 800 }}>TOTAL</td>
                      <td style={{ fontWeight: 800 }}>{totals.numberOfTenants}</td>
                      <td style={{ fontWeight: 800 }}>{totals.numberOfTenantsWhoPaid}</td>
                      <td style={{ fontWeight: 800 }}>{money(totals.rentAwaited)}</td>
                      <td style={{ fontWeight: 800 }}>{money(totals.rentCollected)}</td>
                      <td style={{ fontWeight: 800 }}>{money(totals.remainingRent)}</td>
                      <td style={{ fontWeight: 800 }}>
                        {totals.rentAwaited > 0 ? ((totals.rentCollected / totals.rentAwaited) * 100).toFixed(2) : '0.00'}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>Summary of the month</h3>
              <div className="sa-table-wrapper">
                <table className="sa-table">
                  <thead>
                    <tr><th>Indicator</th><th>Amount (FCFA)</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Total expected rent (all properties)</td><td>{money(synchronizedSummary.totalExpectedRentAllProperties || summary.totalExpectedRentAllProperties)}</td></tr>
                    <tr><td>Total expected monthly rents</td><td>{money(synchronizedSummary.totalExpectedMonthlyRents || summary.totalExpectedMonthlyRents)}</td></tr>
                    <tr><td>Total collected rent for the month</td><td style={{ color: '#059669', fontWeight: 800 }}>{money(synchronizedSummary.totalCollectedRentForTheMonth || summary.totalCollectedRentForTheMonth)}</td></tr>
                    <tr><td>Total unpaid rent for the month</td><td style={{ color: '#dc2626', fontWeight: 800 }}>{money(synchronizedSummary.totalUnpaidRentForTheMonth || summary.totalUnpaidRentForTheMonth)}</td></tr>
                    <tr><td>Total impayés</td><td style={{ color: '#dc2626', fontWeight: 800 }}>{money(synchronizedSummary.totalImpayes || summary.totalImpayes)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default StatesTaxesTab;
