import { API_CONFIG } from '../config/api';

const PROFILE_BASE_URL = `${API_CONFIG.BASE_URL}/api/profile`;

const getAuthHeaders = (includeContentType = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    const tokenStr = String(token).trim();
    
    // Sanitize token to ensure it only contains ISO-8859-1 compatible characters
    // This MUST be done before adding to headers, as fetch validates headers
    // Remove any characters outside the printable ASCII range (32-126)
    // This preserves common token characters: A-Z, a-z, 0-9, +, /, =, -, _, .
    const sanitizedToken = tokenStr
      .split('')
      .map(char => {
        const code = char.charCodeAt(0);
        // Only allow printable ASCII (32-126) which is ISO-8859-1 compatible
        return (code >= 32 && code <= 126) ? char : '';
      })
      .join('');
    
    // Debug: Check if sanitization removed any characters
    if (tokenStr.length !== sanitizedToken.length) {
      console.warn(`Token sanitization removed ${tokenStr.length - sanitizedToken.length} characters`);
      console.warn('Original token length:', tokenStr.length, 'Sanitized:', sanitizedToken.length);
    }
    
    if (sanitizedToken && sanitizedToken.length > 0) {
      headers['Authorization'] = sanitizedToken;
    } else {
      console.error('Token was empty after sanitization - this will cause authentication to fail');
    }
  }
  
  return headers;
};

export const profileService = {
  // Get current user's profile (uses token to identify user)
  getProfile: async () => {
    try {
      const headers = getAuthHeaders(false);
      
      // Debug: Log token info to diagnose authentication issues
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Original token length:', token.length);
        console.log('Original token preview:', token.substring(0, 50) + (token.length > 50 ? '...' : ''));
        
        // Check what sanitization would do
        const sanitized = token
          .split('')
          .map(char => {
            const code = char.charCodeAt(0);
            return (code >= 32 && code <= 126) ? char : '';
          })
          .join('');
        
        if (token.length !== sanitized.length) {
          console.warn('⚠️ Token sanitization would remove', token.length - sanitized.length, 'characters');
          console.warn('Sanitized token preview:', sanitized.substring(0, 50) + (sanitized.length > 50 ? '...' : ''));
        } else {
          console.log('✓ Token is ASCII-safe, no sanitization needed');
        }
      } else {
        console.warn('No token found in localStorage');
      }
      
      // Log what we're actually sending
      console.log('Request headers:', JSON.stringify(headers, null, 2));
      console.log('Authorization header value length:', headers['Authorization']?.length || 0);
      console.log('Authorization header preview:', headers['Authorization']?.substring(0, 50) || 'none');
      
      const response = await fetch(PROFILE_BASE_URL, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  },

  // Get profile by ID
  getProfileById: async (userId) => {
    const response = await fetch(`${PROFILE_BASE_URL}/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(false)
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  // Update profile (uses token to identify user)
  updateProfile: async (profileData) => {
    const response = await fetch(PROFILE_BASE_URL, {
      method: 'PUT',
      headers: getAuthHeaders(true),
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Change password (uses token to identify user)
  changePassword: async (passwordData) => {
    const response = await fetch(`${PROFILE_BASE_URL}/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(passwordData)
    });
    if (!response.ok) throw new Error('Failed to change password');
    return response.json();
  },

  // Upload profile picture (uses token to identify user)
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      const tokenStr = String(token).trim();
      const sanitizedToken = tokenStr
        .split('')
        .map(char => {
          const code = char.charCodeAt(0);
          return (code >= 32 && code <= 126) ? char : '';
        })
        .join('');
      
      if (sanitizedToken && sanitizedToken.length > 0) {
        headers['Authorization'] = sanitizedToken;
      }
    }

    const response = await fetch(`${PROFILE_BASE_URL}/picture`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to upload profile picture');
    }
    
    return response.json();
  }
};

