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
