// // import React, { useState, useEffect, useContext } from 'react';
// // import { Web3Context } from './Web3Context';
// // import CryptoJS from 'crypto-js';
// // import './App.css';

// // const CryptoFunctions = {
// //   /**
// //    * Derive an encryption key from a wallet address
// //    * @param {string} walletAddress - The wallet address
// //    * @returns {string} - A derived key
// //    */
// //   deriveKeyFromWallet: (walletAddress) => {
    
// //     const salt = "CloudStore_Salt_2025"; 
// //     return CryptoJS.PBKDF2(walletAddress, salt, { keySize: 256/32, iterations: 1000 }).toString();
// //   },
  
// //   /**
// //    * Generate a shared encryption key for a specific file and recipient
// //    * @param {string} encryptedKey - The encrypted file key
// //    * @param {string} recipientAddress - The recipient's wallet address
// //    * @param {string} ownerAddress - The owner's wallet address
// //    * @returns {Promise<string>} - Encrypted file key for the recipient
// //    */
// //   shareEncryptionKey: async (encryptedKey, recipientAddress, ownerAddress) => {
// //     try {

// //       const ownerWalletKey = CryptoFunctions.deriveKeyFromWallet(ownerAddress);
// //       const fileKey = CryptoJS.AES.decrypt(encryptedKey, ownerWalletKey).toString(CryptoJS.enc.Utf8);
      
// //       const recipientWalletKey = CryptoFunctions.deriveKeyFromWallet(recipientAddress);
// //       const sharedEncryptedKey = CryptoJS.AES.encrypt(fileKey, recipientWalletKey).toString();
      
// //       return sharedEncryptedKey;
// //     } catch (error) {
// //       console.error("Encryption error details:", error);
// //       throw new Error("Failed to generate shared key: " + error.message);
// //     }
// //   }
// // };

// // const SharePage = () => {
// //   const { account, connected, connectWallet, getFiles, shareFile } = useContext(Web3Context);
// //   const [files, setFiles] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [selectedFile, setSelectedFile] = useState(null);
// //   const [receiverAddress, setReceiverAddress] = useState('');
// //   const [sharing, setSharing] = useState(false);
// //   const [shareSuccess, setShareSuccess] = useState(false);
// //   const [shareError, setShareError] = useState('');
// //   const [searchTerm, setSearchTerm] = useState('');
// //   const [showShared, setShowShared] = useState(false);
// //   const [encryptionStatus, setEncryptionStatus] = useState('');
// //   const [processingSteps, setProcessingSteps] = useState([]);

// //   useEffect(() => {
// //     const loadFiles = async () => {
// //       if (connected) {
// //         setLoading(true);
// //         try {
// //           const myFiles = await getFiles();
// //           setFiles(myFiles);
// //         } catch (error) {
// //           console.error("Error fetching files:", error);
// //         } finally {
// //           setLoading(false);
// //         }
// //       } else {
// //         setLoading(false);
// //       }
// //     };
    
// //     loadFiles();
// //   }, [connected, getFiles]);

// //   const handleConnect = async () => {
// //     await connectWallet();
// //   };

// //   const filterFiles = () => {
// //     if (!searchTerm) return files;
    
// //     return files.filter(file => 
// //       file.name.toLowerCase().includes(searchTerm.toLowerCase())
// //     );
// //   };

// //   const handleFileSelect = (file) => {
// //     setSelectedFile(file);
// //     setShareSuccess(false);
// //     setShareError('');
// //     setProcessingSteps([]);
// //   };

// //   const handleShare = async (e) => {
// //     e.preventDefault();
// //     setProcessingSteps([]);
    
// //     if (!selectedFile) {
// //       setShareError('Please select a file to share');
// //       return;
// //     }
    
// //     if (!receiverAddress) {
// //       setShareError('Please enter a wallet address to share with');
// //       return;
// //     }
    
// //     if (!receiverAddress.startsWith('0x') || receiverAddress.length !== 42) {
// //       setShareError('Please enter a valid Ethereum wallet address');
// //       return;
// //     }
    
// //     try {
// //       setSharing(true);
// //       setShareError('');

// //       if (!selectedFile.encryptedKey) {
// //         throw new Error("File does not have an encrypted key. It may need to be re-uploaded with encryption enabled.");
// //       }

// //       setEncryptionStatus('Generating shared encryption key...');
// //       setProcessingSteps(prev => [...prev, 'Generating shared encryption key...']);
      
// //       const sharedEncryptedKey = await CryptoFunctions.shareEncryptionKey(
// //         selectedFile.encryptedKey, 
// //         receiverAddress,
// //         account
// //       );
      
// //       setProcessingSteps(prev => [...prev, '✅ Shared encryption key generated']);
    
