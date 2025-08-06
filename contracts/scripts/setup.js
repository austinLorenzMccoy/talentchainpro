const {
    Client,
    PrivateKey,
    AccountId
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Setup script for TalentChain Pro
 * This script helps with initial configuration and validation
 */

class TalentChainSetup {
    constructor() {
        this.rootPath = path.join(__dirname, "..", "..");
    }

    /**
     * Validate environment configuration
     */
    async validateEnvironment() {
        console.log("🔍 Validating environment configuration...\n");

        // Check for required environment variables
        const requiredVars = [
            'HEDERA_NETWORK',
            'HEDERA_ACCOUNT_ID', 
            'HEDERA_PRIVATE_KEY'
        ];

        const missing = [];
        requiredVars.forEach(varName => {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        });

        if (missing.length > 0) {
            console.error("❌ Missing required environment variables:");
            missing.forEach(varName => {
                console.error(`   - ${varName}`);
            });
            console.error("\nPlease copy .env.example to .env and fill in your Hedera account details.");
            console.error("You can get a Hedera testnet account at: https://portal.hedera.com/");
            return false;
        }

        // Validate Hedera connection
        try {
            const network = process.env.HEDERA_NETWORK || "testnet";
            const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
            const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

            let client;
            if (network === "mainnet") {
                client = Client.forMainnet();
            } else {
                client = Client.forTestnet();
            }

            client.setOperator(accountId, privateKey);

            // Test connection by getting account balance
            const balance = await client.getAccountBalance(accountId);
            
            console.log("✅ Hedera connection validated successfully!");
            console.log(`   Network: ${network}`);
            console.log(`   Account: ${accountId.toString()}`);
            console.log(`   Balance: ${balance.hbars.toString()}`);

            client.close();
            return true;

        } catch (error) {
            console.error("❌ Hedera connection failed:", error.message);
            console.error("\nPlease check your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env file.");
            return false;
        }
    }

    /**
     * Check project structure and dependencies
     */
    async checkProjectStructure() {
        console.log("\n🏗️  Checking project structure...\n");

        const requiredDirs = [
            'contracts',
            'frontend',
            'backend'
        ];

        const optionalDirs = [
            'docs',
            'scripts'
        ];

        // Check required directories
        let allGood = true;
        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.rootPath, dir);
            if (fs.existsSync(dirPath)) {
                console.log(`✅ ${dir}/ directory exists`);
            } else {
                console.error(`❌ ${dir}/ directory missing`);
                allGood = false;
            }
        });

        // Check optional directories
        optionalDirs.forEach(dir => {
            const dirPath = path.join(this.rootPath, dir);
            if (fs.existsSync(dirPath)) {
                console.log(`✅ ${dir}/ directory exists`);
            } else {
                console.log(`⚠️  ${dir}/ directory missing (optional)`);
            }
        });

        return allGood;
    }

    /**
     * Check smart contract compilation
     */
    async checkContractCompilation() {
        console.log("\n🔧 Checking smart contract compilation...\n");

        const artifactsPath = path.join(this.rootPath, "contracts", "artifacts");
        
        if (!fs.existsSync(artifactsPath)) {
            console.log("⚠️  Contracts not compiled yet");
            console.log("   Run: cd contracts && npm run compile");
            return false;
        }

        // Check for specific contract artifacts
        const contractChecks = [
            "SkillToken.sol",
            "SkillTokenEnhanced.sol", 
            "TalentPool.sol",
            "TalentPoolEnhanced.sol"
        ];

        let foundContracts = 0;
        contractChecks.forEach(contractFile => {
            const contractName = contractFile.replace(".sol", "");
            const artifactPath = path.join(artifactsPath, "contracts", contractFile, `${contractName}.json`);
            
            if (fs.existsSync(artifactPath)) {
                console.log(`✅ ${contractName} compiled successfully`);
                foundContracts++;
            }
        });

        if (foundContracts === 0) {
            console.log("❌ No contract artifacts found");
            console.log("   Run: cd contracts && npm run compile");
            return false;
        }

        console.log(`\n✅ Found ${foundContracts} compiled contract(s)`);
        return true;
    }

    /**
     * Create missing environment files
     */
    async createEnvironmentFiles() {
        console.log("\n📝 Setting up environment files...\n");

        // Root .env file
        const rootEnvPath = path.join(this.rootPath, ".env");
        const rootEnvExamplePath = path.join(this.rootPath, ".env.example");
        
        if (!fs.existsSync(rootEnvPath) && fs.existsSync(rootEnvExamplePath)) {
            fs.copyFileSync(rootEnvExamplePath, rootEnvPath);
            console.log("✅ Created root .env file from .env.example");
            console.log("   Please update .env with your Hedera account details");
        }

        // Backend .env file
        const backendDir = path.join(this.rootPath, "backend");
        if (fs.existsSync(backendDir)) {
            const backendEnvPath = path.join(backendDir, ".env");
            const backendEnvExamplePath = path.join(backendDir, ".env.example");
            
            if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
                fs.copyFileSync(backendEnvExamplePath, backendEnvPath);
                console.log("✅ Created backend/.env file");
            }
        }

        // Frontend .env.local file
        const frontendDir = path.join(this.rootPath, "frontend");
        if (fs.existsSync(frontendDir)) {
            const frontendEnvPath = path.join(frontendDir, ".env.local");
            const frontendEnvExamplePath = path.join(frontendDir, ".env.local.example");
            
            if (!fs.existsSync(frontendEnvPath) && fs.existsSync(frontendEnvExamplePath)) {
                fs.copyFileSync(frontendEnvExamplePath, frontendEnvPath);
                console.log("✅ Created frontend/.env.local file");
            }
        }
    }

    /**
     * Display deployment readiness status
     */
    displayDeploymentStatus(envValid, structureValid, contractsCompiled) {
        console.log("\n" + "=".repeat(50));
        console.log("🚀 DEPLOYMENT READINESS STATUS");
        console.log("=".repeat(50));

        console.log(`Environment Configuration: ${envValid ? '✅ Ready' : '❌ Not Ready'}`);
        console.log(`Project Structure: ${structureValid ? '✅ Ready' : '❌ Not Ready'}`);
        console.log(`Smart Contracts: ${contractsCompiled ? '✅ Compiled' : '⚠️  Need Compilation'}`);

        if (envValid && structureValid && contractsCompiled) {
            console.log("\n🎉 Ready for deployment!");
            console.log("\nNext steps:");
            console.log("1. Run: cd contracts && npm run deploy");
            console.log("2. Start backend: cd backend && uvicorn app.main:app --reload");
            console.log("3. Start frontend: cd frontend && npm run dev");
        } else {
            console.log("\n⚠️  Please resolve the issues above before deployment.");
            
            if (!envValid) {
                console.log("\n📋 Environment Setup:");
                console.log("1. Get a Hedera testnet account: https://portal.hedera.com/");
                console.log("2. Copy .env.example to .env");
                console.log("3. Add your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY");
            }
            
            if (!contractsCompiled) {
                console.log("\n📋 Contract Compilation:");
                console.log("1. cd contracts");
                console.log("2. npm install");
                console.log("3. npm run compile");
            }
        }
        
        console.log("\n📚 Documentation:");
        console.log("- Project README: ../README.md");
        console.log("- Frontend PRD: ../docs/frontend-prd.md");
        console.log("- Hedera Docs: https://docs.hedera.com/");
    }
}

/**
 * Main setup function
 */
async function main() {
    console.log("🌟 TalentChain Pro - Project Setup & Validation");
    console.log("=".repeat(50));
    
    const setup = new TalentChainSetup();
    
    try {
        // Create missing environment files first
        await setup.createEnvironmentFiles();
        
        // Validate environment
        const envValid = await setup.validateEnvironment();
        
        // Check project structure
        const structureValid = await setup.checkProjectStructure();
        
        // Check contract compilation
        const contractsCompiled = await setup.checkContractCompilation();
        
        // Display final status
        setup.displayDeploymentStatus(envValid, structureValid, contractsCompiled);
        
    } catch (error) {
        console.error("💥 Setup failed:", error);
        process.exit(1);
    }
}

// Execute setup if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    TalentChainSetup
};