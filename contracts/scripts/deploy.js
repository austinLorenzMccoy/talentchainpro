const {
    Client,
    PrivateKey,
    AccountId,
    ContractCreateFlow,
    ContractFunctionParameters,
    Hbar,
    FileCreateTransaction,
    FileAppendTransaction,
    ContractCallQuery,
    ContractExecuteTransaction
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Network configuration
const NETWORKS = {
    testnet: {
        nodeId: "0.0.3",
        nodeAccountId: AccountId.fromString("0.0.3"),
        nodeAddress: "testnet.hedera.com:50211",
        mirrorNodeUrl: "https://testnet.mirrornode.hedera.com"
    },
    mainnet: {
        nodeId: "0.0.3",
        nodeAccountId: AccountId.fromString("0.0.3"),
        nodeAddress: "mainnet-public.mirrornode.hedera.com:443",
        mirrorNodeUrl: "https://mainnet-public.mirrornode.hedera.com"
    },
    previewnet: {
        nodeId: "0.0.3",
        nodeAccountId: AccountId.fromString("0.0.3"),
        nodeAddress: "previewnet.hedera.com:50211",
        mirrorNodeUrl: "https://previewnet.mirrornode.hedera.com"
    }
};

class HederaContractDeployer {
    constructor() {
        this.network = process.env.HEDERA_NETWORK || "testnet";
        this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
        this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
        
        // Initialize client
        this.client = Client.forName(this.network);
        this.client.setOperator(this.operatorId, this.operatorKey);
        
        console.log(`🌐 Connected to Hedera ${this.network}`);
        console.log(`👤 Operator Account: ${this.operatorId.toString()}`);
    }

    /**
     * Deploy smart contract using Hedera SDK
     * @param {string} contractName - Name of the contract
     * @param {string} bytecode - Contract bytecode (hex string)
     * @param {Array} constructorParams - Constructor parameters
     * @param {number} gas - Gas limit for deployment
     * @returns {Object} Deployment result with contract ID and transaction ID
     */
    async deployContract(contractName, bytecode, constructorParams = [], gas = 4000000) {
        try {
            console.log(`\\n🚀 Deploying ${contractName} contract...`);
            console.log(`⛽ Gas limit: ${gas.toLocaleString()}`);
            
            // Remove 0x prefix if present
            const cleanBytecode = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
            
            // Create contract parameters
            let contractParams = new ContractFunctionParameters();
            
            // Add constructor parameters based on contract type
            if (contractName === "SkillToken" && constructorParams.length > 0) {
                contractParams.addAddress(constructorParams[0]); // initialOwner
            } else if (contractName === "TalentPool" && constructorParams.length > 0) {
                contractParams.addAddress(constructorParams[0]); // skillToken address
                contractParams.addAddress(constructorParams[1]); // feeCollector
                contractParams.addAddress(constructorParams[2]); // initialAdmin
            }
            
            // Deploy contract
            const contractCreateFlow = new ContractCreateFlow()
                .setGas(gas)
                .setBytecode(cleanBytecode)
                .setMaxTransactionFee(new Hbar(20)); // Set max fee to 20 HBAR
            
            if (constructorParams.length > 0) {
                contractCreateFlow.setConstructorParameters(contractParams);
            }
            
            console.log("📝 Submitting contract creation transaction...");
            const txResponse = await contractCreateFlow.execute(this.client);
            const receipt = await txResponse.getReceipt(this.client);
            
            const contractId = receipt.contractId;
            const transactionId = txResponse.transactionId;
            
            console.log(`✅ ${contractName} deployed successfully!`);
            console.log(`📄 Contract ID: ${contractId.toString()}`);
            console.log(`🔗 Transaction ID: ${transactionId.toString()}`);
            console.log(`🔍 Explorer: https://hashscan.io/${this.network}/contract/${contractId.toString()}`);
            
            return {
                contractId: contractId.toString(),
                transactionId: transactionId.toString(),
                contractAddress: `0.0.${contractId.num}`,
                explorerUrl: `https://hashscan.io/${this.network}/contract/${contractId.toString()}`,
                success: true
            };
            
        } catch (error) {
            console.error(`❌ Failed to deploy ${contractName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Read contract bytecode from artifacts
     * @param {string} contractName - Name of the contract
     * @returns {string} Contract bytecode
     */
    readContractBytecode(contractName) {
        try {
            const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}Enhanced.sol`, `${contractName}.json`);
            
            if (!fs.existsSync(artifactPath)) {
                // Try without Enhanced suffix
                const fallbackPath = path.join(__dirname, "..", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
                if (!fs.existsSync(fallbackPath)) {
                    throw new Error(`Contract artifact not found for ${contractName}. Please compile first.`);
                }
                const artifact = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
                return artifact.bytecode;
            }
            
            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            return artifact.bytecode;
            
        } catch (error) {
            console.error(`Failed to read ${contractName} bytecode:`, error.message);
            throw error;
        }
    }

    /**
     * Call a contract function
     * @param {string} contractId - Contract ID
     * @param {string} functionName - Function name
     * @param {Array} params - Function parameters
     * @param {number} gas - Gas limit
     * @returns {Object} Transaction result
     */
    async callContractFunction(contractId, functionName, params = [], gas = 100000) {
        try {
            console.log(`\\n📞 Calling ${functionName} on contract ${contractId}...`);
            
            let contractParams = new ContractFunctionParameters();
            
            // Add parameters based on function (this would need to be expanded for specific functions)
            params.forEach((param, index) => {
                if (typeof param === "string" && param.startsWith("0.0.")) {
                    contractParams.addAddress(param);
                } else if (typeof param === "string") {
                    contractParams.addString(param);
                } else if (typeof param === "number") {
                    contractParams.addUint256(param);
                } else if (typeof param === "boolean") {
                    contractParams.addBool(param);
                }
            });
            
            const contractExecTx = new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(gas)
                .setFunction(functionName, contractParams)
                .setMaxTransactionFee(new Hbar(5));
            
            const txResponse = await contractExecTx.execute(this.client);
            const receipt = await txResponse.getReceipt(this.client);
            
            console.log(`✅ Function ${functionName} executed successfully!`);
            console.log(`🔗 Transaction ID: ${txResponse.transactionId.toString()}`);
            
            return {
                success: true,
                transactionId: txResponse.transactionId.toString(),
                status: receipt.status.toString()
            };
            
        } catch (error) {
            console.error(`❌ Failed to call ${functionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Query a contract function (read-only)
     * @param {string} contractId - Contract ID
     * @param {string} functionName - Function name
     * @param {Array} params - Function parameters
     * @returns {Object} Query result
     */
    async queryContractFunction(contractId, functionName, params = []) {
        try {
            console.log(`\\n🔍 Querying ${functionName} on contract ${contractId}...`);
            
            let contractParams = new ContractFunctionParameters();
            
            params.forEach((param) => {
                if (typeof param === "string" && param.startsWith("0.0.")) {
                    contractParams.addAddress(param);
                } else if (typeof param === "string") {
                    contractParams.addString(param);
                } else if (typeof param === "number") {
                    contractParams.addUint256(param);
                } else if (typeof param === "boolean") {
                    contractParams.addBool(param);
                }
            });
            
            const contractQuery = new ContractCallQuery()
                .setContractId(contractId)
                .setGas(50000)
                .setFunction(functionName, contractParams);
            
            const result = await contractQuery.execute(this.client);
            
            console.log(`✅ Query ${functionName} completed successfully!`);
            
            return {
                success: true,
                result: result
            };
            
        } catch (error) {
            console.error(`❌ Failed to query ${functionName}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Save deployment information to file
     * @param {Object} deployments - Deployment results
     */
    saveDeploymentInfo(deployments) {
        const deploymentInfo = {
            network: this.network,
            timestamp: new Date().toISOString(),
            operator: this.operatorId.toString(),
            contracts: deployments,
            networkInfo: NETWORKS[this.network]
        };

        const outputPath = path.join(__dirname, "..", "deployments", `${this.network}.json`);
        
        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.dirname(outputPath);
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\\n💾 Deployment info saved to: ${outputPath}`);
        
        // Update environment file
        this.updateEnvironmentFile(deployments);
    }

    /**
     * Update environment file with contract addresses
     * @param {Object} deployments - Deployment results
     */
    updateEnvironmentFile(deployments) {
        // Update root .env file
        const rootEnvPath = path.join(__dirname, "..", "..", ".env");
        this.updateEnvFile(rootEnvPath, deployments, true);
        
        // Update backend .env file if it exists
        const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
        if (fs.existsSync(path.dirname(backendEnvPath))) {
            this.updateEnvFile(backendEnvPath, deployments, false);
        }
        
        // Update frontend .env.local file if it exists
        const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env.local");
        if (fs.existsSync(path.dirname(frontendEnvPath))) {
            this.updateEnvFile(frontendEnvPath, deployments, true);
        }
    }
    
    /**
     * Helper method to update individual env files
     */
    updateEnvFile(envPath, deployments, includePublic = false) {
        let envContent = "";
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        }
        
        // Update or add contract addresses
        Object.entries(deployments).forEach(([contractName, deployment]) => {
            if (deployment.success) {
                const envVar = `CONTRACT_${contractName.toUpperCase()}`;
                const publicEnvVar = `NEXT_PUBLIC_CONTRACT_${contractName.toUpperCase()}`;
                const contractId = deployment.contractId;
                
                // Update regular env var
                const regex = new RegExp(`^${envVar}=.*$`, "m");
                if (envContent.match(regex)) {
                    envContent = envContent.replace(regex, `${envVar}=${contractId}`);
                } else {
                    envContent += `\n${envVar}=${contractId}`;
                }
                
                // Update public env var for frontend
                if (includePublic) {
                    const publicRegex = new RegExp(`^${publicEnvVar}=.*$`, "m");
                    if (envContent.match(publicRegex)) {
                        envContent = envContent.replace(publicRegex, `${publicEnvVar}=${contractId}`);
                    } else {
                        envContent += `\n${publicEnvVar}=${contractId}`;
                    }
                }
            }
        });
        
        fs.writeFileSync(envPath, envContent);
        console.log(`📝 Environment file updated: ${envPath}`);
    }
}

/**
 * Main deployment script
 */
async function main() {
    console.log("🚀 TalentChain Pro - Smart Contract Deployment");
    console.log("=" .repeat(50));
    
    const deployer = new HederaContractDeployer();
    const deployments = {};
    
    try {
        // Check if contracts are compiled
        console.log("\n🔍 Checking compiled contracts...");
        
        // Try different possible artifact paths
        const skillTokenPaths = [
            "SkillTokenSimple",
            "SkillTokenEnhanced",
            "SkillToken"
        ];
        
        const talentPoolPaths = [
            "TalentPoolSimple",
            "TalentPoolEnhanced", 
            "TalentPool"
        ];
        
        let skillTokenBytecode, talentPoolBytecode;
        let skillTokenFound = false, talentPoolFound = false;
        
        // Find SkillToken contract
        for (const contractName of skillTokenPaths) {
            try {
                skillTokenBytecode = deployer.readContractBytecode(contractName);
                console.log(`✅ Found ${contractName} contract`);
                skillTokenFound = true;
                break;
            } catch (error) {
                console.log(`⚠️  ${contractName} not found, trying next...`);
            }
        }
        
        // Find TalentPool contract
        for (const contractName of talentPoolPaths) {
            try {
                talentPoolBytecode = deployer.readContractBytecode(contractName);
                console.log(`✅ Found ${contractName} contract`);
                talentPoolFound = true;
                break;
            } catch (error) {
                console.log(`⚠️  ${contractName} not found, trying next...`);
            }
        }
        
        if (!skillTokenFound || !talentPoolFound) {
            console.error("\n❌ Required contracts not found!");
            console.error("Please run 'npm run compile' first to compile the contracts.");
            console.error("\nMake sure you have one of these contracts:");
            console.error("- contracts/SkillToken.sol or contracts/SkillTokenEnhanced.sol");
            console.error("- contracts/TalentPool.sol or contracts/TalentPoolEnhanced.sol");
            process.exit(1);
        }

        // Deploy SkillToken contract
        console.log("\n1️⃣  Deploying SkillToken contract...");
        const skillTokenParams = [deployer.operatorId.toSolidityAddress()]; // initialOwner
        
        const skillTokenDeployment = await deployer.deployContract(
            "SkillToken",
            skillTokenBytecode,
            skillTokenParams,
            4000000
        );
        
        deployments.skillToken = skillTokenDeployment;
        
        if (!skillTokenDeployment.success) {
            console.error("❌ SkillToken deployment failed. Aborting.");
            process.exit(1);
        }
        
        // Wait a bit for the contract to be available
        console.log("⏳ Waiting for contract to be available...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Deploy TalentPool contract
        console.log("\n2️⃣  Deploying TalentPool contract...");
        const talentPoolParams = [
            skillTokenDeployment.contractId, // skillToken address
            deployer.operatorId.toSolidityAddress(), // feeCollector
            deployer.operatorId.toSolidityAddress()  // initialAdmin
        ];
        
        const talentPoolDeployment = await deployer.deployContract(
            "TalentPool",
            talentPoolBytecode,
            talentPoolParams,
            4000000
        );
        
        deployments.talentPool = talentPoolDeployment;
        
        // Setup initial configuration
        if (skillTokenDeployment.success && talentPoolDeployment.success) {
            console.log("\\n3️⃣  Setting up initial configuration...");
            
            // Add TalentPool as minter role to SkillToken
            const addMinterResult = await deployer.callContractFunction(
                skillTokenDeployment.contractId,
                "grantRole",
                [
                    "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", // MINTER_ROLE hash
                    talentPoolDeployment.contractId
                ],
                200000
            );
            
            if (addMinterResult.success) {
                console.log("✅ TalentPool granted MINTER_ROLE on SkillToken");
            }
        }
        
        // Save deployment information
        deployer.saveDeploymentInfo(deployments);
        
        // Print deployment summary
        console.log("\\n🎉 DEPLOYMENT COMPLETE!");
        console.log("=" .repeat(50));
        console.log(`Network: ${deployer.network}`);
        console.log(`Operator: ${deployer.operatorId.toString()}`);
        console.log("\\nDeployed Contracts:");
        
        Object.entries(deployments).forEach(([name, deployment]) => {
            if (deployment.success) {
                console.log(`  📄 ${name}:`);
                console.log(`     Contract ID: ${deployment.contractId}`);
                console.log(`     Explorer: ${deployment.explorerUrl}`);
            }
        });
        
        console.log("\\n💡 Next Steps:");
        console.log("1. Update your frontend with the contract addresses");
        console.log("2. Start the backend server to test API integration");
        console.log("3. Test contract functions through the web interface");
        
    } catch (error) {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    }
}

// Execute deployment if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    HederaContractDeployer,
    NETWORKS
};