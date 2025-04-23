import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import StorageContract from './artifacts/contracts/StorageContract.sol/StorageContract.json';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState("");
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const contractAddress = "0x7bB2AF51C1D31e7462e3862AC57388C1E0126e75";

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const selectedAccount = accounts[0];
            setAccount(selectedAccount);
            setConnected(true);
            const ethersProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(ethersProvider);
            const signer = await ethersProvider.getSigner();
            const storageContract = new ethers.Contract(contractAddress, StorageContract.abi, signer);
            setContract(storageContract);
          }
        } catch (error) {
          console.error("Failed to check wallet connection", error);
        }
      }
      setLoading(false);
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setConnected(true);
    } else {
      setAccount("");
      setConnected(false);
      setProvider(null);
      setContract(null);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);
        setConnected(true);
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        const signer = await ethersProvider.getSigner();
        const storageContract = new ethers.Contract(contractAddress, StorageContract.abi, signer);
        setContract(storageContract);
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

  const checkContractConnection = () => {
    if (!contract) throw new Error("Contract not initialized");
  };

  const uploadFile = async (fileHash, fileName, fileType, fileSize) => {
    checkContractConnection();
    try {
      const tx = await contract.uploadFile(fileHash, fileName, fileType, fileSize);
      const receipt = await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const getFiles = async () => {
    checkContractConnection();
    try {
      const fileIds = await contract.getUserFiles();
      const files = [];
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i].toString();
        const fileDetails = await contract.getFileDetails(fileId);
        files.push({
          id: fileId,
          hash: fileDetails.fileHash,
          name: fileDetails.fileName,
          type: fileDetails.fileType,
          size: fileDetails.fileSize.toString(),
          uploadTime: new Date(Number(fileDetails.uploadTime) * 1000).toLocaleString(),
          owner: fileDetails.owner,
          hasAccess: fileDetails.hasAccess
        });
      }
      return files;
    } catch (error) {
      console.error("Error getting files:", error);
      throw error;
    }
  };

  const getSharedFiles = async () => {
    checkContractConnection();
    try {
      const sharedFilesData = await contract.getSharedFiles();
      const files = [];
      for (let i = 0; i < sharedFilesData.ids.length; i++) {
        files.push({
          id: sharedFilesData.ids[i].toString(),
          hash: sharedFilesData.hashes[i],
          name: sharedFilesData.names[i],
          type: sharedFilesData.types[i],
          size: sharedFilesData.sizes[i].toString(),
          uploadTime: new Date(Number(sharedFilesData.times[i]) * 1000).toLocaleString(),
          owner: sharedFilesData.owners[i]
        });
      }
      return files;
    } catch (error) {
      console.error("Error getting shared files:", error);
      throw error;
    }
  };

  const shareFile = async (fileId, recipientAddress) => {
    checkContractConnection();
    try {
      const tx = await contract.shareFile(fileId, recipientAddress);
      await tx.wait();
      return { success: true };
    } catch (error) {
      console.error("Error sharing file:", error);
      throw error;
    }
  };

  const deleteFile = async (fileId) => {
    checkContractConnection();
    try {
      const tx = await contract.deleteFile(fileId);
      await tx.wait();
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        connected,
        provider,
        contract,
        loading,
        connectWallet,
        uploadFile,
        getFiles,
        getSharedFiles,
        shareFile,
        deleteFile
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};