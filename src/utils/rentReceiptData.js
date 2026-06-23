const normalizeMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeName = (value) => (value || '').trim().toLowerCase();

export const findTenantByName = (tenantList, name) => {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  return (Array.isArray(tenantList) ? tenantList : []).find((tenant) => {
    const tenantName = normalizeName(tenant?.tenantName || tenant?.TenantName || tenant?.name || tenant?.Name);
    return tenantName === normalized;
  }) || null;
};

export const buildRentReceiptContext = (tenant, paymentAmount) => {
  const monthlyRent = normalizeMoney(tenant?.monthlyRent ?? tenant?.MonthlyRent ?? tenant?.rent ?? tenant?.Rent);
  const monthsInArrears = normalizeMoney(tenant?.monthsInArrears ?? tenant?.MonthsInArrears);
  const priorAdvance = normalizeMoney(
    tenant?.rentPaidInAdvance ??
    tenant?.RentPaidInAdvance ??
    tenant?.advanceRent ??
    tenant?.AdvanceRent ??
    tenant?.rentInAdvance ??
    tenant?.RentInAdvance
  );
  const directDue = normalizeMoney(
    tenant?.unpaidRentAmount ??
    tenant?.UnpaidRentAmount ??
    tenant?.outstandingAmount ??
    tenant?.OutstandingAmount ??
    tenant?.balanceToPayEstimate ??
    tenant?.BalanceToPayEstimate
  );
  const arrearsDue = directDue > 0 ? directDue : Math.max(0, (monthlyRent * monthsInArrears) - priorAdvance);
  const totalDueBeforePayment = arrearsDue + monthlyRent;
  const rentPaidAdvance = Math.max(0, paymentAmount - totalDueBeforePayment);
  const balanceAfterPayment = Math.max(0, totalDueBeforePayment - paymentAmount);

  return {
    RentDue: arrearsDue,
    rentDue: arrearsDue,
    MonthlyRent: monthlyRent,
    monthlyRent,
    RentPaidAdvance: rentPaidAdvance,
    rentPaidAdvance,
    MonthsInArrears: monthsInArrears,
    monthsInArrears,
    BalanceAfterPayment: balanceAfterPayment,
    balanceAfterPayment,
    TotalDueBeforePayment: totalDueBeforePayment,
    totalDueBeforePayment,
  };
};

export const buildReceiptData = (item, tenantList = [], isCollection = false) => {
  if (!item) return item;
  if (isCollection) return { ...item };

  const paymentAmount = normalizeMoney(item.Amount ?? item.amount);
  const tenant = findTenantByName(tenantList, item.Tenant ?? item.tenant);
  const enriched = { ...item };

  if (tenant) {
    const tenantContext = buildRentReceiptContext(tenant, paymentAmount);
    Object.entries(tenantContext).forEach(([key, value]) => {
      if (enriched[key] == null) {
        enriched[key] = value;
      }
    });
  }

  if (enriched.RentDue == null && enriched.rentDue == null) {
    enriched.RentDue = normalizeMoney(
      item.RentDue ??
      item.rentDue ??
      item.UnpaidRentAmount ??
      item.unpaidRentAmount ??
      item.OutstandingAmount ??
      item.outstandingAmount ??
      item.Arrears ??
      item.arrears
    );
  }
  if (enriched.MonthlyRent == null && enriched.monthlyRent == null) {
    enriched.MonthlyRent = normalizeMoney(item.MonthlyRent ?? item.monthlyRent ?? item.Rent ?? item.rent ?? item.Amount ?? item.amount);
  }
  if (enriched.RentPaidAdvance == null && enriched.rentPaidAdvance == null) {
    enriched.RentPaidAdvance = normalizeMoney(item.RentPaidAdvance ?? item.rentPaidAdvance);
  }
  if (enriched.MonthsInArrears == null && enriched.monthsInArrears == null) {
    enriched.MonthsInArrears = normalizeMoney(item.MonthsInArrears ?? item.monthsInArrears);
  }

  return enriched;
};

export { normalizeMoney };