// //       setEncryptionStatus('Preparing secure key reference...');
// //       setProcessingSteps(prev => [...prev, 'Preparing secure key reference...']);
    
// //       const keyReference = CryptoJS.SHA256(sharedEncryptedKey).toString();
// //       const keyStorageSuccess = await simulateKeyStorage(keyReference, sharedEncryptedKey);
      
// //       if (!keyStorageSuccess) {
// //         throw new Error("Failed to securely store the encryption key. Please try again.");
// //       }
      
// //       setProcessingSteps(prev => [...prev, '✅ Secure key reference created']);
    
// //       setEncryptionStatus('Updating blockchain permissions...');
// //       setProcessingSteps(prev => [...prev, 'Updating blockchain permissions...']);

// //       const result = await shareFile(
// //         selectedFile.id, 
// //         receiverAddress, 
// //         keyReference
// //       );
      
// //       if (!result) {
// //         throw new Error("Blockchain transaction failed. Please try again.");
// //       }
      
// //       setProcessingSteps(prev => [...prev, '✅ Blockchain permissions updated']);
// //       setProcessingSteps(prev => [...prev, '🎉 File shared successfully!']);
      
// //       setShareSuccess(true);
// //       setReceiverAddress('');
// //     } catch (error) {
// //       console.error("Error sharing file:", error);
// //       setShareError('Error: ' + error.message);
// //       setProcessingSteps(prev => [...prev, `❌ Error: ${error.message}`]);
// //     } finally {
// //       setSharing(false);
// //       setEncryptionStatus('');
// //     }
// //   };
// //   const simulateKeyStorage = async (keyReference, encryptedKey) => {
// //     return new Promise((resolve) => {
// //       setTimeout(() => {
// //         console.log(`Key stored: ${keyReference.substring(0, 8)}... => ${encryptedKey.substring(0, 8)}...`);
// //         resolve(true);
// //       }, 500);
// //     });
// //   };

// //   const getFileIcon = (fileType) => {
// //     if (fileType.startsWith('image/')) return '🖼️';
// //     if (fileType.startsWith('video/')) return '🎬';
// //     if (fileType.startsWith('audio/')) return '🎵';
// //     if (fileType.startsWith('text/')) return '📄';
// //     if (fileType === 'application/pdf') return '📑';
// //     if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
// //     if (fileType.includes('word') || fileType.includes('document')) return '📝';
// //     return '📁';
// //   };

// //   const formatSize = (bytes) => {
// //     if (bytes < 1024) return bytes + ' B';
// //     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
// //     if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
// //     return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
// //   };

// //   const isFileEncrypted = (file) => {
// //     return file && file.encryptedKey;
// //   };

// //   return (
// //     <div className="share-page">
// //       <h1>Share Files</h1>
// //       <p className="page-description">
// //         Securely share your files with other users by specifying their wallet address.
// //         Files are encrypted and shared through blockchain-based permission management.
// //       </p>
      
// //       {!connected ? (
// //         <div className="connect-wallet">
// //           <p>Connect your wallet to share your files</p>
// //           <button onClick={handleConnect} className="connect-button">Connect Wallet</button>
// //         </div>
// //       ) : (
// //         <div className="share-container">
// //           <div className="file-selection">
// //             <div className="selection-header">
// //               <h2>Select a File to Share</h2>
// //               <div className="search-container">
// //                 <input
// //                   type="text"
// //                   placeholder="Search files..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="search-input"
// //                 />
// //               </div>
// //             </div>
            
// //             {loading ? (
// //               <div className="loading">
// //                 <p>Loading your files...</p>
// //               </div>
// //             ) : filterFiles().length > 0 ? (
// //               <div className="files-grid">
// //                 {filterFiles().map(file => (
// //                   <div 
// //                     key={file.id} 
// //                     className={`file-card ${selectedFile?.id === file.id ? 'selected' : ''}`}
// //                     onClick={() => handleFileSelect(file)}
// //                   >
// //                     <div className="file-icon">{getFileIcon(file.type)}</div>
// //                     <div className="file-info">
// //                       <h3 className="file-name">{file.name}</h3>
// //                       <p className="file-meta">
// //                         <span className="file-size">{formatSize(file.size)}</span>
// //                         <span className="file-date">{file.uploadTime}</span>
// //                       </p>
// //                       <p className="encryption-status">
// //                         <span 
// //                           className={`encrypted-badge ${isFileEncrypted(file) ? 'encrypted' : 'unencrypted'}`}
// //                           title={isFileEncrypted(file) ? "This file is end-to-end encrypted" : "This file is not encrypted"}
// //                         >
// //                           {isFileEncrypted(file) ? '🔒 Encrypted' : '🔓 Not Encrypted'}
// //                         </span>
// //                       </p>
// //                     </div>
// //                   </div>
// //                 ))}
// //               </div>
// //             ) : (
// //               <div className="no-files">
// //                 <p>No files found. Upload some files to start sharing!</p>
// //               </div>
// //             )}
// //           </div>
          
