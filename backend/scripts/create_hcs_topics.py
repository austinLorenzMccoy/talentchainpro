#!/usr/bin/env python3
"""
Create HCS topics for TalentChain Pro.

This script creates the necessary HCS topics for the TalentChain Pro project:
1. Reputation Topic - For storing reputation scores and updates
2. Registry Topic - For the HCS-10 skill registry
"""

import os
import sys
from dotenv import load_dotenv
from hedera import (
    Client, 
    AccountId, 
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    Hbar
)

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

def create_hcs_topic(memo, submit_key=None):
    """
    Create an HCS topic with the specified memo.
    
    Args:
        memo (str): Topic memo
        submit_key (PrivateKey, optional): Submit key for the topic
        
    Returns:
        str: The created topic ID
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
    
    # Create topic transaction
    transaction = TopicCreateTransaction().setTopicMemo(memo)
    
    # Set submit key if provided
    if submit_key:
        transaction.setSubmitKey(submit_key.getPublicKey())
    
    # Execute the transaction
    print(f"Creating HCS topic with memo: {memo}...")
    response = transaction.execute(client)
    
    # Get the receipt
    receipt = response.getReceipt(client)
    topic_id = receipt.topicId.toString()
    
    print(f"Topic created successfully!")
    print(f"Topic ID: {topic_id}")
    
    return topic_id

def main():
    """Create all necessary HCS topics for TalentChain Pro."""
    # Get Hedera credentials for logging
    operator_id = os.getenv("HEDERA_OPERATOR_ID")
    print(f"Using Hedera account: {operator_id}")
    
    # Create reputation topic
    print("\n1. Creating Reputation Topic...")
    reputation_topic_id = create_hcs_topic("TalentChainPro:Reputation")
    
    # Create registry topic for HCS-10
    print("\n2. Creating Registry Topic for HCS-10...")
    registry_topic_id = create_hcs_topic("hcs-10:0:60:3:TalentChainPro:Registry")
    
    # Print summary
    print("\n=== Topic Creation Summary ===")
    print(f"Reputation Topic ID: {reputation_topic_id}")
    print(f"Registry Topic ID: {registry_topic_id}")
    
    print("\nUpdate your .env file with:")
    print(f"HCS_REPUTATION_TOPIC={reputation_topic_id}")
    print(f"HCS_REGISTRY_TOPIC={registry_topic_id}")

if __name__ == "__main__":
    main()
