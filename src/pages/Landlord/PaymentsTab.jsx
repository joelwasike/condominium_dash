import React from 'react';
import { FileText } from 'lucide-react';

const PaymentsTab = ({
  paymentSubTab, setPaymentSubTab, netPayments, paymentHistory,
  netPaymentStatusFilter, setNetPaymentStatusFilter,
  netPaymentStartDate, setNetPaymentStartDate,
  netPaymentEndDate, setNetPaymentEndDate,
  loadNetPayments, loadPaymentHistory
}) => (
  <div className="sa-transactions-page">
    <div className="sa-transactions-header"><h2>Rent Repayments (Agency to Landlord)</h2></div>
    <div className="sa-transactions-tabs">
      <button className={`sa-subtab-button ${paymentSubTab === 'net' ? 'active' : ''}`} onClick={() => { setPaymentSubTab('net'); loadNetPayments(); }}>Net Payments</button>
      <button className={`sa-subtab-button ${paymentSubTab === 'history' ? 'active' : ''}`} onClick={() => { setPaymentSubTab('history'); loadPaymentHistory(); }}>Payment History</button>
    </div>

    {paymentSubTab === 'net' && (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div><h2>Net Payments After Commission</h2><p>View net payments after commission deduction</p></div>
          <div className="sa-clients-header-right">
            <div className="sa-filters-section">
              <select className="sa-filter-select" value={netPaymentStatusFilter} onChange={(e) => setNetPaymentStatusFilter(e.target.value)}>
                <option value="">All Status</option><option value="Pending">Pending</option><option value="Paid">Paid</option>
              </select>
              <input type="date" className="sa-filter-select" value={netPaymentStartDate} onChange={(e) => setNetPaymentStartDate(e.target.value)} placeholder="Start Date" />
              <input type="date" className="sa-filter-select" value={netPaymentEndDate} onChange={(e) => setNetPaymentEndDate(e.target.value)} placeholder="End Date" />
            </div>
          </div>
        </div>
        {netPayments && (<>
          <div className="sa-overview-metrics" style={{ marginBottom: '24px' }}>
            <div className="sa-metric-card"><p className="sa-metric-label">Total Net Amount</p><p className="sa-metric-value">{netPayments.totalNetAmount?.toLocaleString() || 0} XOF</p></div>
            <div className="sa-metric-card"><p className="sa-metric-label">Total Commission</p><p className="sa-metric-value">{netPayments.totalCommission?.toLocaleString() || 0} XOF</p></div>
          </div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>No</th><th>Date</th><th>Landlord</th><th>Building</th><th>Net Amount</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                {(!netPayments.payments || netPayments.payments.length === 0) ? (<tr><td colSpan={7} className="sa-table-empty">No net payments found</td></tr>) : (
                  netPayments.payments.map((payment, index) => (
                    <tr key={payment.id || payment.ID || `net-payment-${index}`}>
                      <td>{index + 1}</td><td>{new Date(payment.date || payment.Date).toLocaleDateString()}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{payment.landlord || payment.Landlord || 'Unknown'}</span></td>
                      <td>{payment.building || payment.Building || 'Unknown'}</td>
                      <td>{(payment.netAmount || payment.NetAmount || 0).toLocaleString()} XOF</td>
                      <td>{(payment.commission || payment.Commission || 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${(payment.status || payment.Status || 'pending').toLowerCase()}`}>{payment.status || payment.Status || 'Pending'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>)}
      </div>
    )}

    {paymentSubTab === 'history' && (
      <div className="sa-clients-page">
        <div className="sa-clients-header">
          <div><h2>Payment & Cashflow History</h2><p>Rent payments, deposits, and payouts</p></div>
          <div className="sa-clients-header-right">
            <div className="sa-filters-section">
              <input type="date" className="sa-filter-select" value={netPaymentStartDate} onChange={(e) => setNetPaymentStartDate(e.target.value)} placeholder="Start Date" />
              <input type="date" className="sa-filter-select" value={netPaymentEndDate} onChange={(e) => setNetPaymentEndDate(e.target.value)} placeholder="End Date" />
            </div>
          </div>
        </div>

        {/* Rent Payments */}
        <div className="sa-section-card" style={{ marginBottom: '20px' }}>
          <div className="sa-section-header"><div><h3>Rent Payments</h3><p>Tenant rent payments collected for your properties</p></div></div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>No</th><th>Date</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {(!paymentHistory?.rentPayments || paymentHistory.rentPayments.length === 0)
                  ? <tr><td colSpan={7} className="sa-table-empty">No rent payments found</td></tr>
                  : paymentHistory.rentPayments.map((p, i) => (
                    <tr key={p.ID || p.id || `rent-${i}`}>
                      <td>{i + 1}</td>
                      <td>{new Date(p.Date || p.date || p.CreatedAt || p.createdAt).toLocaleDateString()}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{p.Tenant || p.tenant || '—'}</span></td>
                      <td>{p.Property || p.property || '—'}</td>
                      <td>{(p.Amount || p.amount || 0).toLocaleString()} XOF</td>
                      <td>{p.Method || p.method || '—'}</td>
                      <td><span className={`sa-status-pill ${(p.Status || p.status || 'pending').toLowerCase()}`}>{p.Status || p.status || 'Pending'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Deposits */}
        <div className="sa-section-card" style={{ marginBottom: '20px' }}>
          <div className="sa-section-header"><div><h3>Security Deposits</h3><p>Deposit payments collected for your properties</p></div></div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>No</th><th>Date</th><th>Tenant</th><th>Property</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
              <tbody>
                {(!paymentHistory?.deposits || paymentHistory.deposits.length === 0)
                  ? <tr><td colSpan={7} className="sa-table-empty">No deposit payments found</td></tr>
                  : paymentHistory.deposits.map((d, i) => (
                    <tr key={d.ID || d.id || `dep-${i}`}>
                      <td>{i + 1}</td>
                      <td>{new Date(d.CreatedAt || d.createdAt).toLocaleDateString()}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{d.Tenant || d.tenant || '—'}</span></td>
                      <td>{d.Property || d.property || '—'}</td>
                      <td>{(d.Amount || d.amount || 0).toLocaleString()} XOF</td>
                      <td>{d.PaymentMethod || d.paymentMethod || '—'}</td>
                      <td><span className="sa-status-pill completed">Completed</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payouts from agency */}
        <div className="sa-section-card">
          <div className="sa-section-header"><div><h3>Payouts from Agency</h3><p>Net payments after commission deduction</p></div></div>
          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead><tr><th>No</th><th>Date</th><th>Building</th><th>Net Amount</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                {(!paymentHistory?.payouts || paymentHistory.payouts.length === 0)
                  ? <tr><td colSpan={6} className="sa-table-empty">No payouts found</td></tr>
                  : paymentHistory.payouts.map((p, i) => (
                    <tr key={p.id || p.ID || `payout-${i}`}>
                      <td>{i + 1}</td>
                      <td>{new Date(p.date || p.Date).toLocaleDateString()}</td>
                      <td>{p.building || p.Building || '—'}</td>
                      <td>{(p.netAmount || p.NetAmount || 0).toLocaleString()} XOF</td>
                      <td>{(p.commission || p.Commission || 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${(p.status || p.Status || 'pending').toLowerCase()}`}>{p.status || p.Status || 'Pending'}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default PaymentsTab;
