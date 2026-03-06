# Agency Director – Owner Assets Backend Implementation

The Agency Director Properties page (owners → buildings → units) needs owner assets. Implement one of the options below.

**Frontend behavior**: The frontend tries (1) `GET /api/salesmanager/owners/:id/properties` first, then (2) `GET /api/agency-director/contracts/owners/:id/properties`. If both fail, it derives from `GET /api/agency-director/properties` when each property includes `landlordId`/`LandlordID`/`ownerId`/`OwnerID` or matching `landlord`/`Landlord`/`owner`/`Owner` name.

## Option A: Allow agency director to access sales manager route (simplest)

Allow the agency director role to call `GET /api/salesmanager/owners/:id/properties`. Update your auth middleware so agency director tokens are accepted for this endpoint (same as sales manager). No new route needed.

## Option B: Add agency-director endpoint

Add `GET /api/agency-director/contracts/owners/:id/properties` that returns the same data as the sales manager endpoint.

**Response shape** (same as `GET /api/salesmanager/owners/:id/properties`):

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

**Implementation**: Reuse the same handler/logic as `GET /api/salesmanager/owners/:id/properties`. Filter properties where `Property.LandlordID` (or equivalent) equals the owner ID. Ensure the agency director token can access this route.

---

## Option C: Ensure properties include owner link (for frontend fallback)

The frontend can derive owner assets from `GET /api/agency-director/properties` when the API fails or returns empty. For this to work, **each property in the response must include** one of:

- `landlordId` / `LandlordID`
- `ownerId` / `OwnerID` / `owner_id`

Example property:

```json
{
  "id": 1,
  "address": "123 Main St",
  "type": "Apartment",
  "landlordId": 12,
  "LandlordID": 12
}
```

Ensure `GET /api/agency-director/properties` returns `landlordId` or `LandlordID` (or equivalent) in each property. The frontend can also match by owner name (`landlord`/`Landlord`/`owner`/`Owner`) when IDs are missing.
