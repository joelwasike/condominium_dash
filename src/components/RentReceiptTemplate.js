import React from 'react';
import './RentReceiptTemplate.css';

const PAYMENT_METHODS = ['Link', 'Transfer', 'Check', 'OM', 'Wave', 'Cash'];

const RentReceiptTemplate = ({ data, isCollection = false }) => {
  const amount = data?.Amount ?? data?.amount ?? 0;
  const tenant = data?.Tenant ?? data?.tenant ?? (isCollection ? (data?.Landlord ?? data?.landlord) : null);
  const building = data?.Property ?? data?.property ?? data?.Building ?? data?.building ?? '—';
  const method = data?.Method ?? data?.method ?? '—';
  const dateVal = data?.Date ?? data?.date;
  const dateStr = dateVal
    ? new Date(dateVal).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const refNum = data?.ReceiptNumber ?? data?.receiptNumber ?? data?.Reference ?? data?.reference ?? `SAAF/${data?.ID ?? data?.id ?? '000'}/000`;
  const rentDue = data?.RentDue ?? data?.rentDue ?? 0;
  const rentPaidAdvance = data?.RentPaidAdvance ?? data?.rentPaidAdvance ?? 0;
  const rentPrice = amount;
  const totalToPay = rentDue + rentPrice - rentPaidAdvance;
  const paymentAmount = amount;
  const balanceAfter = (totalToPay - paymentAmount) || 0;

  const formatAmount = (val) => (Number(val) || 0).toLocaleString('fr-FR');

  return (
    <div className="rent-receipt-template">
      <div className="rent-receipt-watermark" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <span key={i}>SAAF IMMO</span>
        ))}
      </div>

      <div className="rent-receipt-header">
        <div className="rent-receipt-logo">
          <span className="rent-receipt-logo-sili">sili</span>
          <span className="rent-receipt-logo-saaf">SAAF IMMO</span>
        </div>
        <div className="rent-receipt-title">RENT RECEIPT</div>
        <div className="rent-receipt-badge">
          <span>AGENT IMMOBILIER AGRÉÉ</span>
        </div>
      </div>

      <div className="rent-receipt-meta">
        <div className="rent-receipt-ref">REF : {refNum}</div>
        <div className="rent-receipt-date">Date : {dateStr}</div>
      </div>

      <div className="rent-receipt-info">
        <div className="rent-receipt-info-row">
          <span className="rent-receipt-label">Tenant:</span>
          <span className="rent-receipt-value">{tenant || '—'}</span>
        </div>
        <div className="rent-receipt-info-row">
          <span className="rent-receipt-label">Building:</span>
          <span className="rent-receipt-value">{building || '—'}</span>
        </div>
        <div className="rent-receipt-info-row">
          <span className="rent-receipt-label">Locative:</span>
          <span className="rent-receipt-value">{data?.Unit ?? data?.unit ?? data?.Locative ?? data?.locative ?? '—'}</span>
        </div>
      </div>

      <table className="rent-receipt-table">
        <thead>
          <tr>
            <th>DESIGNATION</th>
            <th>MONTANT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Rent due (Total unpaid)</td>
            <td>{formatAmount(rentDue)} F-CFA</td>
          </tr>
          <tr>
            <td>2. Rent paid in advance</td>
            <td>{formatAmount(rentPaidAdvance)} F-CFA</td>
          </tr>
          <tr>
            <td>3. Rent price</td>
            <td>{formatAmount(rentPrice)} F-CFA</td>
          </tr>
          <tr className="rent-receipt-total-row">
            <td>TOTAL TO BE PAID</td>
            <td>{formatAmount(totalToPay)} F-CFA</td>
          </tr>
          <tr className="rent-receipt-payment-row">
            <td>payment</td>
            <td>{formatAmount(paymentAmount)} F-CFA</td>
          </tr>
          <tr>
            <td>payment method</td>
            <td className="rent-receipt-methods">
              {PAYMENT_METHODS.map((m, i) => {
                const methodLower = (method || '').toLowerCase();
                const mLower = m.toLowerCase();
                const isSelected = methodLower.includes(mLower) || (methodLower === 'mobile money' && mLower === 'om') || (methodLower === 'bank transfer' && mLower === 'transfer');
                return (
                  <span key={m} className={isSelected ? 'selected' : ''}>
                    {m}{i < PAYMENT_METHODS.length - 1 ? ' | ' : ''}
                  </span>
                );
              })}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rent-receipt-balance">
        <span className="rent-receipt-balance-label">Balance after payment</span>
        <span className="rent-receipt-balance-value">{formatAmount(balanceAfter)} F-CFA</span>
      </div>

      <div className="rent-receipt-signatures">
        <div className="rent-receipt-sig">
          <span>VISA AGENCY</span>
          <div className="rent-receipt-sig-line" />
        </div>
        <div className="rent-receipt-sig">
          <span>VISA CLIENT</span>
          <div className="rent-receipt-sig-line" />
        </div>
      </div>

      <div className="rent-receipt-clauses">
        <strong>CLAUSES DE RESERVE:</strong> La présente quittance annuelle loue reçu remis à titre d'acompte, ne concerne que la période indiquée et ne présume pas du paiement des quittances antérieures. Elle ne comporte pas renonciation aux droits et actions du propriétaire ni novation dont l'occupant puisse se prévaloir. En cas de révision en cours, les versements quittanciels le sont à titre provisionnel et en compte.
      </div>

      <div className="rent-receipt-footer">
        <div>SAAF - 17 BP 1016 Abidjan 17</div>
        <div>Adresse: Abidjan, Cocody Angré 8 Tranche, Carrefour la Prière. Ilot 43, lot 664, immeuble King Déco, 4ème étage</div>
        <div>Tel: +225 07 04 77 51 79</div>
        <div>RCCM: C-ABJ-03-2024-M-33430</div>
        <div>Email: info@saafimmo.ci</div>
      </div>
    </div>
  );
};

export default RentReceiptTemplate;
