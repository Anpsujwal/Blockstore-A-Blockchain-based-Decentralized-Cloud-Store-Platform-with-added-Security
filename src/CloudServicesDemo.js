import React, { useState, useEffect } from 'react';
import cloudServices from './services/services';
import './App.css'; // You'll need to create this CSS file

const CloudServicesDemo = () => {
  // State for tracking available providers
  const [availableProviders, setAvailableProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('smart');
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Usage statistics
  const [usageStats, setUsageStats] = useState({});
  
  // Database connection states
  const [dbConnection, setDbConnection] = useState(null);
  const [dbType, setDbType] = useState('none');

  useEffect(() => {
    // Test which cloud providers are available
    const testProviders = async () => {
      setIsLoading(true);
      try {
        const testFile = new File(['test data'], 'test.txt', { type: 'text/plain' });
        const providers = [];
        
        // Test Pinata
        try {
          const pinataResult = await cloudServices.storage.uploadToPinata(testFile);
          if (pinataResult.success) {
            providers.push({
              id: 'pinata',
              name: 'Pinata IPFS',
              type: 'storage',
              status: 'available'
            });
          }
        } catch (err) {
          providers.push({
            id: 'pinata',
            name: 'Pinata IPFS',
            type: 'storage',
            status: 'unavailable',
            error: err.message
          });
        }
        
        // Test Filebase
        try {
          const filebaseResult = await cloudServices.storage.uploadToFilebase(testFile);
          if (filebaseResult.success) {
            providers.push({
              id: 'filebase',
              name: 'Filebase',
              type: 'storage',
              status: 'available'
            });
          }
        } catch (err) {
          providers.push({
            id: 'filebase',
            name: 'Filebase',
            type: 'storage',
            status: 'unavailable',
            error: err.message
          });
        }
        
        // Test Firebase (just initialization)
        try {
          const firebaseResult = await cloudServices.database.initFirebase();
          if (firebaseResult.success) {
            providers.push({
              id: 'firebase',
              name: 'Firebase',
              type: 'database',
              status: 'available'
            });
          }
        } catch (err) {
          providers.push({
            id: 'firebase',
            name: 'Firebase',
            type: 'database',
            status: 'unavailable',
            error: err.message
          });
        }
        
        // Test Supabase (just initialization)
        try {
          const supabaseResult = await cloudServices.database.initSupabase();
          if (supabaseResult.success) {
            providers.push({
              id: 'supabase',
              name: 'Supabase',
              type: 'database',
              status: 'available'
            });
          }
        } catch (err) {
          providers.push({
            id: 'supabase',
            name: 'Supabase',
            type: 'database',
            status: 'unavailable',
            error: err.message
          });
        }
        
        setAvailableProviders(providers);
        
        // Load usage statistics from localStorage
        try {
          const usageData = JSON.parse(localStorage.getItem('cloud_usage') || '{}');
          setUsageStats(usageData);
        } catch (error) {
          console.error('Error loading usage stats:', error);
        }
      } catch (error) {
        console.error('Error testing providers:', error);
      }
      setIsLoading(false);
    };
    
    testProviders();
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadResult(null); // Clear previous results
  };
  
  // Handle provider selection
  const handleProviderChange = (event) => {
    setSelectedProvider(event.target.value);
  };
  
  // Handle database provider selection
  const handleDbProviderChange = (event) => {
    setDbType(event.target.value);
    setDbConnection(null); // Reset connection when changing provider
  };
  
  // Connect to selected database
  const connectToDatabase = async () => {
    if (dbType === 'none') return;
    
    try {
      let result;
      if (dbType === 'firebase') {
        result = await cloudServices.database.initFirebase();
      } else if (dbType === 'supabase') {
        result = await cloudServices.database.initSupabase();
      }
      
      setDbConnection(result);
      
      // Track database connection
      cloudServices.trackUsage('database', 'connect', { provider: dbType });
      
      // Refresh usage stats
      const usageData = JSON.parse(localStorage.getItem('cloud_usage') || '{}');
      setUsageStats(usageData);
    } catch (error) {
      console.error(`Error connecting to ${dbType}:`, error);
      setDbConnection({
        success: false,
        error: error.message,
        provider: dbType
      });
    }
  };
  
  // Upload file to selected provider
  const uploadFile = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      let result;
      
      switch (selectedProvider) {
        case 'pinata':
          result = await cloudServices.storage.uploadToPinata(selectedFile);
          break;
        case 'filebase':
          result = await cloudServices.storage.uploadToFilebase(selectedFile);
          break;
        case 'smart':
        default:
          // Get available storage providers
          const availableStorage = availableProviders
            .filter(p => p.type === 'storage' && p.status === 'available')
            .map(p => p.id);
          
          result = await cloudServices.storage.smartUploadFile(
            selectedFile,
            availableStorage
          );
          break;
      }
      
      // Track upload usage
      cloudServices.trackUsage('storage', 'upload', {
        provider: result.provider || selectedProvider,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        fileName: selectedFile.name
      });
      
      setUploadResult(result);
      
      // Refresh usage stats
      const usageData = JSON.parse(localStorage.getItem('cloud_usage') || '{}');
      setUsageStats(usageData);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        error: error.message,
        provider: selectedProvider
      });
    }
    
    setIsUploading(false);
  };
  
  // Clear all usage statistics
  const clearUsageStats = () => {
    localStorage.removeItem('cloud_usage');
    setUsageStats({});
  };

  return (
    <div className="cloud-services-demo">
      <h1>Cloud Services</h1>
      
      {isLoading ? (
        <div className="loading-section">
          <p>Detecting available cloud services...</p>
          <div className="loader"></div>
        </div>
      ) : (
        <div className="demo-content">
          {/* Available Providers Section */}
          <div className="providers-section card">
            <h2>Available Cloud Providers</h2>
            {availableProviders.length > 0 ? (
              <div className="providers-list">
                {availableProviders.map(provider => (
                  <div 
                    key={provider.id} 
                    className={`provider-item ${provider.status}`}
                  >
                    <div className="provider-info">
                      <span className="provider-name">{provider.name}</span>
                      <span className="provider-type">{provider.type}</span>
                      <span className={`provider-status ${provider.status}`}>
                        {provider.status === 'available' ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>
                    {provider.error && (
                      <div className="provider-error">
                        Error: {provider.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No cloud providers detected. Check your API keys and network connection.</p>
            )}
          </div>
          
          {/* File Upload Section */}
          <div className="upload-section card">
            <h2>Test File Upload</h2>
            <div className="upload-controls">
              <div className="file-selection">
                <label htmlFor="file-input">Select File:</label>
                <input 
                  type="file" 
                  id="file-input" 
                  onChange={handleFileChange} 
                />
              </div>
              
              <div className="provider-selection">
                <label htmlFor="provider-select">Storage Provider:</label>
                <select 
                  id="provider-select" 
                  value={selectedProvider}
                  onChange={handleProviderChange}
                >
                  <option value="smart">Smart Upload (Auto-select)</option>
                  <option value="pinata">Pinata IPFS</option>
                  <option value="filebase">Filebase</option>
                </select>
              </div>
              
              <button 
                onClick={uploadFile} 
                disabled={!selectedFile || isUploading}
                className="upload-button"
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
            
            {uploadResult && (
              <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
                <h3>Upload Result:</h3>
                {uploadResult.success ? (
                  <div className="success-details">
                    <p>✅ Successfully uploaded via {uploadResult.provider}</p>
                    {uploadResult.hash && (
                      <div className="file-hash">
                        <span>IPFS Hash: {uploadResult.hash}</span>
                      </div>
                    )}
                    {uploadResult.url && (
                      <div className="file-url">
                        <a 
                          href={uploadResult.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View File
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="error-details">
                    <p>❌ Upload failed: {uploadResult.error}</p>
                    <p>Provider: {uploadResult.provider}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Database Connection Section */}
          <div className="database-section card">
            <h2>Database Connections</h2>
            <div className="db-controls">
              <div className="db-selection">
                <label htmlFor="db-select">Database Service:</label>
                <select 
                  id="db-select" 
                  value={dbType} 
                  onChange={handleDbProviderChange}
                >
                  <option value="none">Select a database</option>
                  <option value="firebase">Firebase</option>
                  <option value="supabase">Supabase</option>
                </select>
                
                <button 
                  onClick={connectToDatabase} 
                  disabled={dbType === 'none'}
                  className="connect-button"
                >
                  Connect
                </button>
              </div>
              
              {dbConnection && (
                <div className={`db-result ${dbConnection.success ? 'success' : 'error'}`}>
                  <h3>Connection Result:</h3>
                  {dbConnection.success ? (
                    <p>✅ Successfully connected to {dbConnection.provider}</p>
                  ) : (
                    <p>❌ Connection failed: {dbConnection.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Usage Statistics Section */}
          <div className="usage-section card">
            <h2>Service Usage Statistics</h2>
            {Object.keys(usageStats).length > 0 ? (
              <div className="usage-details">
                {Object.entries(usageStats).map(([service, operations]) => (
                  <div key={service} className="service-usage">
                    <h3>{service.charAt(0).toUpperCase() + service.slice(1)}</h3>
                    <ul>
                      {Object.entries(operations).map(([operation, count]) => (
                        <li key={operation}>
                          {operation}: {count} times
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button 
                  onClick={clearUsageStats}
                  className="clear-stats-button"
                >
                  Clear Statistics
                </button>
              </div>
            ) : (
              <p>No usage data recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudServicesDemo;