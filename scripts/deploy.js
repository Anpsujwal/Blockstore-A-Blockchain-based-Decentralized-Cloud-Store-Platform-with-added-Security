async function main() {
    const StorageContract = await ethers.getContractFactory("StorageContract");
    const storage = await StorageContract.deploy();
    await storage.deploymentTransaction().wait();
    
    console.log("StorageContract deployed to:", storage.target);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });