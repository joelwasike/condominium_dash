# Real Estate Dashboard – Data Architecture & Cross-Role Relationships

This document describes how tables are shared across roles so data flows correctly. **No role should have its own isolated table when the data is shared.**

---

## Role → Data Source Mapping (What Each Menu Should Show)

| Role | Menu / Feature | Data Source | Notes |
|------|----------------|-------------|-------|
| **Landlord** | Properties | `Property` (landlord_id) | Same as Sales Manager owner assets |
| **Landlord** | Tenants | `Client`, `Lease` | Filter by Property.Address |
| **Landlord** | Payments / Rents | `TenantPayment` | Filter by Property.Address (accountant records these) |
| **Landlord** | Net payouts | `LandlordPayment` | Accounting records; landlord = name |
| **Landlord** | Expenses | `Expense` | Filter by Expense.Building = Property.Address |
| **Landlord** | Maintenance quotes | `Quote` | Filter by Quote.Property; landlord approves |
| **Landlord** | Works / Claims | `WorkOrder`, `Claim` | Landlord-specific |
| **Landlord** | Inventory | `Inventory` | Technician creates; filter by Property |
| **Accounting** | Tenant payments | `TenantPayment` | Records payments → visible to landlord |
| **Accounting** | Landlord payouts | `LandlordPayment` | Records payouts → visible to landlord |
| **Accounting** | Expenses | `Expense` | Records expenses → visible to landlord |
| **Technician** | Maintenance | `Maintenance` | Creates requests → visible to landlord, sales manager |
| **Technician** | Quotes | `Quote` | Creates quotes → landlord approves |
| **Technician** | Inventory | `Inventory` | Creates entry/exit → visible to landlord |
| **Admin** | Documents | `Document` | Uploads docs → visible to sales manager, client |
| **Admin** | Leases | `Lease` | Manages leases → visible to agency director, tenant |
| **Admin** | Clients | `Client` | New applications, approvals |
| **Sales Manager** | Properties | `Property` | Creates/assigns; landlord_id = owner |
| **Sales Manager** | Clients | `Client` | Tenants in properties |
| **Agency Director** | All | Aggregates from shared tables | Oversees company |

---

## Core Principle: Single Source of Truth

| Data | Single Table | Who Writes | Who Reads |
|------|--------------|------------|-----------|
| **Properties** | `Property` | Sales Manager, Landlord (add) | All roles |
| **Tenants/Clients** | `Client` | Admin, Sales Manager | Landlord, Accounting, Technician, Sales Manager |
| **Payments (rent)** | `TenantPayment` | Accounting, Tenant | Landlord, Accounting, Sales Manager |
| **Landlord payouts** | `LandlordPayment` | Accounting | Landlord, Agency Director |
| **Expenses** | `Expense` | Accounting | Landlord, Agency Director |
| **Maintenance** | `Maintenance` | Technician, Tenant | Landlord, Sales Manager, Technician |
| **Quotes** | `Quote` | Technician | Landlord (approve), Agency Director |
| **Documents** | `Document` | Admin | Sales Manager, Client |
| **Leases** | `Lease` | Admin | Agency Director, Tenant |
| **Inventory** | `Inventory` | Technician | Landlord, Admin, Tenant |
| **Work Orders** | `WorkOrder` | Landlord | Landlord |
| **Claims** | `Claim` | Landlord | Landlord |

---

## Property Table (Single Source)

- **`Property`** is the only table for all properties (buildings, villas, land).
- **`LandlordProperty`** is deprecated and should not be used for shared data.
- **`Property.LandlordID`** links to `SystemUser` (role = landlord).
- **`Property`** is the source for:
  - Sales Manager → owner assets
  - Landlord → their properties
  - Accounting → landlord payments (by property address)
  - Technician → maintenance, inventory
  - Admin → documents, leases

---

## Data Flow

### 1. Accounting → Landlord

- **Accounting** records `TenantPayment` (property, tenant, amount).
- **Landlord** sees payments for their properties via `Property` addresses:
  - `Property.Address` = `TenantPayment.Property`
  - `Property.LandlordID` = landlord.ID

### 2. Technician → Landlord

- **Technician** creates `Maintenance` for a property.
- **Technician** creates `Quote` for maintenance.
- **Landlord** sees quotes for their properties and approves/rejects.
- **Maintenance.Property** = property address from `Property`.

### 3. Admin → Landlord / Sales Manager

- **Admin** uploads `Document` (tenant, property, type).
- **Admin** manages `Lease` (tenant, property, landlord).
- **Landlord** sees tenants via `Client` where `Client.Property` = landlord's property addresses.
- **Sales Manager** sees documents via `approved-clients/:id/documents`.

### 4. Expense → Landlord

- **Accounting** creates `Expense` (building, category, amount).
- **Expense.Building** = property address.
- **Landlord** sees expenses where `Expense.Building` IN landlord's property addresses.

### 5. Inventory → Landlord

- **Technician** creates `Inventory` (property, tenant).
- **Landlord** sees inventory for their properties.

---

## Link Keys

- **Property ↔ Landlord**: `Property.LandlordID` = `SystemUser.ID` (role = landlord)
- **TenantPayment ↔ Property**: `TenantPayment.Property` = `Property.Address`
- **Expense ↔ Property**: `Expense.Building` = `Property.Address`
- **Maintenance ↔ Property**: `Maintenance.Property` = `Property.Address`
- **Client ↔ Property**: `Client.Property` = `Property.Address`
- **Lease ↔ Landlord**: `Lease.Landlord` = `SystemUser.Name` (landlord name)
- **LandlordPayment ↔ Landlord**: `LandlordPayment.Landlord` = `SystemUser.Name`

---

## Role-Specific Data (Not Shared)

- **WorkOrder** – landlord creates for their own tracking
- **Claim** – landlord creates for insurance/claims
- **Reminder** – admin creates
- **Notification** – system-generated

---

## Migration Notes

- **LandlordProperty** should be deprecated. All landlord property queries use `Property` where `landlord_id = landlord.ID`.
- When landlord adds a property via the dashboard, it creates a **Property** record with `landlord_id` set.
- Existing `LandlordProperty` rows can be migrated to `Property` if needed.