// //           <div className="share-form-container">
// //             <h2>Share Selected File</h2>
// //             {selectedFile ? (
// //               <div className="selected-file-info">
// //                 <p><strong>Selected File:</strong> {selectedFile.name}</p>
// //                 <p><strong>Size:</strong> {formatSize(selectedFile.size)}</p>
// //                 <p><strong>Uploaded:</strong> {selectedFile.uploadTime}</p>
// //                 <p><strong>Security Status:</strong> 
// //                   <span className={`security-badge ${isFileEncrypted(selectedFile) ? 'encrypted' : 'unencrypted'}`}>
// //                     {isFileEncrypted(selectedFile) ? '🔒 End-to-End Encrypted' : '🔓 Not Encrypted'}
// //                   </span>
// //                 </p>
// //                 {!isFileEncrypted(selectedFile) && (
// //                   <p className="encryption-warning">
// //                     ⚠️ This file is not encrypted. For maximum security, consider re-uploading with encryption enabled.
// //                   </p>
// //                 )}
// //               </div>
// //             ) : (
// //               <p className="no-selection">No file selected. Please select a file from the list.</p>
// //             )}
            
// //             <form onSubmit={handleShare} className="share-form">
// //               <div className="form-group">
// //                 <label htmlFor="receiver-address">Receiver's Wallet Address</label>
// //                 <input
// //                   type="text"
// //                   id="receiver-address"
// //                   placeholder="0x..."
// //                   value={receiverAddress}
// //                   onChange={(e) => setReceiverAddress(e.target.value)}
// //                   disabled={!selectedFile || sharing}
// //                 />
// //               </div>
              
// //               <button 
// //                 type="submit" 
// //                 className="share-button"
// //                 disabled={!selectedFile || !receiverAddress || sharing || (selectedFile && !isFileEncrypted(selectedFile))}
// //               >
// //                 {sharing ? 'Processing...' : 'Share File'}
// //               </button>
              
// //               {selectedFile && !isFileEncrypted(selectedFile) && (
// //                 <div className="share-warning">
// //                   <p>Encrypted sharing is not available for this file. Please re-upload with encryption enabled.</p>
// //                 </div>
// //               )}
              
// //               {encryptionStatus && (
// //                 <div className="encryption-progress">
// //                   <p>{encryptionStatus}</p>
// //                 </div>
// //               )}
              
// //               {/* New processing steps display */}
// //               {processingSteps.length > 0 && (
// //                 <div className="processing-steps">
// //                   <h4>Processing Status:</h4>
// //                   <ul className="steps-list">
// //                     {processingSteps.map((step, index) => (
// //                       <li key={index} className="step-item">{step}</li>
// //                     ))}
// //                   </ul>
// //                 </div>
// //               )}
              
// //               {shareSuccess && (
// //                 <div className="share-success">
// //                   <p>File shared successfully! The recipient can now access this file securely.</p>
// //                 </div>
// //               )}
              
// //               {shareError && (
// //                 <div className="share-error">
// //                   <p>{shareError}</p>
// //                 </div>
// //               )}
// //             </form>
            
// //             <div className="share-info">
// //               <h3>How Secure Sharing Works</h3>
// //               <ol>
// //                 <li>Select an encrypted file you wish to share</li>
// //                 <li>Enter the recipient's blockchain wallet address</li>
// //                 <li>A unique encryption key is generated specifically for the recipient</li>
// //                 <li>The key is securely stored with a reference saved on the blockchain</li>
// //                 <li>The file remains encrypted and stored securely</li>
// //                 <li>A smart contract transaction grants decryption permission to the recipient</li>
// //                 <li>When the recipient accesses the file, their key is automatically retrieved</li>
// //                 <li>You retain full ownership and can revoke access at any time</li>
// //               </ol>
// //               <div className="privacy-note">
// //                 <p>Your encrypted files remain secure throughout the sharing process. Only the intended recipient with the correct wallet address can decrypt and access the shared file. No third parties, including our platform, can access your encrypted data.</p>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default SharePage;


// import React, { useState, useEffect, useContext } from 'react';
// import { Web3Context } from './Web3Context';
// import CryptoJS from 'crypto-js';
// import './App.css';

// const CryptoFunctions = {
//   /**
//    * Derive an encryption key from a wallet address
//    * @param {string} walletAddress - The wallet address
//    * @returns {string} - A derived key
//    */
//   deriveKeyFromWallet: (walletAddress) => {
    
