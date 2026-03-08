# Backend Implementation: Agency Balance & Commission Percentage

This document specifies the backend changes required for the agency balance and commission percentage flow. The frontend is already implemented; the backend must implement these endpoints and logic.

---

## 1. Owner Model: Commission Percentage

**Field to add/update on Owner (or OwnerProfile):**
- `commissionPercentage` (decimal, 0–100): Percentage of tenant payments that is deducted as agency commission and credited to the agency balance.

**Migration:** Add column `commission_percentage` (or `CommissionPercentage`) to the owner profile table. Default to 0 if not set.

---

## 2. Owner Create/Update APIs

**POST /api/agency-director/contracts/owners**

**Request body** (from frontend):
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "rib": "string",
  "commissionPercentage": 8.5
}
```

**Backend logic:**
- Accept `commissionPercentage` in the request body.
- Validate: 0 ≤ commissionPercentage ≤ 100.
- Store on the owner profile.

---

**PUT /api/agency-director/contracts/owners/:id**

Same as above: accept and persist `commissionPercentage`.

---

## 3. Tenant Payment Flow: Commission Deduction

When a tenant payment is recorded (e.g. rent for a building):

1. **Resolve the building's owner** (landlord) from the property/building record.
2. **Read the owner's `commissionPercentage`** (default 0 if not set).
3. **Compute commission:**
   ```
   commissionAmount = paymentAmount * (commissionPercentage / 100)
   ```
4. **Split the payment:**
   - `netAmount` (to owner) = `paymentAmount - commissionAmount`
   - `commissionAmount` → credited to **agency balance**
5. **Persist:**
   - Store the commission amount on the payment/collection record.
   - Credit the agency balance (see §4).

---

## 4. Agency Balance

**Concept:** The agency balance is the cumulative sum of all commission amounts deducted from tenant payments (based on each owner's `commissionPercentage`).

**Storage options:**
- Option A: Dedicated `agency_balance` table with running total, updated on each tenant payment.
- Option B: Compute on-the-fly: `SUM(commission)` from all tenant payments/collections.

---

## 5. GET /api/accounting/agency-balance

**Returns:** The current agency balance (commission account balance).

**Response:**
```json
{
  "balance": 1250000.50
}
```

Or a flat number:
```json
1250000.50
```

**Backend logic:**
- Return the sum of all commission amounts from tenant payments (or the stored agency balance if using Option A).
- If no payments yet, return `{ "balance": 0 }`.

---

## 6. Summary

| Item | Action |
|------|--------|
| Owner profile | Add `commissionPercentage` (0–100) |
| Create/Update owner | Accept and persist `commissionPercentage` |
| Tenant payment | Compute commission = amount × (commissionPercentage/100), deduct from payment, credit agency balance |
| Agency balance | Maintain running total or compute from payments |
| GET /api/accounting/agency-balance | Return `{ balance: number }` |

---

## 7. Frontend Integration

- **Agency Director → Create/Edit Owner:** Sends `commissionPercentage` instead of `commissionAmount`.
- **Account Balances page:** Fetches agency balance via `GET /api/accounting/agency-balance` and displays it in the overview.
