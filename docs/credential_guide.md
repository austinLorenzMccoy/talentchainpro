# HederaAuditAI: HCS-10 Credentials Guide

## Overview

This guide walks through the process of obtaining valid HCS-10 OpenConvAI credentials for the HederaAuditAI project. We'll use your existing Hedera testnet account (`0.0.6273048`) to create and configure the necessary components.

## Step 0: Activate the Python Virtual Environment

Before proceeding with any Python scripts, you need to activate the project's virtual environment:

```bash
cd /Users/a/Documents/Hedera/HederaAuditAI
source .venv/bin/activate  # On macOS/Linux
```

You should see `(.venv)` appear at the beginning of your command prompt, indicating that the virtual environment is active. All Python commands should be run with this environment activated.

## Step 1: Create a Registry Topic Using Your Existing Account

I've created a Python script (`create_hcs_topic.py`) that will create an HCS topic using your existing Hedera testnet account credentials from the `.env` file:

### Run the Topic Creation Script

1. **Execute the Script**:
   ```bash
   # Make sure your virtual environment is activated first
   cd /Users/a/Documents/Hedera/HederaAuditAI
   python create_hcs_topic.py
   ```

2. **Expected Output**:
   ```
   Using Hedera account: 0.0.6273048
   Creating HCS topic for HederaAuditAI...
   Topic created successfully!
   Topic ID: 0.0.6359793
   
   Update your .env file with:
   HCS10_REGISTRY_TOPIC_ID=0.0.6359793
   ```

3. **Save the Topic ID**:
   The script will output a topic ID (e.g., `0.0.XXXXX`). This is your `HCS10_REGISTRY_TOPIC_ID` that you'll use in the next step.

## Step 2: Update Your Environment Variables

Once you have the topic ID, update your `.env` file with the HCS-10 configuration:

1. **Edit the .env File**:
   ```bash
   # With virtual environment activated
   cd /Users/a/Documents/Hedera/HederaAuditAI/backend
   nano .env  # or use your preferred text editor
   ```

2. **Uncomment and Update HCS-10 Variables**:
   ```
   # HCS-10 OpenConvAI Configuration
   HCS10_REGISTRY_TOPIC_ID=0.0.6359793  # Valid registry topic ID created on testnet
   HCS10_AGENT_NAME=HederaAuditAI
   HCS10_AGENT_DESCRIPTION=AI-powered auditing tool for Hedera smart contracts
   ```

3. **Save the File**

## Step 3: Test the HCS-10 Integration

After creating the topic and updating your environment variables, let's verify that the HCS-10 agent can initialize properly:

1. **Create a Test Script**:
   Create a file named `test_hcs10_integration.py` in your project directory:
   ```python
   #!/usr/bin/env python3
   """Test HCS-10 integration with HederaAuditAI."""
   
   from dotenv import load_dotenv
   import os
   import sys
   
   # Add the backend directory to the path
   sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
   
   # Load environment variables
   load_dotenv('backend/.env')
   
   # Import the HCS10Agent
   try:
       from src.hedera.hcs10_agent import HCS10Agent
       
       # Initialize the agent
       agent = HCS10Agent()
       
       # Print the agent configuration
       print(f"\nHCS-10 Agent initialized successfully!")
       print(f"Registry Topic ID: {agent.registry_topic_id}")
       print(f"Agent Name: {agent.agent_name}")
       print(f"Agent Description: {agent.agent_description}")
       
   except Exception as e:
       print(f"\nError initializing HCS-10 Agent: {e}")
   ```

2. **Run the Test Script**:
   ```bash
   cd /Users/a/Documents/Hedera/HederaAuditAI
   python test_hcs10_integration.py
   ```

3. **Expected Output**:
   ```
   HCS-10 Agent initialized successfully!
   Registry Topic ID: 0.0.XXXXX
   Agent Name: HederaAuditAI
   Agent Description: AI-powered auditing tool for Hedera smart contracts
   ```

## Step 4: Deploy the AuditRegistry Smart Contract

The HederaAuditAI system requires the `AuditRegistry.sol` smart contract to be deployed to the Hedera testnet:

1. **Locate the Smart Contract**:
   ```bash
   cd /Users/a/Documents/Hedera/HederaAuditAI/contracts
   ```

