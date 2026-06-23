import React from 'react';
import './RentReceiptTemplate.css';
import logoLeft from '../Screenshot 2026-03-09 at 11.34.17.png';
import logoRight from '../Screenshot 2026-03-09 at 11.34.25.png';

const PAYMENT_METHODS = ['Link', 'Transfer', 'Check', 'OM', 'Wave', 'Cash'];

const RentReceiptTemplate = ({ data, isCollection = false }) => {
  const toMoney = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const readMoney = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return 0;
  };

  const amount = readMoney(data?.Amount, data?.amount);
  const rawOwner = data?.Owner ?? data?.owner ?? data?.OwnerName ?? data?.ownerName ?? data?.Landlord ?? data?.landlord;
  const owner = rawOwner && rawOwner !== 'N/A' ? rawOwner : null;
  const tenant = data?.Tenant ?? data?.tenant ?? (isCollection ? owner : null);
  const rawProperty = data?.Property ?? data?.property ?? null;
  const rawBuilding = data?.Building ?? data?.building ?? null;
  const property = rawProperty ?? rawBuilding ?? null;
  const building = rawBuilding;
  const locative = data?.Unit ?? data?.unit ?? data?.Locative ?? data?.locative ?? null;
  const method = data?.Method ?? data?.method ?? data?.PaymentMethod ?? data?.paymentMethod ?? null;
  const dateVal = data?.Date ?? data?.date;
  const dateStr = dateVal
    ? new Date(dateVal).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const refNum = data?.ReceiptNumber ?? data?.receiptNumber ?? data?.Reference ?? data?.reference ?? `SAAF/${data?.ID ?? data?.id ?? '000'}/000`;

  // Rent due = unpaid arrears before this payment.
  const storedRentDue = readMoney(
    data?.RentDue,
    data?.rentDue,
    data?.UnpaidRentAmount,
    data?.unpaidRentAmount,
    data?.OutstandingAmount,
    data?.outstandingAmount,
    data?.Arrears,
    data?.arrears
  );

  // Fixed monthly rent of the property.
  const monthlyRent = readMoney(
    data?.MonthlyRent,
    data?.monthlyRent,
    data?.Rent,
    data?.rent,
    data?.RentPrice,
    data?.rentPrice,
    data?.BaseRent,
    data?.baseRent
  );

  const paymentAmount = amount;
  const rentDue = isCollection
    ? 0
    : (storedRentDue > 0
      ? storedRentDue
      : Math.max(0, (readMoney(data?.MonthsInArrears, data?.monthsInArrears) * monthlyRent) - readMoney(data?.RentPaidAdvance, data?.rentPaidAdvance)));

  const rentPrice = isCollection ? amount : (monthlyRent > 0 ? monthlyRent : amount);

  // Excess payment above arrears + the fixed monthly rent becomes advance rent.
  const rentPaidAdvance = isCollection
    ? 0
    : Math.max(0, paymentAmount - (rentDue + rentPrice));

  // Total due before this payment = arrears + the fixed monthly rent.
  const totalDueBeforePayment = isCollection
    ? amount
    : (
      data?.TotalDueBeforePayment != null || data?.totalDueBeforePayment != null
        ? readMoney(data?.TotalDueBeforePayment, data?.totalDueBeforePayment)
        : (rentDue + rentPrice)
    );

  // Balance = what is still owed after this payment (0 when fully paid or overpaid).
  const balanceAfter = isCollection
    ? 0
    : Math.max(0, totalDueBeforePayment - paymentAmount);

  const formatAmount = (val) => toMoney(val).toLocaleString('fr-FR');

  const getMethodSpans = () => {
    const methodLower = (method || '').toLowerCase();
    return PAYMENT_METHODS.map((m, i) => {
      const mLower = m.toLowerCase();
      const isSelected = methodLower.includes(mLower) || (methodLower === 'mobile money' && mLower === 'om') || (methodLower === 'bank transfer' && mLower === 'transfer');
      return (
        <span key={m}>
          {isSelected ? <strong>{m}</strong> : m}
          {i < PAYMENT_METHODS.length - 1 ? ' | ' : ''}
        </span>
      );
    });
  };

  return (
    <div className="receipt-container">
      <div className="header">
        <div className="logo-main">
          <img src={logoLeft} alt="SAAF IMMO" />
        </div>
        <div className="receipt-title">RENT RECEIPT</div>
        <div className="logo-badge">
          <img src={logoRight} alt="Agent Immobilier Agréé" />
        </div>
      </div>

      <div className="info-section">
        <div className="tenant-details">
          <div>Tenant: {tenant || '................................................................'}</div>
          <div>Property / Building: {property ? property : '.............................................................'}{building && building !== property ? ` / ${building}` : ''}</div>
          <div>Locative: {locative || '.............................................................'}</div>
        </div>
        <div className="ref-date-details">
          <div>REF : {refNum}</div>
          <br />
          <div>Date : {dateStr}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th className="col-designation">DESIGNATION</th>
            <th className="col-montant">MONTANT</th>
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
          <tr className="total-row">
            <td style={{ textAlign: 'center' }}>TOTAL TO BE PAID</td>
            <td>{formatAmount(totalDueBeforePayment)} F-CFA</td>
          </tr>
          <tr className="payment-row">
            <td style={{ textAlign: 'center' }}>payment</td>
            <td>{formatAmount(paymentAmount)} F-CFA</td>
          </tr>
          <tr className="method-row">
            <td>payment method</td>
            <td>{getMethodSpans()}</td>
          </tr>
        </tbody>
      </table>

      <div className="balance-container">
        <div className="balance-label">Balance after payment</div>
        <div className="balance-value">
          <span>.......................................................</span>
          <span>{formatAmount(balanceAfter)} F-CFA</span>
        </div>
      </div>

      <div className="signature-section">
        <div></div>
        <div></div>
      </div>

      <div className="footer">
        <div className="clauses">
          CLAUSES DE RESERVE : La présente quittance annule tous reçus remis à titre d'acompte, ne concerne que la période indiquée et ne présume pas du paiement des quittances antérieures. <br />
          Elle ne comporte pas renonciation aux droits et actions du propriétaire ni novation dont l'occupant puisse se prévaloir. En cas de révision en cours, les versements quittancés le sont à titre provisionnel et en compte.
        </div>
        <div className="contact-info">
          SAAF - 17 BP 1016 Abidjan 17 - Adresse : Abidjan, Cocody Angré 8 Tranche, Carrefour la Prière. Ilot 43, lot 664, immeuble King Déco, 4ème étage <br />
          Tél: +225 07 04 77 51 79 - RCCM : CI-ABJ-03-2024-M-33430 ; N°CC : 1843184R - Email: info@saafimmo.ci
        </div>
      </div>
    </div>
  );
};

export default RentReceiptTemplate;
