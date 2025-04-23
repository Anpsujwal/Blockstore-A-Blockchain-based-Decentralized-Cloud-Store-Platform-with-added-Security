import CryptoJS from 'crypto-js';

class CryptoUtils {
  static async encryptFile(file, walletAddress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileData = event.target.result;
          
          const fileKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
          const encryptedData = CryptoJS.AES.encrypt(fileData, fileKey).toString();
          
          const walletKey = this.deriveKeyFromWallet(walletAddress);
          const encryptedKey = CryptoJS.AES.encrypt(fileKey, walletKey).toString();
          
          if (!encryptedKey || !encryptedData) {
            throw new Error("Encryption failed to produce valid output");
          }
          
          console.log('Encrypting file - walletAddress:', walletAddress);
          console.log('walletKey:', walletKey);
          console.log('fileKey:', fileKey);
          console.log('encryptedKey:', encryptedKey);
          
          resolve({
            encryptedData,
            encryptedKey,
            originalName: file.name,
            originalType: file.type,
            originalSize: file.size
          });
        } catch (error) {
          reject(new Error("Encryption failed: " + error.message));
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  static async decryptFile(encryptedData, encryptedKey, walletAddress) {
    try {
      if (!encryptedKey) {
        throw new Error("No encryption key provided for decryption");
      }
      if (!walletAddress) {
        throw new Error("No wallet address provided for key derivation");
      }
      
      const walletKey = this.deriveKeyFromWallet(walletAddress);
      console.log('Decrypting file - walletAddress:', walletAddress);
      console.log('walletKey:', walletKey);
      console.log('encryptedKey:', encryptedKey);
      
      const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, walletKey).toString(CryptoJS.enc.Utf8);
      if (!decryptedKey) {
        throw new Error("Failed to decrypt file key - invalid key or wallet address");
      }
      
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, decryptedKey).toString(CryptoJS.enc.Utf8);
      if (!decryptedData) {
        throw new Error("Failed to decrypt file data - possibly corrupted data");
      }
      
      console.log('decryptedKey:', decryptedKey);
      return decryptedData;
    } catch (error) {
      throw new Error("Failed to decrypt file: " + error.message);
    }
  }

  static async shareEncryptionKey(encryptedKey, recipientAddress, ownerAddress) {
    try {
      if (!encryptedKey) {
        throw new Error("No encryption key provided for sharing");
      }
      if (!ownerAddress || !recipientAddress) {
        throw new Error("Missing owner or recipient address");
      }
      
      const ownerWalletKey = this.deriveKeyFromWallet(ownerAddress);
      console.log('Sharing key - ownerAddress:', ownerAddress);
      console.log('ownerWalletKey:', ownerWalletKey);
      console.log('encryptedKey:', encryptedKey);
      
      const fileKey = CryptoJS.AES.decrypt(encryptedKey, ownerWalletKey).toString(CryptoJS.enc.Utf8);
      if (!fileKey) {
        throw new Error("Failed to decrypt original file key - invalid key or owner address");
      }
      
      const recipientWalletKey = this.deriveKeyFromWallet(recipientAddress);
      const sharedEncryptedKey = CryptoJS.AES.encrypt(fileKey, recipientWalletKey).toString();
      
      console.log('fileKey:', fileKey);
      console.log('recipientAddress:', recipientAddress);
      console.log('recipientWalletKey:', recipientWalletKey);
      console.log('sharedEncryptedKey:', sharedEncryptedKey);
      
      return sharedEncryptedKey;
    } catch (error) {
      throw new Error("Failed to generate shared key: " + error.message);
    }
  }

  static deriveKeyFromWallet(walletAddress) {
    if (!walletAddress) {
      throw new Error("No wallet address provided for key derivation");
    }
    const salt = "CloudStore_Salt_2025";
    return CryptoJS.PBKDF2(walletAddress.toLowerCase(), salt, { 
      keySize: 256/32, 
      iterations: 1000 
    }).toString();
  }
}

export default CryptoUtils;

