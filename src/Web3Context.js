import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import StorageContract from './artifacts/contracts/StorageContract.sol/StorageContract.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add state for encryption keys
  const [encryptionKeys, setEncryptionKeys] = useState({});

  // Your contract address
  // const contractAddress = "0xDa22a4711f1b01C1bDdbC099342C4dc64802C3E1";
  const contractAddress = "0x7bB2AF51C1D31e7462e3862AC57388C1E0126e75";
  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const selectedAccount = accounts[0];
            setAccount(selectedAccount);
            setConnected(true);

            // Create provider
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethersProvider);
            
            // Get balance
            const balance = await ethersProvider.getBalance(selectedAccount);
            setBalance(ethers.formatEther(balance));

            // Initialize contract
            const signer = await ethersProvider.getSigner();
            const storageContract = new ethers.Contract(
              contractAddress,
              StorageContract.abi,
              signer
            );
            setContract(storageContract);
            
            // Load encryption keys from local storage
            loadEncryptionKeys(selectedAccount);
          }
        } catch (error) {
          console.error("Failed to check wallet connection", error);
        }
      }
      setLoading(false);
    };

    checkConnection();

    // Set up event listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  
  // Function to load encryption keys from localStorage
  const loadEncryptionKeys = (address) => {
    try {
      const storedKeys = localStorage.getItem(`encryptionKeys_${address}`);
      if (storedKeys) {
        setEncryptionKeys(JSON.parse(storedKeys));
      }
    } catch (error) {
      console.error("Failed to load encryption keys from localStorage", error);
    }
  };
  
  // Function to save encryption keys to localStorage
  const saveEncryptionKeys = (address, keys) => {
    try {
      localStorage.setItem(`encryptionKeys_${address}`, JSON.stringify(keys));
    } catch (error) {
      console.error("Failed to save encryption keys to localStorage", error);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });

        // Get the first account
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);
        setConnected(true);

        // Create provider
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        
        // Get balance
        const balance = await ethersProvider.getBalance(selectedAccount);
        setBalance(ethers.formatEther(balance));

        // Initialize contract
        const signer = await ethersProvider.getSigner();
        const storageContract = new ethers.Contract(
          contractAddress,
          StorageContract.abi,
          signer
        );
        setContract(storageContract);
        
        // Load encryption keys from local storage
        loadEncryptionKeys(selectedAccount);

        return true;
      } catch (error) {
        console.error("Failed to connect wallet", error);
        alert("Failed to connect wallet. Please try again.");
        return false;
      }
    } else {
      alert("MetaMask not detected. Please install MetaMask.");
      return false;
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      const newAccount = accounts[0];
      setAccount(newAccount);
      
      // Update balance when account changes
      if (provider) {
        provider.getBalance(newAccount).then(balance => {
          setBalance(ethers.formatEther(balance));
        });

        // Reinitialize contract with new signer
        const signer = await provider.getSigner();
        const storageContract = new ethers.Contract(
          contractAddress,
          StorageContract.abi,
          signer
        );
        setContract(storageContract);
        
        // Load encryption keys for the new account
        loadEncryptionKeys(newAccount);
      }
    } else {
      setAccount("");
      setConnected(false);
      setBalance(null);
      setContract(null);
      setEncryptionKeys({});
    }
  };

  const handleChainChanged = () => {
    // Reload the page to reset the state
    window.location.reload();
  };

  const checkContractConnection = () => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }
  };

  // Function to upload file metadata to blockchain, including encryption key
  const uploadFile = async (fileHash, fileName, fileType, fileSize, encryptedKey) => {
    if (!connected || !account || !contract) {
      throw new Error("Wallet not connected or contract not initialized");
    }
    
    try {
      // Store file in the blockchain
      const tx = await contract.uploadFile(fileHash, fileName, fileType, fileSize);
      const receipt = await tx.wait();
      
      // Get the fileId from the event logs
      let fileId = null;
      for (const event of receipt.logs) {
        if (event.eventName === 'FileUploaded') {
          fileId = event.args[0];
          break;
        }
      }
      
      if (fileId !== null) {
        // Store the encryption key in local storage
        const updatedKeys = { ...encryptionKeys };
        updatedKeys[fileId.toString()] = encryptedKey;
        setEncryptionKeys(updatedKeys);
        saveEncryptionKeys(account, updatedKeys);
      }
      
      return tx.hash;
    } catch (error) {
      console.error("Error uploading file to blockchain:", error);
      throw error;
    }
  };

  // Function to get user's files, including their encryption keys
  const getFiles = async () => {
    checkContractConnection();
    
    try {
      // Get file IDs owned by user
      const fileIds = await contract.getUserFiles();
      const files = [];
      
      // Get details for each file
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i].toString();
        const fileDetails = await contract.getFileDetails(fileId);
        
        files.push({
          id: fileId,
          hash: fileDetails.fileHash,
          name: fileDetails.fileName,
          type: fileDetails.fileType,
          size: fileDetails.fileSize.toString(), // Convert BigInt to string
          uploadTime: new Date(Number(fileDetails.uploadTime) * 1000).toLocaleString(),
          owner: fileDetails.owner,
          hasAccess: fileDetails.hasAccess,
          encryptedKey: encryptionKeys[fileId] || null
        });
      }
      
      return files;
    } catch (error) {
      console.error("Error getting files:", error);
      throw error;
    }
  };

  // Function to get files shared with the user, including their encryption keys
  const getSharedFiles = async () => {
    checkContractConnection();
    
    try {
      const sharedFilesData = await contract.getSharedFiles();
      const files = [];
      
      // Process the returned arrays
      for (let i = 0; i < sharedFilesData.ids.length; i++) {
        const fileId = sharedFilesData.ids[i].toString();
        files.push({
          id: fileId,
          hash: sharedFilesData.hashes[i],
          name: sharedFilesData.names[i],
          type: sharedFilesData.types[i],
          size: sharedFilesData.sizes[i].toString(), // Convert BigInt to string
          uploadTime: new Date(Number(sharedFilesData.times[i]) * 1000).toLocaleString(),
          owner: sharedFilesData.owners[i],
          encryptedKey: encryptionKeys[fileId] || null
        });
      }
      
      return files;
    } catch (error) {
      console.error("Error getting shared files:", error);
      throw error;
    }
  };

  // Function to share a file with another user, including re-encrypting the key for the recipient
  const shareFile = async (fileId, recipientAddress, fileEncryptedKey) => {
    checkContractConnection();
    
    try {
      // Import CryptoUtils dynamically to avoid circular dependencies
      const CryptoUtils = (await import('./CryptoUtils')).default;
      
      // Re-encrypt the file key for the recipient
      const sharedKey = await CryptoUtils.shareEncryptionKey(
        fileEncryptedKey,
        recipientAddress,
        account
      );
      
      // Share the file on the blockchain
      const tx = await contract.shareFile(fileId, recipientAddress);
      await tx.wait();
      
      // Store the shared key for future reference (optional)
      const sharingRecord = {
        fileId,
        recipient: recipientAddress,
        sharedKey
      };
      
      // You might want to store this in a separate structure
      const sharedKeysRecord = JSON.parse(localStorage.getItem(`sharedKeys_${account}`) || '[]');
      sharedKeysRecord.push(sharingRecord);
      localStorage.setItem(`sharedKeys_${account}`, JSON.stringify(sharedKeysRecord));
      
      return {
        success: true,
        sharedKey
      };
    } catch (error) {
      console.error("Error sharing file:", error);
      throw error;
    }
  };

  // Function to revoke access to a file
  const revokeAccess = async (fileId, revokeFromAddress) => {
    checkContractConnection();
    
    try {
      const tx = await contract.revokeAccess(fileId, revokeFromAddress);
      await tx.wait();
      
      // Remove any shared keys
      const sharedKeysRecord = JSON.parse(localStorage.getItem(`sharedKeys_${account}`) || '[]');
      const updatedSharedKeys = sharedKeysRecord.filter(
        record => !(record.fileId === fileId && record.recipient === revokeFromAddress)
      );
      localStorage.setItem(`sharedKeys_${account}`, JSON.stringify(updatedSharedKeys));
      
      return true;
    } catch (error) {
      console.error("Error revoking access:", error);
      throw error;
    }
  };

  // Function to delete a file
  const deleteFile = async (fileId) => {
    checkContractConnection();
    
    try {
      const tx = await contract.deleteFile(fileId);
      await tx.wait();
      
      // Remove the encryption key
      const updatedKeys = { ...encryptionKeys };
      delete updatedKeys[fileId];
      setEncryptionKeys(updatedKeys);
      saveEncryptionKeys(account, updatedKeys);
      
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  };

  // Function to update a file name
  const updateFileName = async (fileId, newFileName) => {
    checkContractConnection();
    
    try {
      const tx = await contract.updateFileName(fileId, newFileName);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error updating file name:", error);
      throw error;
    }
  };

  // Function to check if user has access to a file
  const checkFileAccess = async (fileId, userAddress) => {
    checkContractConnection();
    
    try {
      const hasAccess = await contract.checkAccess(fileId, userAddress || account);
      return hasAccess;
    } catch (error) {
      console.error("Error checking file access:", error);
      throw error;
    }
  };
  
  // Function to get an encryption key for a file
  const getEncryptionKey = (fileId) => {
    return encryptionKeys[fileId] || null;
  };
  
  // Function to store an encryption key received from sharing
  const storeEncryptionKey = (fileId, encryptedKey) => {
    const updatedKeys = { ...encryptionKeys };
    updatedKeys[fileId] = encryptedKey;
    setEncryptionKeys(updatedKeys);
    saveEncryptionKeys(account, updatedKeys);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        connected,
        balance,
        provider,
        contract,
        loading,
        connectWallet,
        uploadFile,
        getFiles,
        getSharedFiles,
        shareFile,
        revokeAccess,
        deleteFile,
        updateFileName,
        checkFileAccess,
        getEncryptionKey,
        storeEncryptionKey
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};