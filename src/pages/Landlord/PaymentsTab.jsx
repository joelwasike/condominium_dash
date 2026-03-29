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
          <div><h2>Payment & Payout History</h2><p>View payment and payout history</p></div>
          <div className="sa-clients-header-right">
            <div className="sa-filters-section">
              <input type="date" className="sa-filter-select" value={netPaymentStartDate} onChange={(e) => setNetPaymentStartDate(e.target.value)} placeholder="Start Date" />
              <input type="date" className="sa-filter-select" value={netPaymentEndDate} onChange={(e) => setNetPaymentEndDate(e.target.value)} placeholder="End Date" />
            </div>
          </div>
        </div>
        {paymentHistory && paymentHistory.payouts && paymentHistory.payouts.length > 0 ? (<>
          <div className="sa-section-card">
            <div className="sa-section-header"><div><h3>Payouts</h3><p>Net payments after commission</p></div></div>
            <div className="sa-table-wrapper">
              <table className="sa-table">
                <thead><tr><th>No</th><th>Date</th><th>Landlord</th><th>Building</th><th>Net Amount</th><th>Commission</th><th>Status</th></tr></thead>
                <tbody>
                  {paymentHistory.payouts.map((payout, index) => (
                    <tr key={payout.id || payout.ID || `payout-${index}`}>
                      <td>{index + 1}</td><td>{new Date(payout.date || payout.Date).toLocaleDateString()}</td>
                      <td className="sa-cell-main"><span className="sa-cell-title">{payout.landlord || payout.Landlord || 'Unknown'}</span></td>
                      <td>{payout.building || payout.Building || 'Unknown'}</td>
                      <td>{(payout.netAmount || payout.NetAmount || 0).toLocaleString()} XOF</td>
                      <td>{(payout.commission || payout.Commission || 0).toLocaleString()} XOF</td>
                      <td><span className={`sa-status-pill ${(payout.status || payout.Status || 'pending').toLowerCase()}`}>{payout.status || payout.Status || 'Pending'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>) : (<div className="sa-section-card"><div className="sa-table-empty">No payouts found</div></div>)}
      </div>
    )}
  </div>
);

export default PaymentsTab;
