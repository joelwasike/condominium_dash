import { CLOUDINARY_CONFIG, validateCloudinaryConfig } from '../config/cloudinary';

// Cloudinary Upload Service
export const cloudinaryService = {
  // Upload file to Cloudinary
  uploadFile: async (file, folder = CLOUDINARY_CONFIG.defaultFolder) => {
    // Validate configuration
    if (!validateCloudinaryConfig()) {
      return {
        success: false,
        error: 'Cloudinary configuration is incomplete. Please check your credentials.',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', folder);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        uploadedAt: result.created_at,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async (files, folder = CLOUDINARY_CONFIG.defaultFolder) => {
    const uploadPromises = files.map(file => 
      cloudinaryService.uploadFile(file, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    return results;
  },

  // Delete file from Cloudinary
  deleteFile: async (publicId) => {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            api_key: CLOUDINARY_CONFIG.apiKey,
            timestamp: Math.round(new Date().getTime() / 1000),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: result.result === 'ok',
        message: result.result,
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Helper function to validate file types
export const validateFileType = (file, allowedTypes = CLOUDINARY_CONFIG.allowedFileTypes) => {
  return allowedTypes.includes(file.type);
};

// Helper function to validate file size
export const validateFileSize = (file, maxSizeMB = CLOUDINARY_CONFIG.maxFileSizeMB) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
