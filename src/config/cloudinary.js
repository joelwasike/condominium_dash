
export const CLOUDINARY_CONFIG = {
  cloudName: 'dcrdv2jcz',
  uploadPreset: 'real-estate-uploads',
  apiKey: '781537668289137',
  apiSecret: '0pwGloCz0wgOE_W2aORNsB-KF2g',
  defaultFolder: 'real-estate-documents',
  allowedFileTypes: [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],

  maxFileSizeMB: 10,
  imageTransformations: {
    quality: 'auto',
    format: 'auto',
    width: 1200,
    height: 1200,
    crop: 'limit'
  }
};
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const transformString = Object.entries(transformations).
  map(([key, value]) => `${key}_${value}`).
  join(',');

  return transformString ?
  `${baseUrl}/${transformString}/${publicId}` :
  `${baseUrl}/${publicId}`;
};
export const validateCloudinaryConfig = () => {
  const required = ['cloudName', 'uploadPreset', 'apiKey'];
  const missing = required.filter((key) => !CLOUDINARY_CONFIG[key] || CLOUDINARY_CONFIG[key] === 'your-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());

  if (missing.length > 0) {
    console.warn('Cloudinary configuration incomplete. Missing:', missing);
    return false;
  }

  return true;
};