//     const salt = "CloudStore_Salt_2025"; 
//     return CryptoJS.PBKDF2(walletAddress, salt, { keySize: 256/32, iterations: 1000 }).toString();
//   },
  
//   /**
//    * Generate a shared encryption key for a specific file and recipient
//    * @param {string} encryptedKey - The encrypted file key
//    * @param {string} recipientAddress - The recipient's wallet address
//    * @param {string} ownerAddress - The owner's wallet address
//    * @returns {Promise<string>} - Encrypted file key for the recipient
//    */
//   shareEncryptionKey: async (encryptedKey, recipientAddress, ownerAddress) => {
//     try {
//       const ownerWalletKey = CryptoFunctions.deriveKeyFromWallet(ownerAddress);
//       const fileKey = CryptoJS.AES.decrypt(encryptedKey, ownerWalletKey).toString(CryptoJS.enc.Utf8);
      
//       const recipientWalletKey = CryptoFunctions.deriveKeyFromWallet(recipientAddress);
//       const sharedEncryptedKey = CryptoJS.AES.encrypt(fileKey, recipientWalletKey).toString();
      
//       return sharedEncryptedKey;
//     } catch (error) {
//       console.error("Encryption error details:", error);
//       throw new Error("Failed to generate shared key: " + error.message);
//     }
//   }
// };
import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from './Web3Context';
import './App.css';

const SharePage = () => {
  const { account, connected, connectWallet, getFiles, shareFile } = useContext(Web3Context);
  const [files, setFiles] = useState([]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    const loadFiles = async () => {
      if (connected) {
        setLoading(true);
        try {
          const myFiles = await getFiles();
          setFiles(myFiles || []);
        } catch (error) {
          console.error("Error fetching files:", error);
          setShareError('Failed to load files: ' + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setFiles([]);
        setLoading(false);
      }
    };
    loadFiles();
  }, [connected, getFiles]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!selectedFileId) {
      setShareError('Please select a file to share');
      return;
    }
    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      setShareError('Please enter a valid Ethereum address');
      return;
    }
    if (!connected) {
      const success = await connectWallet();
      if (!success) return;
    }

    setSharing(true);
    setShareError('');
    setShareSuccess(false);

    try {
      const result = await shareFile(selectedFileId, recipientAddress);
      if (result.success) {
        setShareSuccess(true);
        setRecipientAddress('');
        setSelectedFileId(null);
      } else {
        throw new Error('Failed to share file');
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      setShareError('Error sharing file: ' + error.message);
    } finally {
      setSharing(false);
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
    <div className="share-page">
      <h1>Share Files</h1>
      <p className="page-description">
        Share your files with others on the decentralized network.
      </p>
      
      {!connected ? (
        <div className="connect-wallet">
          <p>Connect your wallet to share files</p>
          <button onClick={handleConnect} className="connect-button">Connect Wallet</button>
        </div>
      ) : (
        <div className="share-container">
          <div className="file-list">
            <h2>Your Files</h2>
            {loading ? (
              <div className="loading">
                <p>Loading your files...</p>
                <div className="loading-spinner"></div>
              </div>
            ) : files.length > 0 ? (
              <div className="files-grid">
                {files.map(file => (
                  <div 
                    key={file.id} 
                    className={`file-card ${selectedFileId === file.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFileId(file.id)}
                  >
                    <div className="file-icon">{getFileIcon(file.type)}</div>
                    <div className="file-info">
                      <h3 className="file-name">{file.name}</h3>
                      <p className="file-meta">
                        <span className="file-size">{formatSize(file.size)}</span>
                        <span className="file-date">{formatDate(file.uploadTime)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-files">
                <p>No files found. Upload some files to share!</p>
              </div>
            )}
          </div>
          
          <div className="share-form">
            <h2>Share Selected File</h2>
            <form onSubmit={handleShare}>
              <div className="form-group">
                <label htmlFor="recipient-address">Recipient Address</label>
                <input
                  type="text"
                  id="recipient-address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="address-input"
                  disabled={sharing}
                />
              </div>
              <button 
                type="submit" 
                className="share-button" 
                disabled={sharing || !selectedFileId}
              >
                {sharing ? 'Sharing...' : 'Share File'}
              </button>
            </form>
            
            {shareSuccess && (
              <div className="share-success">
                <h3>File Shared Successfully!</h3>
                <p>The file has been shared with {recipientAddress}.</p>
              </div>
            )}
            
            {shareError && (
              <div className="share-error">
                <p>{shareError}</p>
                <button onClick={() => setShareError('')} className="close-error">×</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SharePage;