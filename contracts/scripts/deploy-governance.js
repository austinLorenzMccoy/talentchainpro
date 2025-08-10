const {
    Client,
    PrivateKey,
    AccountId,
    ContractCreateFlow,
    ContractFunctionParameters,
    Hbar
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

class GovernanceDeployer {
    constructor() {
        this.network = process.env.HEDERA_NETWORK || "testnet";
        this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
        
        // Handle private key properly
        let privateKeyString = process.env.HEDERA_PRIVATE_KEY;
        
        if (privateKeyString.length > 64 && !privateKeyString.startsWith("0x")) {
            console.log("🔑 Using DER format private key...");
            this.operatorKey = PrivateKey.fromStringDer(privateKeyString);
        } else if (privateKeyString.startsWith("0x")) {
            privateKeyString = privateKeyString.slice(2);
            this.operatorKey = PrivateKey.fromStringECDSA(privateKeyString);
        } else {
            this.operatorKey = PrivateKey.fromStringECDSA(privateKeyString);
        }
        
        // Initialize client
        this.client = Client.forName(this.network);
        this.client.setOperator(this.operatorId, this.operatorKey);
        
        console.log(`🌐 Connected to Hedera ${this.network}`);
        console.log(`👤 Operator Account: ${this.operatorId.toString()}`);
    }

    readContractBytecode(contractName) {
        const contractPath = "governance/Governance.sol";
        const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", contractPath, `${contractName}.json`);
        
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Contract artifact not found for ${contractName}. Expected: ${artifactPath}`);
        }
        
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        return artifact.bytecode;
    }

    async deployGovernance(skillTokenAddress) {
        try {
            console.log("\n🚀 Deploying Governance contract...");
            console.log(`⛽ Gas limit: 6,000,000`);
            
            // Read bytecode
            const governanceBytecode = this.readContractBytecode("Governance");
            const cleanBytecode = governanceBytecode.startsWith("0x") ? governanceBytecode.slice(2) : governanceBytecode;
            
            // Create contract parameters
            let contractParams = new ContractFunctionParameters();
            
            // Add parameters one by one to avoid struct issues
            contractParams.addAddress(skillTokenAddress); // skillToken address
            contractParams.addAddress(this.operatorId.toSolidityAddress()); // initialAdmin
            
            // Add GovernanceSettings struct parameters individually
            contractParams.addUint256(86400);   // votingDelay (24 hours)
            contractParams.addUint256(604800);  // votingPeriod (7 days)
            contractParams.addUint256(172800);  // executionDelay (48 hours)
            contractParams.addUint256("1000000000000000000"); // proposalThreshold (1 token as string)
            contractParams.addUint32(20);       // quorumPercentage (20%)
            contractParams.addUint256(43200);   // emergencyVotingPeriod (12 hours)
            contractParams.addUint32(30);       // emergencyQuorumPercentage (30%)
            
            // Deploy contract
            const contractCreateFlow = new ContractCreateFlow()
                .setGas(6000000)
                .setBytecode(cleanBytecode)
                .setConstructorParameters(contractParams);
            
            console.log("📝 Submitting governance contract creation transaction...");
            const txResponse = await contractCreateFlow.execute(this.client);
            const receipt = await txResponse.getReceipt(this.client);
            
            const contractId = receipt.contractId;
            const transactionId = txResponse.transactionId;
            
            console.log(`✅ Governance deployed successfully!`);
            console.log(`📄 Contract ID: ${contractId.toString()}`);
            console.log(`🔗 Transaction ID: ${transactionId.toString()}`);
            console.log(`🔍 Explorer: https://hashscan.io/${this.network}/contract/${contractId.toString()}`);
            
            return {
                contractId: contractId.toString(),
                transactionId: transactionId.toString(),
                contractAddress: contractId.toSolidityAddress(),
                explorerUrl: `https://hashscan.io/${this.network}/contract/${contractId.toString()}`,
                success: true
            };
            
        } catch (error) {
            console.error(`❌ Failed to deploy Governance:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    updateEnvironmentFiles(contractId) {
        console.log("\n📝 Updating environment files...");
        
        // Update contracts .env
        const contractsEnvPath = path.join(__dirname, "..", ".env");
        this.updateEnvFile(contractsEnvPath, "CONTRACT_GOVERNANCE", contractId);
        
        // Update backend .env
        const backendEnvPath = path.join(__dirname, "..", "..", "backend", ".env");
        this.updateEnvFile(backendEnvPath, "CONTRACT_GOVERNANCE", contractId);
        
        // Update frontend .env.local
        const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env.local");
        this.updateEnvFile(frontendEnvPath, "NEXT_PUBLIC_CONTRACT_GOVERNANCE", contractId);
        
        // Update root .env
        const rootEnvPath = path.join(__dirname, "..", "..", ".env");
        this.updateEnvFile(rootEnvPath, "CONTRACT_GOVERNANCE", contractId);
        this.updateEnvFile(rootEnvPath, "NEXT_PUBLIC_CONTRACT_GOVERNANCE", contractId);
    }
    
    updateEnvFile(envPath, envVar, contractId) {
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, "utf8");
            
            const regex = new RegExp(`^${envVar}=.*$`, "m");
            if (envContent.match(regex)) {
                envContent = envContent.replace(regex, `${envVar}=${contractId}`);
            } else {
                envContent += `\n${envVar}=${contractId}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log(`✅ Updated ${envPath}`);
        }
    }
}

async function main() {
    console.log("🏛️ TalentChain Pro - Governance Contract Deployment");
    console.log("=" .repeat(50));
    
    // Get the SkillToken address from environment
    const skillTokenId = process.env.CONTRACT_SKILLTOKEN;
    if (!skillTokenId) {
        console.error("❌ CONTRACT_SKILLTOKEN not found in environment variables!");
        console.error("Please make sure the SkillToken contract is deployed first.");
        process.exit(1);
    }
    
    console.log(`📄 Using SkillToken: ${skillTokenId}`);
    
    const deployer = new GovernanceDeployer();
    
    try {
        // Convert SkillToken ID to Solidity address format
        const skillTokenAddress = AccountId.fromString(skillTokenId).toSolidityAddress();
        console.log(`🔗 SkillToken Address: ${skillTokenAddress}`);
        
        // Deploy governance contract
        const result = await deployer.deployGovernance(skillTokenAddress);
        
        if (result.success) {
            console.log("\n🎉 GOVERNANCE DEPLOYMENT COMPLETE!");
            console.log("=" .repeat(50));
            console.log(`📄 Contract ID: ${result.contractId}`);
            console.log(`🔗 Transaction ID: ${result.transactionId}`);
            console.log(`🔍 Explorer: ${result.explorerUrl}`);
            
            // Update environment files
            deployer.updateEnvironmentFiles(result.contractId);
            
            console.log("\n💡 Next Steps:");
            console.log("1. Governance contract is now fully deployed");
            console.log("2. All environment files have been updated");
            console.log("3. You can now test the complete TalentChain Pro ecosystem");
            
        } else {
            console.error("\n❌ GOVERNANCE DEPLOYMENT FAILED!");
            console.error(`Error: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { GovernanceDeployer };
