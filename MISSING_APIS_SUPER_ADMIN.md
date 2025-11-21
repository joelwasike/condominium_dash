# Missing APIs for Super Admin Dashboard

## Overview
The Super Admin Dashboard has been updated to use English throughout and fetch data from APIs. However, one critical API endpoint is missing and needs to be created on the backend.

## Missing API Endpoint

### 1. GET `/api/superadmin/subscriptions`
**Purpose**: Fetch subscription/transaction history for all agencies

**Expected Response Format**:
```json
[
  {
    "id": 1,
    "agencyId": 5,
    "companyId": 5,
    "agencyName": "ABC Real Estate",
    "email": "contact@abcrealestate.com",
    "amount": 50000,
    "subscriptionAmount": 50000,
    "paymentStatus": "paid",
    "accountStatus": "active",
    "dueDate": "2025-04-15T00:00:00Z",
    "paymentDate": "2025-03-15T10:30:00Z",
    "createdAt": "2024-01-01T08:00:00Z"
  },
  {
    "id": 2,
    "agencyId": 6,
    "companyId": 6,
    "agencyName": "XYZ Properties",
    "email": "info@xyzproperties.com",
    "amount": 75000,
    "subscriptionAmount": 75000,
    "paymentStatus": "pending",
    "accountStatus": "active",
    "dueDate": "2025-05-15T00:00:00Z",
    "paymentDate": null,
    "createdAt": "2024-02-01T08:00:00Z"
  }
]
```

**Field Descriptions**:
- `id`: Unique subscription/transaction ID
- `agencyId` or `companyId`: Reference to the company/agency
- `agencyName`: Name of the agency (can be derived from company if needed)
- `email`: Contact email for the agency
- `amount` or `subscriptionAmount`: Payment amount in CFA
- `paymentStatus`: One of "paid", "pending", "deactivated", "approved"
- `accountStatus`: One of "active", "inactive", "deactivated"
- `dueDate`: When payment is due (ISO date string)
- `paymentDate`: When payment was made (ISO date string, null if not paid)
- `createdAt`: When subscription was created (ISO date string)

**Usage**:
- Used in the **Overview** page to display agency subscriptions table
- Used in the **Transaction History** page to filter by payment status (All/Paid/Pending/Deactivated)
- Falls back to companies list if API is not available (graceful degradation)

## Existing APIs (Already Working)

✅ `GET /api/superadmin/agency-stats` - Overview statistics
✅ `GET /api/superadmin/companies` - List of agencies/companies
✅ `GET /api/superadmin/agency-admins` - List of agency directors/admins
✅ `GET /api/superadmin/financial` - Financial overview
✅ `GET /api/superadmin/advertisements` - List advertisements
✅ `POST /api/superadmin/advertisements` - Create advertisement
✅ `GET /api/superadmin/chat/{adminId}/messages` - Get chat messages
✅ `POST /api/superadmin/chat/messages` - Send chat message

## Notes

- The dashboard will gracefully handle the missing API by falling back to the companies list
- All French text has been translated to English
- All data fetching is now properly connected to backend APIs
- The subscription data should ideally include payment history with status tracking

