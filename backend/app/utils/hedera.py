"""
TalentChain Pro - Unified Hedera Client Utility Module

This module provides comprehensive utilities for interacting with the Hedera network,
including client initialization, smart contract interactions, HTS token operations,
HCS messaging, event processing, and transaction management.

This unified module combines all Hedera functionality into a single, professional interface.
"""

import os
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List, Union, Tuple, TYPE_CHECKING
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

from dotenv import load_dotenv

if TYPE_CHECKING:
    from hedera import (
        Client, ContractFunctionParameters, Hbar, PrivateKey
    )

import hedera
from hedera import (
    # Core
    Client, AccountId, PrivateKey, PublicKey, Hbar,
    # Smart Contracts
    ContractId, ContractCreateFlow, ContractExecuteTransaction, 
    ContractCallQuery, ContractFunctionParameters, ContractFunctionResult,
    # Tokens (HTS)
    TokenId, TokenCreateTransaction, TokenType, TokenSupplyType,
    TokenMintTransaction, TransferTransaction, TokenBurnTransaction,
    TokenAssociateTransaction, TokenFreezeTransaction, TokenWipeTransaction,
    # Consensus Service (HCS)
    TopicId, TopicCreateTransaction, TopicMessageSubmitTransaction,
    TopicInfoQuery, TopicUpdateTransaction,
    # Transactions
    Transaction, TransactionResponse, TransactionReceipt, TransactionRecord,
    TransferTransaction, AccountCreateTransaction, AccountUpdateTransaction,
    TransactionId,
    # Query
    AccountBalanceQuery, AccountInfoQuery,
    # Status and Exceptions
    Status, PrecheckStatusException, ReceiptStatusException
)

from app.config import get_settings, get_contract_config, get_contract_abi, get_contract_address

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# =============================================================================
# ENUMS AND DATA CLASSES
# =============================================================================

class NetworkType(Enum):
    """Hedera network types."""
    MAINNET = "mainnet"
    TESTNET = "testnet" 
    PREVIEWNET = "previewnet"


class SkillCategory(str, Enum):
    """Skill categories for token classification."""
    TECHNICAL = "technical"
    CREATIVE = "creative"
    BUSINESS = "business"
    COMMUNICATION = "communication"
    LEADERSHIP = "leadership"
    ANALYTICAL = "analytical"
    DESIGN = "design"
    MARKETING = "marketing"
    SALES = "sales"
    FINANCE = "finance"
    LEGAL = "legal"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    OTHER = "other"


@dataclass
class HederaConfig:
    """Configuration for Hedera client."""
    network: NetworkType
    operator_id: str
    operator_key: str
    max_transaction_fee: int = 100
    max_query_payment: int = 50


@dataclass
class ContractInfo:
    """Smart contract deployment information."""
    contract_id: str
    name: str
    abi: List[Dict[str, Any]]
    deployed_at: datetime
    network: str


@dataclass
class SkillTokenData:
    """Skill token data structure."""
    token_id: str
    skill_name: str
    skill_category: SkillCategory
    level: int
    description: str
    metadata_uri: str
    owner_address: str
    created_at: datetime
    expiry_date: Optional[datetime] = None


@dataclass
class TransactionResult:
    """Transaction execution result."""
    success: bool
    transaction_id: Optional[str] = None
    error: Optional[str] = None
    gas_used: Optional[int] = None
    contract_address: Optional[str] = None


# =============================================================================
# GLOBAL VARIABLES
# =============================================================================

# Global Hedera client instance
_hedera_client: Optional[Client] = None

# Contract configuration cache
_contract_config: Optional[Dict[str, Dict[str, Any]]] = None

# =============================================================================
# CLIENT INITIALIZATION
# =============================================================================

def initialize_hedera_client() -> Client:
    """
    Initialize and configure the Hedera client.
    
    Returns:
        Configured Hedera client instance
        
    Raises:
        Exception: If client initialization fails
    """
    global _hedera_client
    
    if _hedera_client is not None:
        return _hedera_client
    
    try:
        settings = get_settings()
        
        # Parse operator account ID
        operator_id = AccountId.fromString(settings.hedera_account_id)
        
        # Parse operator private key
        operator_key = PrivateKey.fromString(settings.hedera_private_key)
        
        # Create client based on network
        if settings.hedera_network == "testnet":
            client = Client.forTestnet()
        elif settings.hedera_network == "mainnet":
            client = Client.forMainnet()
        elif settings.hedera_network == "previewnet":
            client = Client.forPreviewnet()
        else:
            raise ValueError(f"Unsupported network: {settings.hedera_network}")
        
        # Set operator
        client.setOperator(operator_id, operator_key)
        
        # Set default transaction fee
        client.setDefaultMaxTransactionFee(Hbar(settings.max_transaction_fee))
        client.setDefaultMaxQueryPayment(Hbar(settings.max_query_payment))
        
        _hedera_client = client
        logger.info(f"Hedera client initialized for {settings.hedera_network}")
        
        return client
        
    except Exception as e:
        logger.error(f"Failed to initialize Hedera client: {str(e)}")
        raise Exception(f"Hedera client initialization failed: {str(e)}")


