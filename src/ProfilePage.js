import React, { useContext, useState } from 'react';
import { Web3Context } from './Web3Context';
import './App.css';

const ProfilePage = () => {
  const { account, connected, balance, connectWallet, disconnectWallet } = useContext(Web3Context);
  const [fileCount, setFileCount] = useState(0);
  const [sharedFileCount, setSharedFileCount] = useState(0);

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(account);
      alert('Address copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const getAddressEtherscanLink = () => {
    return `https://etherscan.io/address/${account}`;
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      alert('Wallet disconnected. You may need to lock/unlock MetaMask to fully reset the connection.');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect wallet. Please try again.');
    }
  };

  if (!connected) {
    return (
      <div className="profile-page not-connected">
        <div className="connect-wallet-section">
          <h1>Connect Your Wallet</h1>
          <p>Please connect your MetaMask wallet to view your profile and access decentralized storage features.</p>
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="wallet-connection-status">
          <span className="connected-indicator">
            🟢 Connected
          </span>
          <button onClick={handleDisconnect} className="disconnect-button">
            Disconnect
          </button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card wallet-details">
          <h2>Wallet Information</h2>
          <div className="account-info">
            <div className="account-address">
              <label>Wallet Address:</label>
              <div className="address-display">
                <span>{shortenAddress(account)}</span>
                <div className="address-actions">
                  <button onClick={copyToClipboard} title="Copy Address">
                    📋
                  </button>
                  {/* <a 
                    href={getAddressEtherscanLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="View on Etherscan"
                  >
                    🔍
                  </a> */}
                </div>
              </div>
            </div>
            <div className="account-balance">
              <label>ETH Balance:</label>
              <span>{balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}</span>
            </div>
          </div>
        </div>

        {/* <div className="profile-card storage-stats">
          <h2>Storage Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>Total Files Uploaded</h3>
              <p>{fileCount}</p>
            </div>
            <div className="stat-item">
              <h3>Files Shared With Me</h3>
              <p>{sharedFileCount}</p>
            </div>
            <div className="stat-item">
              <h3>Total Storage Used</h3>
              <p>Calculating...</p>
            </div>
            <div className="stat-item">
              <h3>Storage Capacity</h3>
              <p>Unlimited</p>
            </div>
          </div>
        </div> */}

        <div className="profile-card blockchain-info">
          <h2>Blockchain Information</h2>
          <div className="blockchain-details">
            <div className="detail-item">
              <label>Network:</label>
              <span>Ethereum (Main Network)</span>
            </div>
            <div className="detail-item">
              <label>Connected Since:</label>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Wallet Type:</label>
              <span>MetaMask</span>
            </div>
          </div>
        </div>

        <div className="profile-card security-section">
          <h2>Security & Permissions</h2>
          <div className="security-details">
            <div className="permission-item">
              <h3>Decentralized Storage Permissions</h3>
              <p>Full access to upload, retrieve, and share files</p>
            </div>
            <div className="permission-item">
              <h3>Smart Contract Interactions</h3>
              <p>Authorized to interact with BlockStore smart contracts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;