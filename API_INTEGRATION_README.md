# API Integration Guide

## Configuration

### Backend API URL Configuration

The frontend is configured to connect to the backend API. To change the API URL for production deployment:

Edit `src/config/env.js` and change the `API_BASE_URL`:

```javascript
export const ENV_CONFIG = {
  API_BASE_URL: 'https://your-backend-domain.com/api', // Change this for production
  // ... other config
};
```

**Current Configuration:**
- **Development**: `http://localhost:8080/api`
- **Production**: Change to your hosted backend URL

## Sales Manager Dashboard Integration

The Sales Manager Dashboard has been integrated with the following backend APIs:

### Endpoints Used:
- `GET /api/salesmanager/overview` - Dashboard statistics
- `GET /api/salesmanager/properties` - Property list
- `GET /api/salesmanager/clients` - Client/tenant list
- `POST /api/salesmanager/clients` - Create new client
- `GET /api/salesmanager/alerts` - Alert list
- `POST /api/salesmanager/alerts` - Create new alert
- `PUT /api/salesmanager/alerts/:id` - Update alert status

### Features Integrated:
1. **Overview Tab**: Real-time statistics from backend
2. **Occupancy Tab**: Property data from backend
3. **Client Management**: CRUD operations for clients
4. **Alerts Tab**: Alert management with status updates

### Error Handling:
- Loading states while fetching data
- Error notifications for failed API calls
- Fallback to mock data if API is unavailable

## Testing the Integration

1. **Start the Backend**:
   ```bash
   cd backend
   go run ./cmd/server
   ```

2. **Start the Frontend**:
   ```bash
   cd real-estate-dash
   npm start
   ```

3. **Test the Sales Manager Dashboard**:
   - Navigate to Sales Manager Dashboard
   - Check if data loads from the backend
   - Try creating a new client
   - Test alert management

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure the backend CORS is configured properly
2. **Connection Refused**: Verify the backend is running on the correct port
3. **404 Errors**: Check if the API endpoints match between frontend and backend

### Debug Mode:
The frontend will show console errors if API calls fail. Check the browser console for detailed error messages.

## Backend Edits (Sales Manager, Admin, Technician, Tenant, Agency Director)

These endpoints were added or updated to support the frontend changes described in the conversation summary.

### Sales Manager
- **GET /api/salesmanager/approved-clients** – List clients approved by the administrative agent (for Add Tenant dropdown).
- **GET /api/salesmanager/approved-clients/:id/documents** – Documents uploaded by the administrative agent for a client.
- **GET /api/salesmanager/approved-clients/:id/checklist** – Checklist data for a client (e.g. save date).
- **POST /api/salesmanager/clients** – Create client/tenant. Request body may include `adminDocumentIds`, `adminChecklistId` to link admin documents and checklist.

### Administrative Agent
- **PUT /api/admin/leases/:id/status** – Update lease status (e.g. `Lease contract being created`, `Pending signature by owner`, `Active lease contract`). Body: `{ "status": "..." }`.
- **POST /api/admin/new-clients** – Create new client. Backend should enforce **unique email** and return 400 if email already exists.
- **PUT /api/admin/new-clients/:id** – Update client (e.g. `securityDepositPaid`, `securityDepositPaidAt`). Body can include `securityDepositPaid`, `securityDepositPaidAt`.

### Technician
- **POST /api/technician/maintenance-requests** – Create maintenance request. Accepts multipart/form-data with `property`, `issue`, `priority`, `status`, `estimatedCost`, optional `photos[]`.
- **PUT /api/technician/maintenance-requests/:id** – Update maintenance. Body may include `status`, `workStartDate`, `workEndDate`, `archived`, `completedAt` (for “Start Work”, status change, archive).

### Tenant
- **POST /api/tenant/lease/terminate** – Submit lease termination. Accepts form-data: `reason`, `terminationDate`, `comments`, `securityDepositRefundMethod`, **`mobileMoneyNumber`** (required when `securityDepositRefundMethod` is “Mobile Money”), `inventoryCheckDate`, optional `terminationLetter`, `supportingDocs`.
- **GET /api/tenant/maintenance** – Return maintenance requests **for the current tenant only** (filter by authenticated tenant).
- Tenant payments: backend should **approve tenant payments immediately** (no pending approval step) when the tenant records a payment.

### Agency Director
- **GET /api/agency-director/accounting/payments/pending-approval** – List **expenses added by the accountant** that are pending director approval (not all payments).
- **POST /api/agency-director/contracts/expenses/:id/approve** – Approve expense.
- **POST /api/agency-director/contracts/leases/:id/approve** – Approve lease (moves to “Valid” tab).

---

## Tenant Dashboard / Tenant-Related Changes

- **Terminate lease**: 3‑month notice and 2–5 business days for inventory check are validated on the frontend; backend stores `mobileMoneyNumber` when refund method is “Mobile Money” (see `tenantService.terminateLease` – `mobileMoneyNumber` is sent in form data).
- **Maintenance**: Frontend calls `GET /api/tenant/maintenance`; backend must filter by current tenant.
- **Payments**: Backend should auto-approve tenant payments (no pending state).
- **Technician contacts**: Worker photo visible to tenants; ID card not. Backend should expose photo URL for tenant-facing contact list.

---

## Optional: Node/Express API Stub

A minimal Express stub is in `backend/` that implements the new routes above with in-memory data. Useful for local development without the main backend.

```bash
cd backend
npm install
npm start
```

Server runs on port 8080 by default. Set frontend `API_BASE_URL` to `http://localhost:8080` (no `/api`) so that requests go to `http://localhost:8080/api/...`.

---

## Next Steps

To integrate other dashboards:
1. Create service files similar to `salesManagerService.js`
2. Update the respective dashboard components
3. Add the new endpoints to `src/config/api.js`
4. Test the integration

## Production Deployment

When deploying to production:
1. Update the `API_BASE_URL` in `src/config/env.js`
2. Ensure the backend is accessible from the frontend domain
3. Configure proper CORS settings on the backend
4. Test all API endpoints in the production environment
