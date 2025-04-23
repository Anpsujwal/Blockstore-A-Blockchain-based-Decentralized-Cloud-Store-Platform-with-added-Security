import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from './Web3Context';
import './App.css';

const RetrievePage = () => {
  const { 
    account, 
    connected, 
    connectWallet, 
    getFiles, 
    getSharedFiles, 
    deleteFile 
  } = useContext(Web3Context);
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
          setFiles(myFiles || []);
          setSharedFiles(filesSharedWithMe || []);
        } catch (error) {
          console.error("Error fetching files:", error);
          setViewError('Failed to load files: ' + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setFiles([]);
        setSharedFiles([]);
        setLoading(false);
      }
    };
    loadFiles();
  }, [connected, getFiles, getSharedFiles]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const filterFiles = (filesList) => {
    if (!searchTerm) return filesList;
    return filesList.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const viewFile = async (file) => {
    setViewing(true);
    setSelectedFile(file);
    setViewError('');
    
    try {
      const url = `https://gateway.pinata.cloud/ipfs/${file.hash}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error viewing file:", error);
      setViewError(`Error viewing file: ${error.message}`);
    } finally {
      setTimeout(() => { setViewing(false); setSelectedFile(null); }, 3000);
    }
  };

  const downloadFile = async (file, e) => {
    if (e) e.stopPropagation();
    setDownloading(true);
    setSelectedFile(file);
    setViewError('');
    
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${file.hash}`);
      if (!response.ok) throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(link); }, 100);
    } catch (error) {
      console.error("Error downloading file:", error);
      setViewError(`Error downloading file: ${error.message}`);
    } finally {
      setDownloading(false);
      setSelectedFile(null);
    }
  };

  const handleDelete = async (file, e) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await deleteFile(file.id);
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
    const numBytes = parseInt(bytes, 10);
    if (isNaN(numBytes)) return 'Unknown';
    if (numBytes < 1024) return numBytes + ' B';
    if (numBytes < 1024 * 1024) return (numBytes / 1024).toFixed(2) + ' KB';
    if (numBytes < 1024 * 1024 * 1024) return (numBytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (numBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      let dateObj;
      const numericTimestamp = Number(timestamp);
      if (numericTimestamp > 0) {
        if (numericTimestamp < 10000000000) dateObj = new Date(numericTimestamp * 1000);
        else dateObj = new Date(numericTimestamp);
      } else {
        dateObj = new Date(timestamp);
      }
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
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
        Access and manage your files stored on the decentralized network.
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
                My Files ({files.length})
              </button>
              <button 
                className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
                onClick={() => setActiveTab('shared')}
              >
                Shared With Me ({sharedFiles.length})
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
                      <div 
                        key={file.id} 
                        className="file-card" 
                        onClick={() => viewFile(file)}
                      >
                        <div className="file-icon">{getFileIcon(file.type)}</div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <p className="file-meta">
                            <span className="file-size">{formatSize(file.size)}</span>
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
                      <div 
                        key={file.id} 
                        className="file-card shared" 
                        onClick={() => viewFile(file)}
                      >
                        <div className="file-icon">{getFileIcon(file.type)}</div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <p className="file-meta">
                            <span className="file-size">{formatSize(file.size)}</span>
                            <span className="file-date">{formatDate(file.uploadTime)}</span>
                          </p>
                          <p className="file-owner">
                            Shared by: {file.owner.substring(0, 6)}...{file.owner.substring(file.owner.length - 4)}
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
              <button onClick={() => setViewError('')} className="close-error">×</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetrievePage;