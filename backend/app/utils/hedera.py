"""
Hedera Client Utility Module

This module provides utilities for interacting with the Hedera network,
including client initialization, account management, and transaction handling.
"""

import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from hedera import (
    Client, 
    AccountId, 
    PrivateKey,
    TopicId,
    TopicMessageSubmitTransaction,
    TokenId,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    Hbar
)

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Global client instance
_client: Optional[Client] = None

def initialize_hedera_client() -> Client:
    """
    Initialize the Hedera client based on environment variables.
    
    Returns:
        Client: Initialized Hedera client
    
    Raises:
        ValueError: If required environment variables are missing
    """
    global _client
    
    # Check if client already initialized
    if _client is not None:
        return _client
    
    # Get environment variables
    operator_id = os.getenv("HEDERA_OPERATOR_ID")
    operator_key = os.getenv("HEDERA_OPERATOR_KEY")
    network = os.getenv("HEDERA_NETWORK", "testnet").lower()
    
    if not operator_id or not operator_key:
        raise ValueError("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set")
    
    # Create client based on network
    if network == "mainnet":
        _client = Client.forMainnet()
    elif network == "testnet":
        _client = Client.forTestnet()
    elif network == "previewnet":
        _client = Client.forPreviewnet()
    else:
        raise ValueError(f"Invalid HEDERA_NETWORK value: {network}")
    
    # Set operator account
    _client.setOperator(
        AccountId.fromString(operator_id),
        PrivateKey.fromString(operator_key)
    )
    
    logger.info(f"Hedera client initialized for {network}")
    return _client

def get_client() -> Client:
    """
    Get the initialized Hedera client.
    
    Returns:
        Client: Initialized Hedera client
        
    Raises:
        RuntimeError: If client has not been initialized
    """
    global _client
    
    if _client is None:
        _client = initialize_hedera_client()
        
    return _client

async def submit_hcs_message(topic_id: str, message: str) -> str:
    """
    Submit a message to a Hedera Consensus Service topic.
    
    Args:
        topic_id (str): The topic ID to submit the message to
        message (str): The message to submit
        
    Returns:
        str: The transaction ID
        
    Raises:
        Exception: If the transaction fails
    """
    client = get_client()
    
    try:
        transaction = (
            TopicMessageSubmitTransaction()
            .setTopicId(TopicId.fromString(topic_id))
            .setMessage(message)
        )
        
        transaction_response = await transaction.executeAsync(client)
        receipt = await transaction_response.getReceiptAsync(client)
        
        logger.info(f"Message submitted to topic {topic_id}")
        return transaction_response.transactionId.toString()
    
    except Exception as e:
        logger.error(f"Error submitting HCS message: {str(e)}")
        raise

async def create_nft_token(
    name: str,
    symbol: str,
    metadata: Dict[str, Any],
    supply_key: Optional[PrivateKey] = None
) -> str:
    """
    Create a new non-fungible token on Hedera.
    
    Args:
        name (str): Token name
        symbol (str): Token symbol
        metadata (Dict[str, Any]): Token metadata
        supply_key (Optional[PrivateKey]): Supply key for minting tokens
        
    Returns:
        str: The token ID
        
    Raises:
        Exception: If the transaction fails
    """
    client = get_client()
    
    if supply_key is None:
        supply_key = PrivateKey.fromString(os.getenv("HEDERA_OPERATOR_KEY"))
    
    try:
        transaction = (
            TokenCreateTransaction()
            .setTokenName(name)
            .setTokenSymbol(symbol)
            .setTokenType(TokenType.NON_FUNGIBLE_UNIQUE)
            .setSupplyType(TokenSupplyType.FINITE)
            .setInitialSupply(0)
            .setMaxSupply(100)  # Adjust as needed
            .setTreasuryAccountId(client.getOperatorAccountId())
            .setAdminKey(client.getOperatorPublicKey())
            .setSupplyKey(supply_key)
            .setFreezeDefault(False)
            .setTokenMemo(str(metadata))
        )
        
        transaction_response = await transaction.executeAsync(client)
        receipt = await transaction_response.getReceiptAsync(client)
        token_id = receipt.tokenId.toString()
        
        logger.info(f"Created NFT token: {token_id}")
        return token_id
    
    except Exception as e:
        logger.error(f"Error creating NFT token: {str(e)}")
        raise

async def mint_nft(
    token_id: str,
    metadata: str,
    recipient_id: Optional[str] = None
) -> str:
    """
    Mint a new NFT and transfer it to a recipient.
    
    Args:
        token_id (str): The token ID to mint
        metadata (str): Metadata URI for the NFT
        recipient_id (Optional[str]): Recipient account ID, defaults to operator
        
    Returns:
        str: The transaction ID
        
    Raises:
        Exception: If the transaction fails
    """
    client = get_client()
    
    if recipient_id is None:
        recipient_id = client.getOperatorAccountId().toString()
    
    try:
        transaction = (
            TokenMintTransaction()
            .setTokenId(TokenId.fromString(token_id))
            .addMetadata(metadata.encode())
        )
        
        transaction_response = await transaction.executeAsync(client)
        receipt = await transaction_response.getReceiptAsync(client)
        serial_number = receipt.serials[0]
        
        logger.info(f"Minted NFT with serial {serial_number} for token {token_id}")
        return transaction_response.transactionId.toString()
    
    except Exception as e:
        logger.error(f"Error minting NFT: {str(e)}")
        raise
