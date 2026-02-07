# Cost of Work – API contract for production

The **Cost of Work** menu in the Technician dashboard needs these endpoints on the **production API** (e.g. `https://saafimmo-api.theliberec.com`).  
**Owners = Landlords** in the app.

If these routes are not implemented, the frontend will get **404** and show “No owners found”.  
Until the production API exposes them, the app will try these fallbacks for the **owners** list only:

- `GET /api/technician/landlords` → mapped to owners (with default counts)
- `GET /api/admin/landlords` → mapped to owners (with default counts)

So if your API already has **landlords** under one of those paths, the Cost of Work “owners” list can work.  
For **properties** and **works**, the production API must implement the routes below (or equivalent) so that drill-down works.

---

## Required endpoints

### 1. List owners (landlords) for Cost of Work

**Preferred:**

- **Method/URL:** `GET /api/technician/cost-of-work/owners`
- **Response:** JSON array of owners. Each item can have:
  - `id` or `ID` (string/number)
  - `name` or `Name`
  - `email` or `Email`
  - `numberOfBuildings` or `NumberOfBuildings` (optional, default 0)
  - `numberOfProperty` or `NumberOfProperty` (optional, default 0)
  - `numberOfWork` or `NumberOfWork` (optional, default 0)
  - `totalCost` or `TotalCost` (optional, default 0)

**Example:**

```json
[
  {
    "id": "1",
    "name": "Owner 1",
    "email": "owner@example.com",
    "numberOfBuildings": 6,
    "numberOfProperty": 36,
    "numberOfWork": 10,
    "totalCost": 350000
  }
]
```

Alternative: if you already have `GET /api/technician/landlords` or `GET /api/admin/landlords`, the frontend can use that as a fallback and map landlords to this shape (counts will be 0 until you add the cost-of-work endpoints).

---

### 2. List properties for an owner

- **Method/URL:** `GET /api/technician/cost-of-work/owners/:ownerId/properties`
- **Response:** JSON array of properties. Each item can have:
  - `id` or `ID`
  - `ownerId` (optional, can match `:ownerId`)
  - `name` or `Name`
  - `address` or `Address`
  - `numberOfWork` or `NumberOfWork` (optional, default 0)
  - `description` (optional)

**Example:**

```json
[
  {
    "id": "prop-1",
    "ownerId": "1",
    "name": "Building A",
    "address": "123 Main St",
    "numberOfWork": 6,
    "description": "Building A – 123 Main St"
  }
]
```

---

### 3. List works for a property

- **Method/URL:** `GET /api/technician/cost-of-work/properties/:propertyId/works`
- **Response:** JSON array of works. Each item can have:
  - `id` or `ID`
  - `propertyId` (optional)
  - `date` (ISO date string)
  - `apartment` or `Apartment` (e.g. "Appartement 5")
  - `price` or `Price` (number)
  - `technician` or `Technician`
  - `kindOfWork` or `KindOfWork` (e.g. "Plombérie")
  - `priority` or `Priority` (e.g. "Urgent", "Moyen", "Faible")
  - `status` or `Status` (e.g. "Effectué")

**Example:**

```json
[
  {
    "id": "w1",
    "propertyId": "prop-1",
    "date": "2025-08-15",
    "apartment": "Appartement 5",
    "price": 50000,
    "technician": "Koffi hamed",
    "kindOfWork": "Plombérie",
    "priority": "Urgent",
    "status": "Effectué"
  }
]
```

---

## Summary

| Endpoint | Purpose |
|----------|--------|
| `GET /api/technician/cost-of-work/owners` | List owners (landlords) with building/property/work counts and total cost |
| `GET /api/technician/cost-of-work/owners/:ownerId/properties` | List properties for one owner and number of works per property |
| `GET /api/technician/cost-of-work/properties/:propertyId/works` | List works and costs for one property |

Until the production API implements these (or equivalent URLs with the same response shape), the **owners** list can still show data if you expose **landlords** at `GET /api/technician/landlords` or `GET /api/admin/landlords`. Properties and works drill-down will stay empty until the two properties/works endpoints above are available.
