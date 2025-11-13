// Cloudinary Configuration
// Replace these with your actual Cloudinary credentials

export const CLOUDINARY_CONFIG = {
  // Your Cloudinary cloud name (found in your Cloudinary dashboard)
  cloudName: 'dcrdv2jcz',
  
  // Your upload preset (create one in Cloudinary dashboard with unsigned uploads enabled)
  uploadPreset: 'real-estate-uploads',
  
  // Your API key (found in your Cloudinary dashboard)
  apiKey: '781537668289137',
  
  // Your API secret (found in your Cloudinary dashboard)
  apiSecret: '0pwGloCz0wgOE_W2aORNsB-KF2g',
  
  // Default folder for uploads
  defaultFolder: 'real-estate-documents',
  
  // Allowed file types
  allowedFileTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  
  // Maximum file size in MB
  maxFileSizeMB: 10,
  
  // Image transformation settings
  imageTransformations: {
    quality: 'auto',
    format: 'auto',
    width: 1200,
    height: 1200,
    crop: 'limit'
  }
};

// Helper function to get Cloudinary URL with transformations
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  return transformString 
    ? `${baseUrl}/${transformString}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

// Helper function to validate Cloudinary configuration
export const validateCloudinaryConfig = () => {
  const required = ['cloudName', 'uploadPreset', 'apiKey'];
  const missing = required.filter(key => !CLOUDINARY_CONFIG[key] || CLOUDINARY_CONFIG[key] === 'your-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
  
  if (missing.length > 0) {
    console.warn('Cloudinary configuration incomplete. Missing:', missing);
    return false;
  }
  
  return true;
};