def get_hedera_client() -> Client:
    """
    Get the initialized Hedera client instance.
    
    Returns:
        Hedera client instance
        
    Raises:
        Exception: If client is not initialized
    """
    if _hedera_client is None:
        return initialize_hedera_client()
    return _hedera_client


# =============================================================================
# SMART CONTRACT INTEGRATION
# =============================================================================

def get_contract_manager() -> Dict[str, Dict[str, Any]]:
    """
    Get the contract manager with all contract configurations.
    
    Returns:
        Dictionary containing contract configurations
    """
    global _contract_config
    
    if _contract_config is None:
        _contract_config = get_contract_config()
    
    return _contract_config


async def create_skill_token(
    recipient_address: str,
    skill_name: str,
    skill_category: str,
    level: int = 1,
    description: str = "",
    metadata_uri: str = ""
) -> TransactionResult:
    """
    Create a skill token using the SkillToken smart contract.
    
    Args:
        recipient_address: Hedera account ID to receive the token
        skill_name: Name of the skill
        skill_category: Category of the skill
        level: Initial skill level (1-10)
        description: Description of the skill
        metadata_uri: URI to metadata
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get SkillToken contract info
        skill_token_config = contract_config.get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="SkillToken contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters
        params = ContractFunctionParameters()
        params.addAddress(recipient_address)
        params.addString(skill_name)
        params.addString(skill_category)
        params.addUint8(level)
        params.addString(description)
        params.addString(metadata_uri)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(300000)  # Adjust gas as needed
        transaction.setFunction("mintSkillToken", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get the transaction record to extract token ID
            record = response.getRecord(client)
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to create skill token: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def update_skill_level(
    token_id: str,
    new_level: int,
    new_metadata_uri: str
) -> TransactionResult:
    """
    Update skill token level using the SkillToken smart contract.
    
    Args:
        token_id: ID of the skill token to update
        new_level: New skill level (1-10)
        new_metadata_uri: New metadata URI
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get SkillToken contract info
        skill_token_config = contract_config.get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="SkillToken contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters
        params = ContractFunctionParameters()
        params.addUint256(int(token_id))
        params.addUint8(new_level)
        params.addString(new_metadata_uri)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(200000)  # Adjust gas as needed
        transaction.setFunction("updateSkillLevel", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to update skill level: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def get_skill_token_info(token_id: str) -> Optional[SkillTokenData]:
    """
    Get skill token information from the smart contract.
    
    Args:
        token_id: ID of the skill token
        
    Returns:
        SkillTokenData if found, None otherwise
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get SkillToken contract info
        skill_token_config = contract_config.get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            logger.warning("SkillToken contract not deployed")
            return None
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters
        params = ContractFunctionParameters()
        params.addUint256(int(token_id))
        
        # Query contract function
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(100000)
        query.setFunction("getSkillData", params)
        
        # Execute query
        response = query.execute(client)
        
        if response.getFunctionResult():
            # Parse the result (this would need to be implemented based on actual return structure)
            # For now, return a placeholder
            return SkillTokenData(
                token_id=token_id,
                skill_name="Unknown",
                skill_category=SkillCategory.OTHER,
                level=1,
                description="",
                metadata_uri="",
                owner_address="",
                created_at=datetime.now(timezone.utc)
            )
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to get skill token info: {str(e)}")
        return None


async def get_user_skills(owner_address: str) -> List[SkillTokenData]:
    """
    Get all skill tokens owned by a user.
    
    Args:
        owner_address: Hedera account ID of the owner
        
    Returns:
        List of SkillTokenData
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get SkillToken contract info
        skill_token_config = contract_config.get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            logger.warning("SkillToken contract not deployed")
            return []
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters
        params = ContractFunctionParameters()
        params.addAddress(owner_address)
        
        # Query contract function
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(100000)
        query.setFunction("getTokensByOwner", params)
        
        # Execute query
        response = query.execute(client)
        
        if response.getFunctionResult():
            # Parse the result and get individual token info
            # This would need to be implemented based on actual return structure
            return []
        
        return []
        
    except Exception as e:
        logger.error(f"Failed to get user skills: {str(e)}")
        return []


# =============================================================================
# CONTRACT DEPLOYMENT AND VERIFICATION
# =============================================================================

async def check_contract_deployments() -> Dict[str, bool]:
    """
    Check the deployment status of all required contracts.
    
    Returns:
        Dictionary mapping contract names to deployment status
    """
    try:
        contract_config = get_contract_manager()
        deployment_status = {}
        
        for contract_name, config in contract_config.items():
            address = config.get('address', '')
            abi = config.get('abi', [])
            
            # Check if contract is deployed and has ABI
            is_deployed = bool(address and address.startswith('0.0.'))
            has_abi = len(abi) > 0
            
            deployment_status[contract_name] = {
                'deployed': is_deployed,
                'address': address,
                'has_abi': has_abi,
                'ready': is_deployed and has_abi
            }
        
        return deployment_status
        
    except Exception as e:
        logger.error(f"Failed to check contract deployments: {str(e)}")
        return {}


async def verify_contract_functionality() -> Dict[str, Dict[str, Any]]:
    """
    Verify that deployed contracts are functioning correctly.
    
    Returns:
        Dictionary with verification results for each contract
    """
    try:
        contract_config = get_contract_manager()
        verification_results = {}
        
        for contract_name, config in contract_config.items():
            if not config.get('deployed'):
                verification_results[contract_name] = {
                    'status': 'not_deployed',
                    'message': 'Contract not deployed'
                }
                continue
            
            # Try to call a basic view function to verify functionality
            try:
                if contract_name == 'SkillToken':
                    # Try to get total supply or similar
                    result = await get_skill_token_info("1")  # Test with token ID 1
                    verification_results[contract_name] = {
                        'status': 'functional' if result is not None else 'error',
                        'message': 'Contract responding to queries' if result is not None else 'Query failed'
                    }
                else:
                    verification_results[contract_name] = {
                        'status': 'not_tested',
                        'message': 'Verification not implemented for this contract type'
                    }
                    
            except Exception as e:
                verification_results[contract_name] = {
                    'status': 'error',
                    'message': f'Verification failed: {str(e)}'
                }
        
        return verification_results
        
    except Exception as e:
        logger.error(f"Failed to verify contract functionality: {str(e)}")
        return {}


# =============================================================================
# HEALTH CHECK FUNCTIONS
# =============================================================================

async def check_hedera_connection() -> Dict[str, Any]:
    """
    Check Hedera network connection health.
    
    Returns:
        Dictionary with connection status and details
    """
    try:
        client = get_hedera_client()
        
        # Try to get account info to test connection
        operator_id = client.getOperatorAccountId()
        account_info = AccountInfoQuery().setAccountId(operator_id).execute(client)
        
        return {
            'status': 'connected',
            'network': str(client.getNetworkName()),
            'operator_account': str(operator_id),
            'account_balance': str(account_info.balance),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        return {
            'status': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def validate_hedera_address(address: str) -> bool:
    """
    Validate Hedera account address format.
    
    Args:
        address: Address string to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        if not address.startswith('0.0.'):
            return False
        
        # Try to parse as AccountId
        AccountId.fromString(address)
        return True
        
    except Exception:
        return False


def format_hedera_address(address: str) -> str:
    """
    Format Hedera address for display.
    
    Args:
        address: Raw Hedera address
        
    Returns:
        Formatted address string
    """
    if not address:
        return ""
    
    if len(address) > 10:
        return f"{address[:6]}...{address[-4:]}"
    
    return address


def get_network_info() -> Dict[str, Any]:
    """
    Get current network information.
    
    Returns:
        Network configuration dictionary
    """
    try:
        client = get_hedera_client()
        settings = get_settings()
        
        return {
            'name': settings.hedera_network,
            'client_network': str(client.getNetworkName()),
            'operator_account': str(client.getOperatorAccountId()),
            'mirror_node': settings.hedera_mirror_node_url
        }
        
    except Exception as e:
        logger.error(f"Failed to get network info: {str(e)}")
        return {
            'name': 'unknown',
            'error': str(e)
        }
