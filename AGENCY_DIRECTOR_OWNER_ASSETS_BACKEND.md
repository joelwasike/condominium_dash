# Agency Director – Owner Assets Backend Implementation

The Agency Director Properties page uses **agency director endpoints** (the backend returns 401 for sales manager routes when using an agency director token).

**Current frontend behavior:**
1. Loads owners from `GET /api/agency-director/contracts/owners`
2. Loads properties from `GET /api/agency-director/properties`
3. On owner click: tries `GET /api/agency-director/contracts/owners/:id/properties` → if 404/401, derives from properties (requires `landlordId`/`LandlordID` in each property)

**For owner assets to show when clicking an owner**, you need one of:

## Option A: Add agency-director owner-assets endpoint (recommended)

Add `GET /api/agency-director/contracts/owners/:id/properties` that returns the same shape as the sales manager endpoint:

```json
{
  "ownerName": "Owner Name",
  "assets": [
    {
      "id": 1,
      "name": "123 Main St",
      "building": "123 Main St",
      "address": "123 Main St",
      "type": "building",
      "apartmentsDisplay": 4,
      "rentPrice": 150000,
      "location": "123 Main St",
      "occupancy": "Occupied",
      "statut": "Occupied"
    }
  ]
}
```

You can also use `properties` instead of `assets` – the frontend accepts both.

**Implementation**: Reuse the same handler/logic as `GET /api/salesmanager/owners/:id/properties`. Filter properties where `Property.LandlordID` (or equivalent) equals the owner ID.

---

## Option B: Include landlordId in properties (for frontend fallback)

Ensure `GET /api/agency-director/properties` returns `landlordId` or `LandlordID` (or `ownerId`/`OwnerID`) in each property. The frontend can then derive owner assets when the API endpoint above is missing.
The frontend can also match by owner name (`landlord`/`Landlord`/`owner`/`Owner`) when IDs are missing.
