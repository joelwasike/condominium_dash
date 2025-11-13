# Cloudinary Integration Setup

## Overview
The Sales Manager Dashboard now includes Cloudinary integration for document uploads. Documents are uploaded to Cloudinary and URLs are returned for storage in the backend.

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Credentials
1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - **Cloud Name**: Found at the top of the dashboard
   - **API Key**: Found in the "Account Details" section
   - **API Secret**: Found in the "Account Details" section

### 3. Create Upload Preset
1. In your Cloudinary dashboard, go to "Settings" → "Upload"
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure the preset:
   - **Preset name**: `real-estate-uploads` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (important for frontend uploads)
   - **Folder**: `real-estate-documents` (optional)
   - **Resource Type**: `Auto`
   - **Access Mode**: `Public`
5. Save the preset

### 4. Configure the Application
Edit `src/config/cloudinary.js` and replace the placeholder values:

```javascript
export const CLOUDINARY_CONFIG = {
  cloudName: 'your-actual-cloud-name',
  uploadPreset: 'your-actual-upload-preset-name',
  apiKey: 'your-actual-api-key',
  apiSecret: 'your-actual-api-secret',
  // ... rest of config
};
```

### 5. Test the Integration
1. Start the backend: `cd backend && go run ./cmd/server`
2. Start the frontend: `cd real-estate-dash && npm start`
3. Go to Sales Manager Dashboard
4. Try creating a new client and uploading documents

## Features

### Document Upload
- **KYC Documents**: Identity verification documents
- **Contract Documents**: Lease agreements and contracts
- **File Validation**: Type and size validation
- **Progress Feedback**: Loading states and success/error messages

### Supported File Types
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX
- Maximum file size: 10MB (configurable)

### Document Management
- **View Documents**: Click "View Document" to open in new tab
- **File Information**: Shows file size and upload date
- **Remove Documents**: Delete uploaded documents before finalizing

## Backend Integration

### Document URLs
When documents are uploaded, the following information is available:
```javascript
{
  type: 'KYC' | 'Contract',
  name: 'document-name.pdf',
  url: 'https://res.cloudinary.com/...',
  publicId: 'real-estate-documents/...',
  size: 1024000, // bytes
  uploadedAt: '2024-01-01T00:00:00Z',
  details: { /* contract details if applicable */ }
}
```

### Backend Endpoint (Optional)
You may want to create a backend endpoint to store document URLs:
```go
// Example endpoint to update client with document URLs
PUT /api/salesmanager/clients/:id/documents
{
  "documents": [
    {
      "type": "KYC",
      "url": "https://res.cloudinary.com/...",
      "publicId": "...",
      "size": 1024000,
      "uploadedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Security Considerations

### Upload Preset Security
- Use **unsigned** upload presets for frontend uploads
- Set appropriate **access modes** (public/private)
- Configure **allowed file types** and **size limits**

### API Key Security
- Never expose API secrets in frontend code
- Use environment variables in production
- Consider using signed uploads for sensitive documents

## Troubleshooting

### Common Issues

1. **"Cloudinary configuration is incomplete"**
   - Check that all credentials are properly set in `cloudinary.js`
   - Verify the upload preset name matches exactly

2. **"Upload failed: 401 Unauthorized"**
   - Check your API key and cloud name
   - Ensure the upload preset is set to "unsigned"

3. **"File type not allowed"**
   - Check the `allowedFileTypes` array in the config
   - Verify the file MIME type is supported

4. **"File size too large"**
   - Check the `maxFileSizeMB` setting
   - Consider increasing the limit or compressing files

### Debug Mode
Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('cloudinary-debug', 'true');
```

## Production Deployment

### Environment Variables
For production, consider using environment variables:
```javascript
export const CLOUDINARY_CONFIG = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  apiKey: process.env.REACT_APP_CLOUDINARY_API_KEY,
  // ...
};
```

### CORS Configuration
Ensure your Cloudinary account allows uploads from your domain:
1. Go to Settings → Security
2. Add your domain to "Allowed referrers"
3. Or use wildcard for development: `*`

## Cost Considerations

### Free Tier Limits
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

### Optimization Tips
- Use automatic format and quality optimization
- Implement image resizing for large files
- Consider using Cloudinary's AI features for automatic optimization
