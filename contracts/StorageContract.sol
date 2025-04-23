// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StorageContract {
    struct File {
        string fileHash;
        string fileName;
        string fileType;
        uint fileSize;
        uint uploadTime;
        address owner;
        mapping(address => bool) sharedWith;
    }
    
    // File ID counter
    uint public fileCount;
    
    // Mapping from file ID to File struct
    mapping(uint => File) public files;
    
    // Mapping from user address to file IDs they own
    mapping(address => uint[]) private userFiles;
    
    // Mapping from user address to file IDs shared with them
    mapping(address => uint[]) private sharedWithUser;
    
    // Mapping to store encryption key references (could be IPFS hashes or other references)
    // file ID => recipient address => encryption key reference
    mapping(uint => mapping(address => string)) private encryptionKeyReferences;
    
    // Events
    event FileUploaded(uint fileId, string fileHash, string fileName, uint fileSize, address owner);
    event FileShared(uint fileId, address owner, address sharedWith, string keyReference);
    event FileAccessRevoked(uint fileId, address owner, address revokedFrom);
    
    // Modifiers
    modifier onlyFileOwner(uint _fileId) {
        require(files[_fileId].owner == msg.sender, "Only the file owner can perform this action");
        _;
    }
    
    // Upload a new file
    function uploadFile(
        string memory _fileHash, 
        string memory _fileName, 
        string memory _fileType, 
        uint _fileSize,
        string memory _encryptionKeyRef
    ) public returns (uint) {
        // Validate inputs
        require(bytes(_fileHash).length > 0, "File hash cannot be empty");
        require(bytes(_fileName).length > 0, "File name cannot be empty");
        
        // Create file entry
        uint fileId = fileCount;
        
        File storage newFile = files[fileId];
        newFile.fileHash = _fileHash;
        newFile.fileName = _fileName;
        newFile.fileType = _fileType;
        newFile.fileSize = _fileSize;
        newFile.uploadTime = block.timestamp;
        newFile.owner = msg.sender;
        
        // Store encryption key reference
        if (bytes(_encryptionKeyRef).length > 0) {
            encryptionKeyReferences[fileId][msg.sender] = _encryptionKeyRef;
        }
        
        // Add to user's files
        userFiles[msg.sender].push(fileId);
        
        // Increment file count
        fileCount++;
        
        // Emit event
        emit FileUploaded(fileId, _fileHash, _fileName, _fileSize, msg.sender);
        
        return fileId;
    }
    
    // Share a file with another user (including encryption key reference)
    function shareFile(
        uint _fileId, 
        address _recipient, 
        string memory _encryptionKeyRef
    ) public onlyFileOwner(_fileId) returns (bool) {
        require(_recipient != address(0), "Invalid recipient address");
        require(_recipient != msg.sender, "Cannot share with yourself");
        require(!files[_fileId].sharedWith[_recipient], "File already shared with this address");
        require(bytes(_encryptionKeyRef).length > 0, "Encryption key reference required");
        
        // Mark file as shared with recipient
        files[_fileId].sharedWith[_recipient] = true;
        
        // Store encryption key reference for the recipient
        encryptionKeyReferences[_fileId][_recipient] = _encryptionKeyRef;
        
        // Add to recipient's shared files
        sharedWithUser[_recipient].push(_fileId);
        
        // Emit event
        emit FileShared(_fileId, msg.sender, _recipient, _encryptionKeyRef);
        
        return true;
    }
    
    // Revoke file access from a user
    function revokeAccess(uint _fileId, address _revokeFrom) public onlyFileOwner(_fileId) returns (bool) {
        require(_revokeFrom != address(0), "Invalid address");
        require(files[_fileId].sharedWith[_revokeFrom], "File not shared with this address");
        
        // Remove sharing permission
        files[_fileId].sharedWith[_revokeFrom] = false;
        
        // Clear encryption key reference
        delete encryptionKeyReferences[_fileId][_revokeFrom];
        
        // Remove from shared files list (expensive operation but kept for simplicity)
        uint[] storage sharedFiles = sharedWithUser[_revokeFrom];
        for (uint i = 0; i < sharedFiles.length; i++) {
            if (sharedFiles[i] == _fileId) {
                // Replace with last element and remove last
                sharedFiles[i] = sharedFiles[sharedFiles.length - 1];
                sharedFiles.pop();
                break;
            }
        }
        
        // Emit event
        emit FileAccessRevoked(_fileId, msg.sender, _revokeFrom);
        
        return true;
    }
    
    // Check if a user has access to a file
    function checkAccess(uint _fileId, address _user) public view returns (bool) {
        return (files[_fileId].owner == _user || files[_fileId].sharedWith[_user]);
    }
    
    // Get encryption key reference for a file (only if user has access)
    function getEncryptionKeyReference(uint _fileId) public view returns (string memory) {
        require(checkAccess(_fileId, msg.sender), "No access to this file");
        return encryptionKeyReferences[_fileId][msg.sender];
    }
    
    // Get all files uploaded by a user
    function getUserFiles() public view returns (uint[] memory) {
        return userFiles[msg.sender];
    }
    
    // Get file details (excluding sharing info)
    function getFileDetails(uint _fileId) public view returns (
        string memory fileHash,
        string memory fileName,
        string memory fileType,
        uint fileSize,
        uint uploadTime,
        address owner,
        bool hasAccess,
        string memory encryptionKeyRef
    ) {
        File storage file = files[_fileId];
        
        // Check if user has access
        bool userHasAccess = checkAccess(_fileId, msg.sender);
        
        // Only return file hash if user has access
        string memory hash = userHasAccess ? file.fileHash : "";
        
        // Only return encryption key reference if user has access
        string memory keyRef = userHasAccess ? encryptionKeyReferences[_fileId][msg.sender] : "";
        
        return (
            hash,
            file.fileName,
            file.fileType,
            file.fileSize,
            file.uploadTime,
            file.owner,
            userHasAccess,
            keyRef
        );
    }
    
    // Get all files shared with a user
    function getSharedFiles() public view returns (
        uint[] memory ids,
        string[] memory hashes,
        string[] memory names,
        string[] memory types,
        uint[] memory sizes,
        uint[] memory times,
        address[] memory owners,
        string[] memory encryptionKeyRefs
    ) {
        uint[] memory fileIds = sharedWithUser[msg.sender];
        
        // Create arrays for return values
        string[] memory fileHashes = new string[](fileIds.length);
        string[] memory fileNames = new string[](fileIds.length);
        string[] memory fileTypes = new string[](fileIds.length);
        uint[] memory fileSizes = new uint[](fileIds.length);
        uint[] memory uploadTimes = new uint[](fileIds.length);
        address[] memory fileOwners = new address[](fileIds.length);
        string[] memory keyRefs = new string[](fileIds.length);
        
        // Populate arrays
        for (uint i = 0; i < fileIds.length; i++) {
            uint fileId = fileIds[i];
            File storage file = files[fileId];
            
            // Only include files that are still shared with user
            if (file.sharedWith[msg.sender]) {
                fileHashes[i] = file.fileHash;
                fileNames[i] = file.fileName;
                fileTypes[i] = file.fileType;
                fileSizes[i] = file.fileSize;
                uploadTimes[i] = file.uploadTime;
                fileOwners[i] = file.owner;
                keyRefs[i] = encryptionKeyReferences[fileId][msg.sender];
            }
        }
        
        return (
            fileIds,
            fileHashes,
            fileNames,
            fileTypes,
            fileSizes,
            uploadTimes,
            fileOwners,
            keyRefs
        );
    }
    
    // Delete a file (only owner can delete)
    function deleteFile(uint _fileId) public onlyFileOwner(_fileId) returns (bool) {
        // Remove from owner's files
        uint[] storage ownerFiles = userFiles[msg.sender];
        for (uint i = 0; i < ownerFiles.length; i++) {
            if (ownerFiles[i] == _fileId) {
                // Replace with last element and remove last
                ownerFiles[i] = ownerFiles[ownerFiles.length - 1];
                ownerFiles.pop();
                break;
            }
        }
        
        // Note: We don't actually delete the file struct data
        // as we can't easily remove it from all shared lists
        // Instead, we just disconnect it from the owner
        
        return true;
    }
    
    // Get count of files owned by caller
    function getUserFileCount() public view returns (uint) {
        return userFiles[msg.sender].length;
    }
    
    // Get count of files shared with caller
    function getSharedFileCount() public view returns (uint) {
        return sharedWithUser[msg.sender].length;
    }
    
    // Update file name (only owner can update)
    function updateFileName(uint _fileId, string memory _newFileName) public onlyFileOwner(_fileId) returns (bool) {
        require(bytes(_newFileName).length > 0, "File name cannot be empty");
        
        files[_fileId].fileName = _newFileName;
        return true;
    }
    
    // Check if a file exists
    function fileExists(uint _fileId) public view returns (bool) {
        return _fileId < fileCount && bytes(files[_fileId].fileName).length > 0;
    }
    
    // Get all users a file is shared with (only owner can call)
    // This is a helper function and not efficient for many users
    function getFileSharedList(uint _fileId) public view onlyFileOwner(_fileId) returns (address[] memory) {
        // This is a placeholder - in a real implementation you would need to track
        // all addresses a file is shared with separately
        return new address[](0);
    }
}