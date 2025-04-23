// services.js - Cloud Service Integrations for SaaS and PaaS

/**
 * This file provides integration with various free cloud services
 * for storage, computing, and other functionalities.
 */

// API keys and configuration
// In production, these should be environment variables
const CONFIG = {
    // Free tier storage services
    STORAGE: {
      FILEBASE: {
        api_key: process.env.REACT_APP_FILEBASE_API_KEY || 'your_filebase_api_key',
        endpoint: 'https://api.filebase.io/v1',
      },
      STORJ: {
        api_key: process.env.REACT_APP_STORJ_API_KEY || 'your_storj_api_key',
        endpoint: 'https://api.storj.io',
      },
      PINATA: {
        api_key: process.env.REACT_APP_PINATA_API_KEY || 'your_pinata_api_key',
        api_secret: process.env.REACT_APP_PINATA_API_SECRET || 'your_pinata_secret',
        endpoint: 'https://api.pinata.cloud',
      },
    },
    // Free tier computing services
    COMPUTING: {
      VERCEL: {
        api_key: process.env.REACT_APP_VERCEL_API_KEY || 'your_vercel_api_key',
        endpoint: 'https://api.vercel.com',
      },
      NETLIFY: {
        api_key: process.env.REACT_APP_NETLIFY_API_KEY || 'your_netlify_api_key',
        endpoint: 'https://api.netlify.com',
      },
    },
    // Free tier database services
    DATABASE: {
      FIREBASE: {
        config: {
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        }
      },
      SUPABASE: {
        url: process.env.REACT_APP_SUPABASE_URL,
        key: process.env.REACT_APP_SUPABASE_KEY,
      },
    }
  };
  
  // ---------- STORAGE SERVICES (SaaS) ----------
  
  /**
   * Upload a file to Filebase (IPFS/S3 compatible storage)
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} - Response with IPFS hash and URL
   */
  export const uploadToFilebase = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch(`${CONFIG.STORAGE.FILEBASE.endpoint}/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.STORAGE.FILEBASE.api_key}`,
        },
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload to Filebase');
      }
      
      return {
        success: true,
        hash: data.cid,
        url: `https://ipfs.filebase.io/ipfs/${data.cid}`,
        provider: 'Filebase'
      };
    } catch (error) {
      console.error('Filebase upload error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Filebase'
      };
    }
  };
  
  /**
   * Upload a file to Pinata (IPFS pinning service)
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} - Response with IPFS hash and URL
   */
  export const uploadToPinata = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch(`${CONFIG.STORAGE.PINATA.endpoint}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': CONFIG.STORAGE.PINATA.api_key,
          'pinata_secret_api_key': CONFIG.STORAGE.PINATA.api_secret,
        },
        body: formData,
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to Pinata');
      }
      
      return {
        success: true,
        hash: data.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
        provider: 'Pinata'
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Pinata'
      };
    }
  };
  
  // ---------- DATABASE SERVICES (PaaS) ----------
  
  /**
   * Initialize Firebase connection
   * @returns {Object} - Firebase app instance
   */
  export const initFirebase = async () => {
    try {
      // Dynamic import to reduce bundle size if not used
      const { initializeApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      
      const app = initializeApp(CONFIG.DATABASE.FIREBASE.config);
      const db = getFirestore(app);
      
      return {
        success: true,
        app,
        db,
        provider: 'Firebase'
      };
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Firebase'
      };
    }
  };
  
  /**
   * Initialize Supabase connection
   * @returns {Object} - Supabase client
   */
  export const initSupabase = async () => {
    try {
      // Dynamic import to reduce bundle size if not used
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        CONFIG.DATABASE.SUPABASE.url,
        CONFIG.DATABASE.SUPABASE.key
      );
      
      return {
        success: true,
        client: supabase,
        provider: 'Supabase'
      };
    } catch (error) {
      console.error('Supabase initialization error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Supabase'
      };
    }
  };
  
  // ---------- HYBRID STORAGE MANAGER ----------
  
  /**
   * Smart file storage service that tries multiple providers
   * @param {File} file - The file to upload
   * @param {Array<string>} preferredProviders - Ordered list of preferred providers
   * @returns {Promise<Object>} - Upload result from first successful provider
   */
  export const smartUploadFile = async (file, preferredProviders = ['pinata', 'filebase']) => {
    const providers = {
      'pinata': uploadToPinata,
      'filebase': uploadToFilebase,
    };
    
    // Try providers in order of preference
    for (const provider of preferredProviders) {
      if (providers[provider]) {
        const result = await providers[provider](file);
        if (result.success) {
          return result;
        }
        // If this provider failed, log and try next one
        console.warn(`Provider ${provider} failed, trying next...`);
      }
    }
    
    // If all providers failed
    return {
      success: false,
      error: 'All storage providers failed',
      providers: preferredProviders
    };
  };
  
  // ---------- USAGE TRACKING ----------
  
  /**
   * Track usage of cloud services for analytics or quota management
   * @param {string} service - Service name
   * @param {string} operation - Operation performed
   * @param {Object} metadata - Additional data about the operation
   */
  export const trackUsage = async (service, operation, metadata = {}) => {
    // In a real app, this could send data to your backend or analytics service
    console.log(`USAGE: ${service} - ${operation}`, metadata);
    
    // You could also store this in localStorage for user reference
    try {
      const usage = JSON.parse(localStorage.getItem('cloud_usage') || '{}');
      const serviceUsage = usage[service] || {};
      const operationCount = serviceUsage[operation] || 0;
      
      // Update counts
      serviceUsage[operation] = operationCount + 1;
      usage[service] = serviceUsage;
      
      // Save back to localStorage
      localStorage.setItem('cloud_usage', JSON.stringify(usage));
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };
  
  // Export a default object with all services
  export default {
    storage: {
      uploadToFilebase,
      uploadToPinata,
      smartUploadFile,
    },
    database: {
      initFirebase,
      initSupabase,
    },
    trackUsage,
  };