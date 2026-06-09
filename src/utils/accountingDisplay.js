const readField = (item, keys, fallback = '') => {
  if (!item) return fallback;
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
};

export const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

export const normalizeAmount = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatOwnerName = (item, fallback = 'N/A') => (
  readField(item, ['Owner', 'owner', 'OwnerName', 'ownerName', 'Landlord', 'landlord'], fallback) || fallback
);

export const formatTenantName = (item, fallback = 'N/A') => (
  readField(item, ['Tenant', 'tenant', 'Buyer', 'buyer', 'TenantName', 'tenantName', 'Name', 'name'], fallback) || fallback
);

export const formatPropertyBuilding = (item, fallback = 'N/A') => {
  const unit = readField(item, ['Unit', 'unit', 'UnitName', 'unitName', 'UnitNumber', 'unitNumber', 'Apartment', 'apartment'], '');
  const property = readField(item, ['Property', 'property', 'Building', 'building', 'Address', 'address'], '');

  if (!unit && !property) return fallback;
  if (unit && property && normalizeText(unit) !== normalizeText(property)) {
    return `${unit} / ${property}`;
  }
  return unit || property || fallback;
};

export const formatDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getTransactionDateValue = (item) => (
  readField(item, ['Date', 'date', 'CreatedAt', 'createdAt', 'PaidAt', 'paidAt', 'ApprovedAt', 'approvedAt'], '')
);

export const getTransactionSignature = (item) => {
  if (!item) return '';

  const receipt = readField(item, ['ReceiptNumber', 'receiptNumber', 'Reference', 'reference'], '');
  if (receipt) {
    return `ref:${normalizeText(receipt)}`;
  }

  const type = normalizeText(readField(item, ['ChargeType', 'chargeType', 'Type', 'type'], 'payment'));
  const tenant = normalizeText(formatTenantName(item, ''));
  const amount = normalizeAmount(readField(item, ['Amount', 'amount', 'NetAmount', 'netAmount', 'SaleAmount', 'saleAmount'], 0));
  const dateValue = getTransactionDateValue(item);
  const date = formatDateValue(dateValue);
  const day = date ? date.toISOString().slice(0, 10) : normalizeText(dateValue);

  return [type, tenant, amount.toFixed(2), day].join('|');
};

export const dedupeBySignature = (rows, priorityAccessor = (row) => row.priority ?? 0) => {
  const map = new Map();

  rows.forEach((row, index) => {
    const key = row.signature || row.key || `row-${index}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row, _sortIndex: index });
      return;
    }

    const incomingPriority = priorityAccessor(row);
    const existingPriority = priorityAccessor(existing);
    if (incomingPriority > existingPriority) {
      map.set(key, { ...row, _sortIndex: existing._sortIndex ?? index });
    }
  });

  return [...map.values()];
};
