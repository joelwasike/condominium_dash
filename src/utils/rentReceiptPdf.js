import React from 'react';
import ReactDOM from 'react-dom/client';
import html2pdf from 'html2pdf.js';
import RentReceiptTemplate from '../components/RentReceiptTemplate';

export async function saveRentReceiptPdf({ item, isCollection = false, filename = 'rent-receipt.pdf' }) {
  if (!item) return;
  const overlay = document.createElement('div');
  overlay.style.cssText =
  'position:fixed;top:0;left:0;right:0;bottom:0;background:#f0f0f0;z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow:auto;';
  document.body.appendChild(overlay);

  const container = document.createElement('div');
  overlay.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(RentReceiptTemplate, { data: item, isCollection }));

  try {
    await new Promise((r) => setTimeout(r, 800));
    const receiptEl = container.querySelector('.receipt-container') || container.firstChild;
    if (!receiptEl) throw new Error('Receipt element not found');

    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(receiptEl).save();
  } finally {
    root.unmount();
    document.body.removeChild(overlay);
  }
}
