#!/usr/bin/env python3
"""
Deploy SkillToken contract to Hedera testnet.

This script deploys the SkillToken smart contract to the Hedera testnet
using the credentials from the .env file.
"""

import os
import sys
from dotenv import load_dotenv
from hedera import (
    Client, 
    ContractCreateFlow,
    Hbar,
    PrivateKey,
    FileCreateTransaction,
    ContractFunctionParameters
)

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def deploy_contract():
    """
    Deploy the SkillToken contract to Hedera testnet.
    
    Returns:
        str: The deployed contract ID
    """
    # Get Hedera credentials
    operator_id = os.getenv("HEDERA_OPERATOR_ID")
    operator_key = os.getenv("HEDERA_OPERATOR_KEY")
    
    if not operator_id or not operator_key:
        raise ValueError("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env")
    
    # Initialize Hedera client
    client = Client.forTestnet()
    
    # Remove '0x' prefix if present
    if operator_key.startswith("0x"):
        operator_key = operator_key[2:]
    
    # Set operator
    private_key = PrivateKey.fromString(operator_key)
    client.setOperator(operator_id, private_key)
    client.setMaxTransactionFee(Hbar(20))
    
    # Check if bytecode file exists
    bytecode_path = "../contracts/SkillToken_sol_SkillToken.bin"
    if not os.path.exists(bytecode_path):
        print(f"Error: Bytecode file not found at {bytecode_path}")
        print("Please compile the SkillToken.sol contract first using Hardhat or Solidity compiler.")
        print("Example: solc --bin --abi contracts/SkillToken.sol -o contracts/")
        sys.exit(1)
    
    # Read contract bytecode
    with open(bytecode_path, "r") as file:
        contract_bytecode = file.read().strip()
    
    print(f"Deploying SkillToken contract using account {operator_id}...")
    
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
    contract_id = contract_receipt.contractId.toString()
    
    print(f"Contract deployed successfully!")
    print(f"Contract ID: {contract_id}")
    print("\nUpdate your .env file with:")
    print(f"CONTRACT_SKILL_TOKEN={contract_id}")
    
    return contract_id

if __name__ == "__main__":
    deploy_contract()
