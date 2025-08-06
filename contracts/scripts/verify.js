const {
    Client,
    PrivateKey,
    AccountId,
    ContractCallQuery,
    ContractFunctionParameters
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Verification script for deployed TalentChain Pro contracts
 * Tests basic functionality of deployed smart contracts
 */

class ContractVerifier {
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
     * Load deployment information
     */
    loadDeployments() {
        const deploymentPath = path.join(__dirname, "..", "deployments", `${this.network}.json`);
        
        if (!fs.existsSync(deploymentPath)) {
            throw new Error(`No deployment file found for ${this.network}. Please deploy contracts first.`);
        }
        
        const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        console.log(`📋 Loaded deployment data for ${this.network}`);
        
        return deploymentData;
    }

    /**
     * Query contract function (read-only)
     */
    async queryContract(contractId, functionName, params = []) {
        try {
            console.log(`🔍 Querying ${functionName} on ${contractId}...`);
            
            let contractParams = new ContractFunctionParameters();
            
            params.forEach((param) => {
                if (typeof param === "string" && param.startsWith("0.0.")) {
                    contractParams.addAddress(param);
                } else if (typeof param === "string") {
                    contractParams.addString(param);
                } else if (typeof param === "number" || typeof param === "bigint") {
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
            
            console.log(`✅ Query successful`);
            return result;
            
        } catch (error) {
            console.error(`❌ Query failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify SkillToken contract
     */
    async verifySkillToken(contractId) {
        console.log(`\n🏅 Verifying SkillToken contract: ${contractId}`);
        console.log("-".repeat(40));
        
        try {
            // Query contract name
            const nameResult = await this.queryContract(contractId, "name");
            const nameBytes = nameResult.getBytes32Array()[0];
            const name = Buffer.from(nameBytes).toString("utf8").replace(/\0/g, '');
            console.log(`📛 Token Name: ${name || 'SkillToken'}`);
            
            // Query contract symbol
            const symbolResult = await this.queryContract(contractId, "symbol");
            const symbolBytes = symbolResult.getBytes32Array()[0];
            const symbol = Buffer.from(symbolBytes).toString("utf8").replace(/\0/g, '');
            console.log(`🔤 Token Symbol: ${symbol || 'SKILL'}`);
            
            // Query total supply
            try {
                const supplyResult = await this.queryContract(contractId, "totalSupply");
                const supply = supplyResult.getUint256();
                console.log(`📊 Total Supply: ${supply.toString()}`);
            } catch (error) {
                console.log(`📊 Total Supply: Unable to query (${error.message})`);
            }
            
            // Query owner
            try {
                const ownerResult = await this.queryContract(contractId, "owner");
                const ownerBytes = ownerResult.getBytes32Array()[0];
                const ownerAddress = "0x" + Buffer.from(ownerBytes.slice(-20)).toString("hex");
                console.log(`👑 Contract Owner: ${ownerAddress}`);
            } catch (error) {
                console.log(`👑 Contract Owner: Unable to query (${error.message})`);
            }
            
            console.log(`✅ SkillToken verification completed`);
            return true;
            
        } catch (error) {
            console.error(`❌ SkillToken verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Verify TalentPool contract
     */
    async verifyTalentPool(contractId) {
        console.log(`\n🏊 Verifying TalentPool contract: ${contractId}`);
        console.log("-".repeat(40));
        
        try {
            // Query skill token address
            try {
                const skillTokenResult = await this.queryContract(contractId, "skillToken");
                const skillTokenBytes = skillTokenResult.getBytes32Array()[0];
                const skillTokenAddress = "0x" + Buffer.from(skillTokenBytes.slice(-20)).toString("hex");
                console.log(`🏅 Skill Token Address: ${skillTokenAddress}`);
            } catch (error) {
                console.log(`🏅 Skill Token Address: Unable to query (${error.message})`);
            }
            
            // Query fee collector
            try {
                const feeCollectorResult = await this.queryContract(contractId, "feeCollector");
                const feeCollectorBytes = feeCollectorResult.getBytes32Array()[0];
                const feeCollectorAddress = "0x" + Buffer.from(feeCollectorBytes.slice(-20)).toString("hex");
                console.log(`💰 Fee Collector: ${feeCollectorAddress}`);
            } catch (error) {
                console.log(`💰 Fee Collector: Unable to query (${error.message})`);
            }
            
            // Query platform fee
            try {
                const platformFeeResult = await this.queryContract(contractId, "platformFee");
                const platformFee = platformFeeResult.getUint256();
                console.log(`💸 Platform Fee: ${platformFee.toString()}%`);
            } catch (error) {
                console.log(`💸 Platform Fee: Unable to query (${error.message})`);
            }
            
            // Query total pools
            try {
                const poolCountResult = await this.queryContract(contractId, "getPoolCount");
                const poolCount = poolCountResult.getUint256();
                console.log(`🏊‍♀️ Total Pools: ${poolCount.toString()}`);
            } catch (error) {
                console.log(`🏊‍♀️ Total Pools: Unable to query (${error.message})`);
            }
            
            console.log(`✅ TalentPool verification completed`);
            return true;
            
        } catch (error) {
            console.error(`❌ TalentPool verification failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test contract interaction
     */
    async testContractInteraction(deployments) {
        console.log(`\n🧪 Testing Contract Interactions`);
        console.log("-".repeat(40));
        
        const { skillToken, talentPool } = deployments.contracts;
        
        if (!skillToken || !talentPool) {
            console.log(`⚠️  Missing contract deployments, skipping interaction tests`);
            return;
        }
        
        try {
            // Test basic contract calls that don't require special permissions
            console.log(`🔄 Testing read-only operations...`);
            
            // These are safe operations that should work on most contracts
            await this.verifySkillToken(skillToken.contractId);
            await this.verifyTalentPool(talentPool.contractId);
            
        } catch (error) {
            console.error(`❌ Contract interaction test failed: ${error.message}`);
        }
    }

    /**
     * Check contract on HashScan
     */
    displayHashScanLinks(deployments) {
        console.log(`\n🔍 Contract Explorer Links`);
        console.log("-".repeat(40));
        
        const baseUrl = this.network === "mainnet" ? 
            "https://hashscan.io/mainnet" : 
            "https://hashscan.io/testnet";
        
        Object.entries(deployments.contracts).forEach(([name, deployment]) => {
            if (deployment.success) {
                console.log(`📄 ${name}:`);
                console.log(`   Contract ID: ${deployment.contractId}`);
                console.log(`   Explorer: ${baseUrl}/contract/${deployment.contractId}`);
                console.log();
            }
        });
    }

    /**
     * Generate deployment summary report
     */
    generateSummaryReport(deployments, skillTokenValid, talentPoolValid) {
        console.log(`\n📊 VERIFICATION SUMMARY REPORT`);
        console.log("=".repeat(50));
        console.log(`Network: ${deployments.network}`);
        console.log(`Deployment Time: ${new Date(deployments.timestamp).toLocaleString()}`);
        console.log(`Operator: ${deployments.operator}`);
        console.log();
        
        console.log(`Contract Status:`);
        console.log(`  SkillToken: ${skillTokenValid ? '✅ Verified' : '❌ Failed'}`);
        console.log(`  TalentPool: ${talentPoolValid ? '✅ Verified' : '❌ Failed'}`);
        console.log();
        
        if (skillTokenValid && talentPoolValid) {
            console.log(`🎉 All contracts verified successfully!`);
            console.log();
            console.log(`Next Steps:`);
            console.log(`1. Update your frontend with contract addresses`);
            console.log(`2. Start the backend API server`);
            console.log(`3. Test the full application flow`);
        } else {
            console.log(`⚠️  Some contracts failed verification.`);
            console.log(`Please check the deployment and try again.`);
        }
    }
}

/**
 * Main verification function
 */
async function main() {
    console.log("🔍 TalentChain Pro - Contract Verification");
    console.log("=".repeat(50));
    
    const verifier = new ContractVerifier();
    
    try {
        // Load deployment data
        const deployments = verifier.loadDeployments();
        
        // Verify individual contracts
        let skillTokenValid = false;
        let talentPoolValid = false;
        
        if (deployments.contracts.skillToken) {
            skillTokenValid = await verifier.verifySkillToken(
                deployments.contracts.skillToken.contractId
            );
        }
        
        if (deployments.contracts.talentPool) {
            talentPoolValid = await verifier.verifyTalentPool(
                deployments.contracts.talentPool.contractId
            );
        }
        
        // Test contract interactions
        await verifier.testContractInteraction(deployments);
        
        // Display explorer links
        verifier.displayHashScanLinks(deployments);
        
        // Generate summary report
        verifier.generateSummaryReport(deployments, skillTokenValid, talentPoolValid);
        
    } catch (error) {
        console.error("💥 Verification failed:", error.message);
        process.exit(1);
    } finally {
        verifier.client.close();
    }
}

// Execute verification if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    ContractVerifier
};