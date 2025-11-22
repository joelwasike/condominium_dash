# CORS Configuration Guide

## Problem
The frontend at `https://saafimmo.theliberec.com` is being blocked from making requests to the API at `https://saafimmo-api.theliberec.com` due to CORS (Cross-Origin Resource Sharing) policy.

## Error Message
```
Access to fetch at 'https://saafimmo-api.theliberec.com/api/...' from origin 'https://saafimmo.theliberec.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution (Backend Configuration Required)

The backend API server needs to be configured to allow requests from the frontend origin. This must be done on the **backend server**, not in the frontend code.

### Required CORS Headers

The backend must send the following HTTP headers in response to all API requests:

1. **Access-Control-Allow-Origin**: `https://saafimmo.theliberec.com`
   - Or use `*` to allow all origins (less secure, not recommended for production)

2. **Access-Control-Allow-Methods**: `GET, POST, PUT, DELETE, PATCH, OPTIONS`

3. **Access-Control-Allow-Headers**: `Content-Type, Authorization, X-Requested-With`

4. **Access-Control-Allow-Credentials**: `true` (if using cookies/auth tokens)

5. **Access-Control-Max-Age**: `3600` (optional, for preflight caching)

### Example Backend Configuration

#### For Go (Gin Framework)
```go
func setupCORS() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "https://saafimmo.theliberec.com")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    }
}

// In your router setup:
router.Use(setupCORS())
```

#### For Express.js (Node.js)
```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://saafimmo.theliberec.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

#### For Nginx (Reverse Proxy)
```nginx
location /api {
    add_header 'Access-Control-Allow-Origin' 'https://saafimmo.theliberec.com' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://backend;
}
```

### Preflight Requests

The browser will send an OPTIONS request (preflight) before certain requests. The backend must:
1. Respond to OPTIONS requests with the appropriate CORS headers
2. Return a 204 (No Content) status for OPTIONS requests
3. Not require authentication for OPTIONS requests

### Testing CORS Configuration

After configuring CORS on the backend, test with:

```bash
curl -H "Origin: https://saafimmo.theliberec.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://saafimmo-api.theliberec.com/api/superadmin/advertisements \
     -v
```

You should see the CORS headers in the response.

## Frontend Configuration

The frontend is already configured correctly:
- Base URL: `https://saafimmo-api.theliberec.com`
- All requests include proper headers (Authorization, Content-Type)
- Error handling is in place

## Important Notes

1. **CORS cannot be fixed from the frontend** - it's a browser security feature enforced by the server
2. **Both origins must use HTTPS** in production (which they do)
3. **Credentials (cookies/tokens) require explicit CORS configuration** with `Access-Control-Allow-Credentials: true`
4. **Wildcard (`*`) cannot be used with credentials** - you must specify the exact origin

## Contact

If you need help configuring CORS on the backend, contact your backend developer or server administrator.

