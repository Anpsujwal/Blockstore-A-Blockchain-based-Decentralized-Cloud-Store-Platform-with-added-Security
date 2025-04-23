import React, { useState, useContext, useRef } from 'react';
import { Web3Context } from './Web3Context';
import axios from 'axios';
import './App.css';

const UploadPage = () => {
  const { account, connected, connectWallet, uploadFile } = useContext(Web3Context);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef(null);

  const checkFileCorruption = (file) => {
    return new Promise((resolve, reject) => {
      setChecking(true);
      if (file.type.startsWith('image/')) {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => { URL.revokeObjectURL(objectUrl); setChecking(false); resolve(true); };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); setChecking(false); reject(new Error('The image file appears to be corrupted')); };
        img.src = objectUrl;
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          if (content.indexOf('%PDF-') !== 0) { setChecking(false); reject(new Error('The PDF file appears to be corrupted')); }
          else { setChecking(false); resolve(true); }
        };
        reader.onerror = () => { setChecking(false); reject(new Error('The file appears to be corrupted')); };
        reader.readAsText(file.slice(0, 5));
      } else if (file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = new Uint8Array(event.target.result);
          if (content[0] !== 0x50 || content[1] !== 0x4B) { setChecking(false); reject(new Error('The ZIP file appears to be corrupted')); }
          else { setChecking(false); resolve(true); }
        };
        reader.onerror = () => { setChecking(false); reject(new Error('The file appears to be corrupted')); };
        reader.readAsArrayBuffer(file.slice(0, 4));
      } else {
        const reader = new FileReader();
        reader.onload = () => { setChecking(false); resolve(true); };
        reader.onerror = () => { setChecking(false); reject(new Error('The file appears to be corrupted')); };
        const sampleSize = Math.min(file.size, 4096);
        reader.readAsArrayBuffer(file.slice(0, sampleSize));
      }
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      try {
        await checkFileCorruption(selectedFile);
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setUploadSuccess(false);
        setUploadError('');
      } catch (error) {
        setFile(null);
        setFileName('');
        setUploadError('The file is corrupted, please select a new file');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }
    if (!connected) {
      const success = await connectWallet();
      if (!success) return;
    }

    try {
      await checkFileCorruption(file);
      setUploading(true);
      setUploadProgress(10);

      setUploadProgress(30);
      const formData = new FormData();
      formData.append('file', file);
      const metadata = JSON.stringify({ name: fileName });
      formData.append('pinataMetadata', metadata);

      const pinataResponse = await axios({
        method: 'post',
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: formData,
        headers: {
          pinata_api_key: `f2ac4b14f8e5ca926a5e`,
          pinata_secret_api_key: `7da6884cd2d9822141313b98252b8b288e60ebaada96fbd5f557da9876e3e4ca`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (pinataResponse.status !== 200) throw new Error('Failed to upload to Pinata');
      const fileHash = pinataResponse.data.IpfsHash;

      setUploadProgress(70);
      const fileSize = file.size.toString();
      const fileType = file.type || 'application/octet-stream';
      const txHash = await uploadFile(fileHash, fileName, fileType, fileSize);

      if (txHash) {
        setTxHash(txHash);
        setUploadSuccess(true);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        throw new Error('Failed to record file on blockchain');
      }

      setUploadProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError('Error uploading: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1>Upload Files</h1>
      <p className="page-description">
        Store your files on our decentralized network.
      </p>
      
      {!connected && (
        <div className="connect-wallet">
          <p>Connect your wallet to start uploading files</p>
          <button onClick={connectWallet} className="connect-button">Connect Wallet</button>
        </div>
      )}
      
      {connected && (
        <div className="upload-container">
          <div className="upload-card">
            <form onSubmit={handleUpload}>
              <div className="file-input-container">
                <input
                  type="file"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  id="file-upload"
                  className="file-input"
                />
                <label htmlFor="file-upload" className="file-label">
                  {checking ? 'Checking file...' : (file ? file.name : 'Choose a file')}
                </label>
              </div>
              
              {file && (
                <div className="file-details">
                  <p><strong>Name:</strong> {file.name}</p>
                  <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                  <p><strong>Type:</strong> {file.type || 'Unknown'}</p>
                  <p><strong>Status:</strong> <span className="file-valid">Valid</span></p>
                </div>
              )}
              
              <button 
                type="submit" 
                className="upload-button" 
                disabled={uploading || !file || checking}
              >
                {uploading ? 'Uploading...' : (checking ? 'Checking file...' : 'Upload')}
              </button>
            </form>
            
            {uploading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="progress-text">{uploadProgress}% Complete</p>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="upload-success">
                <h3>File Uploaded Successfully!</h3>
                <p>Your file has been stored on the blockchain.</p>
                <p className="tx-hash">Transaction Hash: {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 6)}</p>
              </div>
            )}
            
            {uploadError && (
              <div className="upload-error">
                <p>{uploadError}</p>
              </div>
            )}
          </div>
          
          <div className="upload-info">
            <h3>How It Works</h3>
            <ol>
              <li>Select a file from your device</li>
              <li>We validate the file to ensure it's not corrupted</li>
              <li>File is stored on IPFS</li>
              <li>File metadata is recorded on blockchain</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;