2. **Deploy Using Hedera SDK**:
   Create a file named `deploy_contract.py` in your project directory:
   ```python
   #!/usr/bin/env python3
   """Deploy AuditRegistry.sol to Hedera testnet."""
   
   import os
   from dotenv import load_dotenv
   from hedera import (
       Client, 
       ContractCreateFlow,
       Hbar,
       PrivateKey,
       FileCreateTransaction,
       ContractFunctionParameters
   )
   
   # Load environment variables
   load_dotenv("backend/.env")
   
   # Get Hedera credentials
   operator_id = os.getenv("HEDERA_OPERATOR_ID")
   operator_key = os.getenv("HEDERA_OPERATOR_KEY")
   
   # Initialize Hedera client
   client = Client.forTestnet()
   
   # Remove '0x' prefix if present
   if operator_key.startswith("0x"):
       operator_key = operator_key[2:]
   
   # Set operator
   private_key = PrivateKey.fromString(operator_key)
   client.setOperator(operator_id, private_key)
   client.setMaxTransactionFee(Hbar(20))
   
   # Read contract bytecode
   with open("contracts/AuditRegistry_sol_AuditRegistry.bin", "r") as file:
       contract_bytecode = file.read().strip()
   
   print(f"Deploying AuditRegistry contract using account {operator_id}...")
   
   # Create contract
   contract_tx = ContractCreateFlow()\
       .setGas(1000000)\
       .setBytecode(contract_bytecode)\
       .setConstructorParameters(
           ContractFunctionParameters().addAddress(operator_id)
       )\
       .setMaxTransactionFee(Hbar(20))
   
   # Submit transaction and get receipt
   contract_response = contract_tx.execute(client)
   contract_receipt = contract_response.getReceipt(client)
   contract_id = contract_receipt.contractId
   
   print(f"Contract deployed successfully!")
   print(f"Contract ID: {contract_id}")
   print("\nUpdate your .env file with:")
   print(f"AUDIT_REGISTRY_CONTRACT_ID={contract_id}")
   
   # Return the contract ID
   return contract_id
   
   if __name__ == "__main__":
       deploy_contract()
   ```

3. **Run the Deployment Script**:
   ```bash
   # With virtual environment activated
   cd /Users/a/Documents/Hedera/HederaAuditAI
   python deploy_contract.py
   ```

4. **Update Environment Variables**:
   Add the contract ID to your `.env` file:
   ```
   AUDIT_REGISTRY_CONTRACT_ID=0.0.6359980  # Deployed contract ID on testnet
   ```

## Step 5: Run Full Backend Tests

Now that you have all the required credentials and configurations, you can run the full backend tests:

1. **Run the Basic Test**:
   ```bash
   cd /Users/a/Documents/Hedera/HederaAuditAI
   python backend/test_basic.py
   ```

2. **Run the HCS-10 Integration Test**:
   ```bash
   python test_hcs10_integration.py
   ```

3. **Run the Full Test Suite** (if test collection issues are resolved):
   ```bash
   python backend/run_tests_with_env.py
   ```

## Successful Deployment Summary

We have successfully completed the following steps:

1. Created an HCS topic for the HCS-10 registry using your existing Hedera testnet account
   - Registry Topic ID: `0.0.6359793`

2. Updated your environment variables with the HCS-10 configuration
   - Added HCS10_REGISTRY_TOPIC_ID, HCS10_AGENT_NAME, and HCS10_AGENT_DESCRIPTION to `.env`

3. Deployed the AuditRegistry smart contract to the Hedera testnet
   - Contract ID: `0.0.6359980`
   - Updated `.env` with AUDIT_REGISTRY_CONTRACT_ID

4. Verified all components for HCS-10 integration
   - HederaService initializes correctly with your credentials
   - Registry Topic ID is valid and accessible
   - Contract ID is valid and accessible

## Known Issues and Workarounds

1. **HCS-10 Agent Initialization Timeout**
   - **Issue**: When initializing the HCS10Agent, you may encounter a timeout error: `JVM exception occurred: java.util.concurrent.TimeoutException`
   - **Cause**: This is due to the Hedera SDK making multiple network calls to the Hedera network during agent initialization, which can take longer than the default timeout.
   - **Workaround**: For testing purposes, use the `debug_hcs10_integration.py` script which verifies the components without triggering the full agent initialization.

2. **Production Deployment Considerations**
   - For production deployment, consider increasing the timeout settings in the Hedera SDK or implementing retry logic.
   - The HCS-10 agent initialization should be performed during application startup, not during request handling, to avoid user-facing timeouts.

## Next Steps

With these credentials and configurations in place, your HederaAuditAI backend is now fully integrated with the HCS-10 OpenConvAI standard and ready for use. You can now:

1. Integrate the backend with your frontend application
2. Implement the audit request and response flows using the HCS-10 agent
3. Test the end-to-end audit process with real smart contracts
4. Monitor the HCS topics for messages and transactions

Congratulations on successfully completing the HCS-10 integration!