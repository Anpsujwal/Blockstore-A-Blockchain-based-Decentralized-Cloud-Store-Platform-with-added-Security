import CryptoJS from 'crypto-js';

// Class to handle file encryption and decryption
class CryptoUtils {
  /**
   * Encrypt a file using a derived key from the user's wallet address
   * @param {File} file - The file to encrypt
   * @param {string} walletAddress - The user's wallet address to derive the key from
   * @returns {Promise<Object>} - Object containing encrypted data and metadata
   */
  static async encryptFile(file, walletAddress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileData = event.target.result;
          
          // Generate a unique encryption key for this file
          // In a production environment, you might want a more sophisticated key derivation
          const fileKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
          
          // Encrypt the file data
          const encryptedData = CryptoJS.AES.encrypt(fileData, fileKey).toString();
          
          // Encrypt the file key with a key derived from the wallet address
          // This allows the owner to decrypt their files
          const walletKey = this.deriveKeyFromWallet(walletAddress);
          const encryptedKey = CryptoJS.AES.encrypt(fileKey, walletKey).toString();
          
          resolve({
            encryptedData,
            encryptedKey,
            originalName: file.name,
            originalType: file.type,
            originalSize: file.size
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Decrypt a file using the encrypted key and wallet address
   * @param {string} encryptedData - The encrypted file data
   * @param {string} encryptedKey - The encrypted file key
   * @param {string} walletAddress - The user's wallet address
   * @returns {Promise<string>} - The decrypted file data
   */
  static async decryptFile(encryptedData, encryptedKey, walletAddress) {
    try {
      // Derive the wallet key
      const walletKey = this.deriveKeyFromWallet(walletAddress);
      
      // Decrypt the file key
      const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, walletKey).toString(CryptoJS.enc.Utf8);
      
      // Decrypt the file data
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, decryptedKey).toString(CryptoJS.enc.Utf8);
      
      return decryptedData;
    } catch (error) {
      throw new Error("Failed to decrypt file: " + error.message);
    }
  }
  
  /**
   * Generate a shared encryption key for a specific file and recipient
   * @param {string} fileKey - The original file encryption key
   * @param {string} recipientAddress - The recipient's wallet address
   * @param {string} ownerAddress - The owner's wallet address
   * @returns {Promise<string>} - Encrypted file key for the recipient
   */
  static async shareEncryptionKey(encryptedKey, recipientAddress, ownerAddress) {
    try {
      // First, the owner decrypts the file key using their wallet key
      const ownerWalletKey = this.deriveKeyFromWallet(ownerAddress);
      const fileKey = CryptoJS.AES.decrypt(encryptedKey, ownerWalletKey).toString(CryptoJS.enc.Utf8);
      
      // Then, encrypt the file key with the recipient's derived key
      const recipientWalletKey = this.deriveKeyFromWallet(recipientAddress);
      const sharedEncryptedKey = CryptoJS.AES.encrypt(fileKey, recipientWalletKey).toString();
      
      return sharedEncryptedKey;
    } catch (error) {
      throw new Error("Failed to generate shared key: " + error.message);
    }
  }
  
  /**
   * Derive an encryption key from a wallet address
   * @param {string} walletAddress - The wallet address
   * @returns {string} - A derived key
   */
  static deriveKeyFromWallet(walletAddress) {
    // In a production system, you would use a more sophisticated key derivation function
    // For simplicity, we're using a basic approach here
    const salt = "CloudStore_Salt_2025"; // Should be stored securely in production
    return CryptoJS.PBKDF2(walletAddress, salt, { keySize: 256/32, iterations: 1000 }).toString();
  }
}

export default CryptoUtils;