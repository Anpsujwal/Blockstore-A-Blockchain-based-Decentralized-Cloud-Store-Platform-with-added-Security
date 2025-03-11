
import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from './Web3Context';
import CryptoUtils from './CryptoUtils';
import './App.css';

const RetrievePage = () => {
  const { account, connected, connectWallet, getFiles, getSharedFiles, getEncryptionKey, deleteFile } = useContext(Web3Context);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('myFiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewing, setViewing] = useState(false);
  const [viewError, setViewError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      if (connected) {
        setLoading(true);
        try {
          const myFiles = await getFiles();
          const filesSharedWithMe = await getSharedFiles();
          
          setFiles(myFiles);
          setSharedFiles(filesSharedWithMe);
        } catch (error) {
          console.error("Error fetching files:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadFiles();
  }, [connected, getFiles, getSharedFiles]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const filterFiles = (files) => {
    if (!searchTerm) return files;
    
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const viewFile = async (file) => {
    setViewing(true);
    setSelectedFile(file);
    
    try {
      // Get the encrypted key for this file
      const encryptedKey = getEncryptionKey(file.id);
      if (!encryptedKey) {
        throw new Error("Encryption key not found for this file");
      }
      
      // Fetch the encrypted data from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${file.hash}`);
      const encryptedData = await response.text();
      
      // Decrypt the file
      const decryptedData = await CryptoUtils.decryptFile(encryptedData, encryptedKey, account);
      
      // For viewable file types, open them in a new tab
      const dataUrlParts = decryptedData.split(',');
      const mimeType = dataUrlParts[0].match(/:(.*?);/)[1];
      
      // Create a blob and URL for viewing
      const binaryString = atob(dataUrlParts[1]);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error("Error viewing file:", error);
      setViewError(`Error viewing file: ${error.message}`);
    } finally {
      setTimeout(() => {
        setViewing(false);
        setSelectedFile(null);
      }, 3000);
    }
  };

  const downloadFile = async (file, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the viewFile function
    }
    
    setDownloading(true);
    
    try {
      // Get the encrypted key for this file
      const encryptedKey = getEncryptionKey(file.id);
      if (!encryptedKey) {
        throw new Error("Encryption key not found for this file");
      }
      
      // Fetch the encrypted data from IPFS
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${file.hash}`);
      const encryptedData = await response.text();
      
      // Decrypt the file
      const decryptedData = await CryptoUtils.decryptFile(encryptedData, encryptedKey, account);
      
      // Convert the decrypted data to a Blob
      const dataUrlParts = decryptedData.split(',');
      const mimeType = dataUrlParts[0].match(/:(.*?);/)[1];
      const binaryString = atob(dataUrlParts[1]);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      setViewError(`Error downloading file: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (file, e) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering the viewFile function
    }
    
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await deleteFile(file.id);
        // Update the file list
        setFiles(prevFiles => prevFiles.filter(f => f.id !== file.id));
      } catch (error) {
        console.error("Error deleting file:", error);
        setViewError(`Error deleting file: ${error.message}`);
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('text/')) return '📄';
    if (fileType === 'application/pdf') return '📑';
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    return '📁';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      console.log("Original timestamp:", timestamp);
      
      // Handle different timestamp formats
      let dateObj;
      
      // Try parsing as a number first
      const numericTimestamp = Number(timestamp);
      
      // Check if timestamp is in seconds (blockchain standard) or milliseconds
      if (numericTimestamp > 0) {
        // If timestamp is in seconds (typical for blockchain)
        if (numericTimestamp < 10000000000) {
          dateObj = new Date(numericTimestamp * 1000);
        } else {
          // If timestamp is already in milliseconds
          dateObj = new Date(numericTimestamp);
        }
      } else {
        // If it's not a valid number, try directly creating a date
        dateObj = new Date(timestamp);
      }
      
      console.log("Date object:", dateObj);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    } catch (error) {
      console.error("Error formatting date:", error, "for timestamp:", timestamp);
      return String(timestamp);
    }
  };

  return (
    <div className="retrieve-page">
      <h1>Retrieve Files</h1>
      <p className="page-description">
        Access and manage your encrypted files stored on the decentralized network.
      </p>
      
      {!connected ? (
        <div className="connect-wallet">
          <p>Connect your wallet to access your files</p>
          <button onClick={handleConnect} className="connect-button">Connect Wallet</button>
        </div>
      ) : (
        <div className="file-management">
          <div className="file-controls">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'myFiles' ? 'active' : ''}`}
                onClick={() => setActiveTab('myFiles')}
              >
                My Files
              </button>
              <button 
                className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
                onClick={() => setActiveTab('shared')}
              >
                Shared With Me
              </button>
            </div>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="loading">
              <p>Loading your files...</p>
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="files-container">
              {activeTab === 'myFiles' ? (
                filterFiles(files).length > 0 ? (
                  <div className="files-grid">
                    {filterFiles(files).map(file => (
                      <div key={file.id} className="file-card" onClick={() => viewFile(file)}>
                        <div className="file-icon">{getFileIcon(file.type)}</div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <p className="file-meta">
                            <span className="file-size">{formatSize(parseInt(file.size))}</span>
                            <span className="file-date">{formatDate(file.uploadTime)}</span>
                          </p>
                        </div>
                        <div className="file-actions">
                          <button 
                            className="download-button" 
                            onClick={(e) => downloadFile(file, e)}
                            title="Download file"
                          >
                            ⬇️
                          </button>
                          <button 
                            className="delete-button" 
                            onClick={(e) => handleDelete(file, e)}
                            title="Delete file"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">
                    <p>No files found. Upload some files to get started!</p>
                  </div>
                )
              ) : (
                filterFiles(sharedFiles).length > 0 ? (
                  <div className="files-grid">
                    {filterFiles(sharedFiles).map(file => (
                      <div key={file.id} className="file-card shared" onClick={() => viewFile(file)}>
                        <div className="file-icon">{getFileIcon(file.type)}</div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <p className="file-meta">
                            <span className="file-size">{formatSize(parseInt(file.size))}</span>
                            <span className="file-date">{formatDate(file.uploadTime)}</span>
                          </p>
                          <p className="file-owner">Shared by: {file.owner.substring(0, 6)}...{file.owner.substring(file.owner.length - 4)}</p>
                        </div>
                        <div className="file-actions">
                          <button 
                            className="download-button" 
                            onClick={(e) => downloadFile(file, e)}
                            title="Download file"
                          >
                            ⬇️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-files">
                    <p>No files have been shared with you yet.</p>
                  </div>
                )
              )}
            </div>
          )}
          
          {viewing && (
            <div className="file-viewer">
              <p>Opening file: {selectedFile?.name}</p>
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {downloading && (
            <div className="file-viewer">
              <p>Downloading file: {selectedFile?.name}</p>
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {viewError && (
            <div className="view-error">
              <p>{viewError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetrievePage;