# Backend Implementation: Expense Approval & Deduction

This document specifies the backend changes required for the expense approval flow to work end-to-end. The frontend is already implemented; the backend must implement these endpoints and logic.

---

## 1. POST /api/accounting/expenses

**Request body** (from frontend):
```json
{
  "scope": "Building" | "SAAF IMMO",
  "building": "123 Main St" | "-",
  "category": "Maintenance" | "Utilities" | "Taxes" | "Software" | "Other",
  "requestedBy": "string",
  "amount": 50000,
  "date": "2024-02-06",
  "notes": "string",
  "accountId": 1 | null,
  "requiresOwnerApproval": true | false,
  "deductFrom": "owner_balance" | "commission_account"
}
```

**Backend logic:**
- If `scope === "Building"` and `building` is a valid address:
  - Set `status = "pending_owner_approval"`
  - Set `deductFrom = "owner_balance"`
  - Resolve the building's owner (landlord) from Property.LandlordID
  - Store expense linked to that owner/building
  - Do NOT add to agency director's pending list

- If `scope === "SAAF IMMO"` or `building === "-"`:
  - Set `status = "pending_director_approval"`
  - Set `deductFrom = "commission_account"`
  - Add to agency director's pending list (GET /api/agency-director/accounting/expenses/pending-approval)

---

## 2. GET /api/agency-director/accounting/expenses/pending-approval

**Returns:** Only expenses where `status = "pending_director_approval"` AND `deductFrom = "commission_account"` (agency-only expenses).

**Response:**
```json
[
  {
    "id": 1,
    "scope": "SAAF IMMO",
    "building": "-",
    "category": "Software",
    "description": "Monthly subscription",
    "amount": 50000,
    "date": "2024-02-06",
    "status": "pending_director_approval",
    "deductFrom": "commission_account"
  }
]
```

**Filter:** Exclude building expenses (those with `deductFrom = "owner_balance"`).

---

## 3. POST /api/agency-director/contracts/expenses/:id/approve

**When called:** Agency director approves an agency-only expense.

**Backend logic:**
1. Verify expense exists and `status = "pending_director_approval"` and `deductFrom = "commission_account"`
2. Set `status = "approved"`
3. **Deduct the expense amount from the commission account** (agency commission balance)
4. Return success

---

## 4. POST /api/agency-director/contracts/expenses/:id/reject

**When called:** Agency director rejects an agency-only expense.

**Backend logic:**
1. Set `status = "rejected"`
2. No deduction
3. Return success

---

## 5. GET /api/landlord/expenses/pending-approval

**Returns:** Expenses where `status = "pending_owner_approval"` AND the building belongs to the authenticated landlord (owner).

**Filter:** `Expense.Building` must match a property owned by the current landlord (Property.LandlordID = current user's ID for landlord role).

**Response:**
```json
[
  {
    "id": 2,
    "scope": "Building",
    "building": "123 Main St",
    "category": "Maintenance",
    "description": "Plumbing repair",
    "amount": 25000,
    "date": "2024-02-05",
    "status": "pending_owner_approval",
    "deductFrom": "owner_balance"
  }
]
```

---

## 6. POST /api/landlord/expenses/:id/approve

**When called:** Owner (landlord) approves a building expense.

**Backend logic:**
1. Verify expense exists and `status = "pending_owner_approval"`
2. Verify the building belongs to the authenticated landlord
3. Set `status = "approved"`
4. **Deduct the expense amount from the owner's balance** (the balance owed to that owner for that building – e.g. reduce the net amount to be paid to the owner)
5. Return success

---

## 7. POST /api/landlord/expenses/:id/reject

**When called:** Owner rejects a building expense.

**Backend logic:**
1. Set `status = "rejected"`
2. No deduction
3. Return success

---

## 8. GET /api/accounting/expenses

**Returns:** Only expenses with `status = "approved"`. Used by the Accounting dashboard.

---

## Summary: Deduction Logic

| Expense Type | Approver | Deduct From |
|--------------|----------|-------------|
| Building (scope=Building, has building) | Owner | Owner's balance |
| Agency (scope=SAAF IMMO, building="-") | Agency Director | Commission account |

**Owner's balance:** The money owed to the owner (e.g. rent collected minus commission). When a building expense is approved, subtract the expense amount from what the owner will receive.

**Commission account:** The agency's commission. When an agency expense is approved, subtract from the commission balance.

---

## Database / Model Suggestions

**Expense table:**
- `id`, `scope`, `building`, `category`, `description`, `amount`, `date`, `notes`, `accountId`
- `status`: `pending_owner_approval` | `pending_director_approval` | `approved` | `rejected`
- `deductFrom`: `owner_balance` | `commission_account`
- `ownerId` / `landlordId`: For building expenses, the owner who must approve
- `createdAt`, `updatedAt`, `approvedAt`, `approvedBy`

---

## Implementation Checklist

- [ ] POST /api/accounting/expenses – route by scope, set status and deductFrom
- [ ] GET /api/agency-director/accounting/expenses/pending-approval – only agency-only
- [ ] POST /api/agency-director/contracts/expenses/:id/approve – deduct from commission
- [ ] POST /api/agency-director/contracts/expenses/:id/reject
- [ ] GET /api/landlord/expenses/pending-approval – building expenses for owner
- [ ] POST /api/landlord/expenses/:id/approve – deduct from owner balance
- [ ] POST /api/landlord/expenses/:id/reject
- [ ] GET /api/accounting/expenses – only approved
