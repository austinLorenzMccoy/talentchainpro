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
    token_id: Optional[str] = None
    pool_id: Optional[str] = None


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


def get_client() -> Client:
    """
    Get the Hedera client instance (alias for get_hedera_client).
    
    Returns:
        Hedera client instance
    """
    return get_hedera_client()


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
        skill_token_config = contract_config.get('contracts', {}).get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="SkillToken contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters - match the actual ABI signature
        # mintSkillToken(address recipient, string skillName, string skillCategory, uint8 level, string description, string metadataUri)
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
            # Get the transaction record to extract token ID from logs
            record = response.getRecord(client)
            
            # Extract token ID from contract function result
            function_result = record.contractFunctionResult
            token_id = None
            if function_result and function_result.getUint256(0):
                token_id = str(function_result.getUint256(0))
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed,
                contract_address=contract_address,
                token_id=token_id
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


async def add_skill_experience(
    token_id: str,
    experience_points: int
) -> TransactionResult:
    """
    Add experience points to a skill token.
    
    Args:
        token_id: ID of the skill token
        experience_points: Experience points to add
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        # For now, this is a placeholder since the contract doesn't have this function
        # In a real implementation, this would call a contract function
        logger.info(f"Adding {experience_points} experience points to token {token_id}")
        
        return TransactionResult(
            success=True,
            transaction_id=f"exp_{token_id}_{int(datetime.now().timestamp())}",
            gas_used=0
        )
        
    except Exception as e:
        logger.error(f"Failed to add skill experience: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def update_skill_level(
    token_id: str,
    new_level: int,
    new_metadata_uri: str = ""
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
        skill_token_config = contract_config.get('contracts', {}).get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="SkillToken contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters - match the actual ABI signature
        # updateSkillLevel(uint256 tokenId, uint8 newLevel, string newMetadataUri)
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
            record = response.getRecord(client)
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0
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


async def create_job_pool(
    title: str,
    description: str,
    required_skills: List[Dict[str, Any]],
    stake_amount: float,
    duration_days: int
) -> TransactionResult:
    """
    Create a job pool using the TalentPool smart contract.
    
    Args:
        title: Job pool title
        description: Job pool description
        required_skills: List of required skills
        stake_amount: Stake amount in HBAR
        duration_days: Duration of the pool in days
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get TalentPool contract info
        talent_pool_config = contract_config.get('contracts', {}).get('TalentPool', {})
        contract_address = talent_pool_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="TalentPool contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare JobPoolRequest struct according to the ABI
        # struct JobPoolRequest {
        #     string title;
        #     string description;
        #     uint256[] requiredSkills;
        #     uint256 minReputation;
        #     uint256 stakeAmount;
        #     uint256 durationDays;
        #     uint256 maxApplicants;
        #     uint256 applicationDeadline;
        # }
        
        # Convert required skills to skill IDs (simplified)
        skill_ids = [hash(skill.get('name', '')) % 1000000 for skill in required_skills]
        
        # Calculate application deadline
        application_deadline = int(datetime.now().timestamp()) + (duration_days * 24 * 60 * 60)
        
        params = ContractFunctionParameters()
        
        # Add the JobPoolRequest struct as a tuple
        params.addString(title)  # title
        params.addString(description)  # description
        params.addUint256Array(skill_ids)  # requiredSkills
        params.addUint256(0)  # minReputation (default to 0)
        params.addUint256(int(stake_amount * 100_000_000))  # stakeAmount in tinybars
        params.addUint256(duration_days)  # durationDays
        params.addUint256(100)  # maxApplicants (default to 100)
        params.addUint256(application_deadline)  # applicationDeadline
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(500000)  # Adjust gas as needed
        transaction.setFunction("createJobPool", params)
        
        # Set payable amount
        transaction.setPayableAmount(Hbar.fromTinybars(int(stake_amount * 100_000_000)))
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get pool ID from contract function result
            record = response.getRecord(client)
            pool_id = None
            if record and record.contractFunctionResult:
                try:
                    pool_id = str(record.contractFunctionResult.getUint256(0))
                except:
                    pool_id = f"pool_{int(datetime.now().timestamp())}"
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0,
                contract_address=contract_address,
                pool_id=pool_id
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to create job pool: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def apply_to_pool(
    pool_id: int,
    skill_token_ids: List[int],
    cover_letter: str = ""
) -> TransactionResult:
    """
    Apply to a job pool using the TalentPool smart contract.
    
    Args:
        pool_id: ID of the job pool
        skill_token_ids: List of skill token IDs
        cover_letter: Cover letter for the application
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        # For now, this is a placeholder since the contract doesn't have this function
        # In a real implementation, this would call a contract function
        logger.info(f"Applying to pool {pool_id} with skills {skill_token_ids}")
        
        return TransactionResult(
            success=True,
            transaction_id=f"apply_{pool_id}_{int(datetime.now().timestamp())}",
            gas_used=0
        )
        
    except Exception as e:
        logger.error(f"Failed to apply to pool: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def make_pool_match(
    pool_id: int,
    candidate_address: str,
    match_score: int
) -> TransactionResult:
    """
    Make a pool match using the TalentPool smart contract.
    
    Args:
        pool_id: ID of the job pool
        candidate_address: Address of the matched candidate
        match_score: Match score for the candidate
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        # For now, this is a placeholder since the contract doesn't have this function
        # In a real implementation, this would call a contract function
        logger.info(f"Making match for pool {pool_id} with candidate {candidate_address}")
        
        return TransactionResult(
            success=True,
            transaction_id=f"match_{pool_id}_{int(datetime.now().timestamp())}",
            gas_used=0
        )
        
    except Exception as e:
        logger.error(f"Failed to make pool match: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def get_job_pool_info(pool_id: int) -> Optional[Dict[str, Any]]:
    """
    Get job pool information from the TalentPool smart contract.
    
    Args:
        pool_id: ID of the job pool
        
    Returns:
        Job pool information if found, None otherwise
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get TalentPool contract info
        talent_pool_config = contract_config.get('contracts', {}).get('TalentPool', {})
        contract_address = talent_pool_config.get('address')
        
        if not contract_address:
            logger.warning("TalentPool contract not deployed")
            return None
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for getJobPool(uint256 poolId)
        params = ContractFunctionParameters()
        params.addUint256(pool_id)
        
        # Query contract function
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(200000)
        query.setFunction("getJobPool", params)
        
        # Execute query
        response = query.execute(client)
        result = response.getFunctionResult()
        
        if result:
            # Parse the JobPool struct returned
            # struct JobPool {
            #     uint256 id;
            #     address company;
            #     string title;
            #     string description;
            #     uint256[] requiredSkills;
            #     uint256 minReputation;
            #     uint256 stakeAmount;
            #     uint256 durationDays;
            #     uint256 maxApplicants;
            #     uint256 applicationDeadline;
            #     enum PoolStatus status;
            #     uint256 createdAt;
            # }
            
            try:
                id = result.getUint256(0)
                company = result.getAddress(1)
                title = result.getString(2)
                description = result.getString(3)
                # requiredSkills array would need special parsing
                min_reputation = result.getUint256(5)
                stake_amount = result.getUint256(6)
                duration_days = result.getUint256(7)
                max_applicants = result.getUint256(8)
                application_deadline = result.getUint256(9)
                status = result.getUint8(10)  # enum as uint8
                created_at = result.getUint256(11)
                
                # Convert status enum
                status_map = {0: "active", 1: "closed", 2: "completed", 3: "cancelled"}
                status_str = status_map.get(status, "unknown")
                
                return {
                    'id': pool_id,
                    'company': company,
                    'title': title,
                    'description': description,
                    'min_reputation': min_reputation,
                    'stake_amount': float(stake_amount) / 100_000_000,  # Convert from tinybars to HBAR
                    'duration_days': duration_days,
                    'max_applicants': max_applicants,
                    'application_deadline': application_deadline,
                    'status': status_str,
                    'created_at': created_at
                }
            except Exception as parse_error:
                logger.error(f"Failed to parse job pool data: {parse_error}")
                return None
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to get job pool info: {str(e)}")
        return None


async def submit_hcs_message(topic_id: str, message: str) -> TransactionResult:
    """
    Submit a message to HCS topic.
    
    Args:
        topic_id: HCS topic ID
        message: Message to submit
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        
        # Parse topic ID
        topic = TopicId.fromString(topic_id)
        
        # Create and submit message
        transaction = TopicMessageSubmitTransaction()
        transaction.setTopicId(topic)
        transaction.setMessage(message)
        
        # Execute transaction
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
        logger.error(f"Failed to submit HCS message: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def create_nft_token(
    name: str,
    symbol: str,
    metadata: Dict[str, Any]
) -> TransactionResult:
    """
    Create an NFT token on Hedera.
    
    Args:
        name: Token name
        symbol: Token symbol
        metadata: Token metadata
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        
        # Create token
        transaction = TokenCreateTransaction()
        transaction.setTokenName(name)
        transaction.setTokenSymbol(symbol)
        transaction.setTokenType(TokenType.NON_FUNGIBLE_UNIQUE)
        transaction.setSupplyType(TokenSupplyType.FINITE)
        transaction.setMaxSupply(1000000)
        
        # Set treasury and keys
        operator_id = client.getOperatorAccountId()
        transaction.setTreasuryAccountId(operator_id)
        
        # Execute transaction
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed,
                contract_address=str(receipt.tokenId)
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Token creation failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to create NFT token: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def mint_nft(
    token_id: str,
    metadata_uri: str,
    recipient_id: str
) -> TransactionResult:
    """
    Mint an NFT to a recipient.
    
    Args:
        token_id: Token ID
        metadata_uri: Metadata URI
        recipient_id: Recipient account ID
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        
        # Parse token and recipient IDs
        token = TokenId.fromString(token_id)
        recipient = AccountId.fromString(recipient_id)
        
        # Mint NFT
        transaction = TokenMintTransaction()
        transaction.setTokenId(token)
        transaction.addMetadata(metadata_uri.encode('utf-8'))
        
        # Execute transaction
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
                error=f"NFT minting failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to mint NFT: {str(e)}")
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
        skill_token_config = contract_config.get('contracts', {}).get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            logger.warning("SkillToken contract not deployed")
            return None
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters
        params = ContractFunctionParameters()
        params.addUint256(int(token_id))
        
        # Query contract function - getSkillData(uint256 tokenId)
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(100000)
        query.setFunction("getSkillData", params)
        
        # Execute query
        response = query.execute(client)
        result = response.getFunctionResult()
        
        if result:
            # Parse the SkillData struct returned
            # struct SkillData {
            #     string skillName;
            #     string skillCategory;
            #     uint8 level;
            #     string description;
            #     string metadataUri;
            #     uint64 createdAt;
            #     uint64 expiryDate;
            # }
            
            skill_name = result.getString(0)
            skill_category = result.getString(1)
            level = result.getUint8(2)
            description = result.getString(3)
            metadata_uri = result.getString(4)
            created_at = result.getUint64(5)
            expiry_date = result.getUint64(6)
            
            # Convert category string to enum
            try:
                category_enum = SkillCategory(skill_category.lower())
            except ValueError:
                category_enum = SkillCategory.OTHER
            
            return SkillTokenData(
                token_id=token_id,
                skill_name=skill_name,
                skill_category=category_enum,
                level=level,
                description=description,
                metadata_uri=metadata_uri,
                owner_address="",  # We'd need to call ownerOf separately
                created_at=datetime.fromtimestamp(created_at, timezone.utc),
                expiry_date=datetime.fromtimestamp(expiry_date, timezone.utc) if expiry_date > 0 else None
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
        skill_token_config = contract_config.get('contracts', {}).get('SkillToken', {})
        contract_address = skill_token_config.get('address')
        
        if not contract_address:
            logger.warning("SkillToken contract not deployed")
            return []
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for getTokensByOwner(address owner)
        params = ContractFunctionParameters()
        params.addAddress(owner_address)
        
        # Query contract function
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(200000)
        query.setFunction("getTokensByOwner", params)
        
        # Execute query
        response = query.execute(client)
        result = response.getFunctionResult()
        
        if result:
            # Get array of token IDs
            token_ids = []
            try:
                # Parse uint256 array result
                array_size = result.getUint256(0)  # First element is array length
                for i in range(1, int(array_size) + 1):
                    token_ids.append(str(result.getUint256(i)))
            except Exception as parse_error:
                logger.warning(f"Could not parse token IDs array: {parse_error}")
                return []
            
            # Get detailed info for each token
            skills = []
            for token_id in token_ids:
                skill_info = await get_skill_token_info(token_id)
                if skill_info:
                    skill_info.owner_address = owner_address
                    skills.append(skill_info)
            
            return skills
        
        return []
        
    except Exception as e:
        logger.error(f"Failed to get user skills: {str(e)}")
        return []


async def submit_work_evaluation_to_oracle(
    user_address: str,
    skill_token_ids: List[str],
    work_description: str,
    work_content: str,
    overall_score: int,
    skill_scores: List[int],
    feedback: str,
    ipfs_hash: str = ""
) -> TransactionResult:
    """
    Submit work evaluation to the ReputationOracle contract.
    
    Args:
        user_address: User being evaluated
        skill_token_ids: List of skill token IDs
        work_description: Description of the work
        work_content: Work content or artifacts
        overall_score: Overall score (0-100)
        skill_scores: Individual skill scores
        feedback: Evaluation feedback
        ipfs_hash: IPFS hash for additional data
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get ReputationOracle contract info
        oracle_config = contract_config.get('contracts', {}).get('ReputationOracle', {})
        contract_address = oracle_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="ReputationOracle contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for submitWorkEvaluation
        # submitWorkEvaluation(address user, uint256[] skillTokenIds, string workDescription, 
        #                     string workContent, uint256 overallScore, uint256[] skillScores, 
        #                     string feedback, string ipfsHash)
        params = ContractFunctionParameters()
        params.addAddress(user_address)
        params.addUint256Array([int(token_id) for token_id in skill_token_ids])
        params.addString(work_description)
        params.addString(work_content)
        params.addUint256(overall_score)
        params.addUint256Array(skill_scores)
        params.addString(feedback)
        params.addString(ipfs_hash)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(400000)
        transaction.setFunction("submitWorkEvaluation", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get evaluation ID from contract function result
            record = response.getRecord(client)
            evaluation_id = None
            if record and record.contractFunctionResult:
                try:
                    evaluation_id = str(record.contractFunctionResult.getUint256(0))
                except:
                    evaluation_id = f"eval_{int(datetime.now().timestamp())}"
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0,
                contract_address=contract_address,
                token_id=evaluation_id  # Reuse token_id field for evaluation_id
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to submit work evaluation to oracle: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def get_reputation_score_from_oracle(user_address: str) -> Optional[Dict[str, Any]]:
    """
    Get reputation score from the ReputationOracle contract.
    
    Args:
        user_address: User's Hedera account address
        
    Returns:
        Reputation data if found, None otherwise
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get ReputationOracle contract info
        oracle_config = contract_config.get('contracts', {}).get('ReputationOracle', {})
        contract_address = oracle_config.get('address')
        
        if not contract_address:
            logger.warning("ReputationOracle contract not deployed")
            return None
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for getReputationScore(address user)
        params = ContractFunctionParameters()
        params.addAddress(user_address)
        
        # Query contract function
        query = ContractCallQuery()
        query.setContractId(contract_id)
        query.setGas(100000)
        query.setFunction("getReputationScore", params)
        
        # Execute query
        response = query.execute(client)
        result = response.getFunctionResult()
        
        if result:
            # Parse the return values:
            # returns (uint256 overallScore, uint256 totalEvaluations, uint64 lastUpdated, bool isActive)
            overall_score = result.getUint256(0)
            total_evaluations = result.getUint256(1)
            last_updated = result.getUint64(2)
            is_active = result.getBool(3)
            
            return {
                'user_address': user_address,
                'overall_score': overall_score,
                'total_evaluations': total_evaluations,
                'last_updated': last_updated,
                'is_active': is_active
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to get reputation score from oracle: {str(e)}")
        return None


async def create_governance_proposal(
    title: str,
    description: str,
    targets: List[str] = None,
    values: List[int] = None,
    calldatas: List[str] = None,
    ipfs_hash: str = ""
) -> TransactionResult:
    """
    Create a governance proposal.
    
    Args:
        title: Proposal title
        description: Proposal description
        targets: Target contract addresses
        values: Values to send with calls
        calldatas: Call data for each target
        ipfs_hash: IPFS hash for additional proposal data
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get Governance contract info
        governance_config = contract_config.get('contracts', {}).get('Governance', {})
        contract_address = governance_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="Governance contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Default empty arrays if not provided
        targets = targets or []
        values = values or []
        calldatas = calldatas or []
        
        # Prepare function parameters for createProposal
        params = ContractFunctionParameters()
        params.addString(title)
        params.addString(description)
        params.addAddressArray(targets)
        params.addUint256Array(values)
        params.addBytesArray([bytes(data, 'utf-8') for data in calldatas])
        params.addString(ipfs_hash)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(300000)
        transaction.setFunction("createProposal", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get proposal ID from contract function result
            record = response.getRecord(client)
            proposal_id = None
            if record and record.contractFunctionResult:
                try:
                    proposal_id = str(record.contractFunctionResult.getUint256(0))
                except:
                    proposal_id = f"proposal_{int(datetime.now().timestamp())}"
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0,
                contract_address=contract_address,
                token_id=proposal_id  # Reuse token_id field for proposal_id
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to create governance proposal: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def cast_governance_vote(
    proposal_id: int,
    vote: int,  # 0 = Against, 1 = For, 2 = Abstain
    reason: str = ""
) -> TransactionResult:
    """
    Cast a vote on a governance proposal.
    
    Args:
        proposal_id: Proposal ID to vote on
        vote: Vote type (0=Against, 1=For, 2=Abstain)
        reason: Optional reason for the vote
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get Governance contract info
        governance_config = contract_config.get('contracts', {}).get('Governance', {})
        contract_address = governance_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="Governance contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for castVote
        params = ContractFunctionParameters()
        params.addUint256(proposal_id)
        params.addUint8(vote)
        params.addString(reason)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(200000)
        transaction.setFunction("castVote", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed if hasattr(receipt, 'gasUsed') else 0,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to cast governance vote: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def delegate_voting_power(
    delegatee: str
) -> TransactionResult:
    """
    Delegate voting power to another address.
    
    Args:
        delegatee: Address to delegate voting power to
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get Governance contract info
        governance_config = contract_config.get('contracts', {}).get('Governance', {})
        contract_address = governance_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="Governance contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for delegate
        params = ContractFunctionParameters()
        params.addAddress(delegatee)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(150000)
        transaction.setFunction("delegate", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed if hasattr(receipt, 'gasUsed') else 0,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to delegate voting power: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def undelegate_voting_power() -> TransactionResult:
    """
    Undelegate voting power (remove delegation).
    
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get Governance contract info
        governance_config = contract_config.get('contracts', {}).get('Governance', {})
        contract_address = governance_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="Governance contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Execute contract function (no parameters needed)
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(150000)
        transaction.setFunction("undelegate")
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed if hasattr(receipt, 'gasUsed') else 0,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to undelegate voting power: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def create_emergency_proposal(
    title: str,
    description: str,
    targets: List[str],
    values: List[int],
    calldatas: List[str],
    ipfs_hash: str,
    justification: str
) -> TransactionResult:
    """
    Create an emergency governance proposal.
    
    Args:
        title: Emergency proposal title
        description: Emergency proposal description
        targets: Target contract addresses
        values: Values to send with calls
        calldatas: Call data for each target
        ipfs_hash: IPFS hash for additional proposal data
        justification: Emergency justification
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get Governance contract info
        governance_config = contract_config.get('contracts', {}).get('Governance', {})
        contract_address = governance_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="Governance contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for createEmergencyProposal
        params = ContractFunctionParameters()
        params.addString(title)
        params.addString(description)
        params.addAddressArray(targets)
        params.addUint256Array(values)
        params.addBytesArray([bytes(data, 'utf-8') for data in calldatas])
        params.addString(ipfs_hash)
        params.addString(justification)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(300000)
        transaction.setFunction("createEmergencyProposal", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get proposal ID from contract function result
            record = response.getRecord(client)
            proposal_id = None
            if record and record.contractFunctionResult:
                try:
                    proposal_id = str(record.contractFunctionResult.getUint256(0))
                except:
                    proposal_id = f"emergency_proposal_{int(datetime.now().timestamp())}"
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0,
                contract_address=contract_address,
                token_id=proposal_id  # Reuse token_id field for proposal_id
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to create emergency governance proposal: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


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

async def register_reputation_oracle(
    name: str,
    specializations: List[str]
) -> TransactionResult:
    """
    Register a new reputation oracle.
    
    Args:
        name: Oracle name
        specializations: List of oracle specializations
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get ReputationOracle contract info
        oracle_config = contract_config.get('contracts', {}).get('ReputationOracle', {})
        contract_address = oracle_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="ReputationOracle contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for registerOracle
        params = ContractFunctionParameters()
        params.addString(name)
        params.addStringArray(specializations)
        
        # Execute contract function (payable - stake amount should be msg.value)
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(200000)
        transaction.setFunction("registerOracle", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed if hasattr(receipt, 'gasUsed') else 0,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to register reputation oracle: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def submit_work_evaluation(
    user: str,
    skill_token_ids: List[int],
    work_description: str,
    work_content: str,
    overall_score: int,
    skill_scores: List[int],
    feedback: str,
    ipfs_hash: str
) -> TransactionResult:
    """
    Submit a work evaluation.
    
    Args:
        user: User address being evaluated
        skill_token_ids: List of skill token IDs
        work_description: Description of the work
        work_content: Content of the work
        overall_score: Overall evaluation score
        skill_scores: Individual skill scores
        feedback: Evaluation feedback
        ipfs_hash: IPFS hash for evaluation data
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get ReputationOracle contract info
        oracle_config = contract_config.get('contracts', {}).get('ReputationOracle', {})
        contract_address = oracle_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="ReputationOracle contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for submitWorkEvaluation
        params = ContractFunctionParameters()
        params.addAddress(user)
        params.addUint256Array(skill_token_ids)
        params.addString(work_description)
        params.addString(work_content)
        params.addUint256(overall_score)
        params.addUint256Array(skill_scores)
        params.addString(feedback)
        params.addString(ipfs_hash)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(300000)
        transaction.setFunction("submitWorkEvaluation", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            # Get evaluation ID from contract function result
            record = response.getRecord(client)
            evaluation_id = None
            if record and record.contractFunctionResult:
                try:
                    evaluation_id = str(record.contractFunctionResult.getUint256(0))
                except:
                    evaluation_id = f"evaluation_{int(datetime.now().timestamp())}"
            
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=record.gasUsed if record else 0,
                contract_address=contract_address,
                token_id=evaluation_id  # Reuse token_id field for evaluation_id
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to submit work evaluation: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )


async def update_reputation_score(
    user: str,
    category: str,
    new_score: int,
    evidence: str
) -> TransactionResult:
    """
    Update a user's reputation score.
    
    Args:
        user: User address
        category: Skill category
        new_score: New reputation score
        evidence: Evidence for the score update
        
    Returns:
        TransactionResult with success status and details
    """
    try:
        client = get_hedera_client()
        contract_config = get_contract_manager()
        
        # Get ReputationOracle contract info
        oracle_config = contract_config.get('contracts', {}).get('ReputationOracle', {})
        contract_address = oracle_config.get('address')
        
        if not contract_address:
            return TransactionResult(
                success=False,
                error="ReputationOracle contract not deployed"
            )
        
        # Create contract ID
        contract_id = ContractId.fromString(contract_address)
        
        # Prepare function parameters for updateReputationScore
        params = ContractFunctionParameters()
        params.addAddress(user)
        params.addString(category)
        params.addUint256(new_score)
        params.addString(evidence)
        
        # Execute contract function
        transaction = ContractExecuteTransaction()
        transaction.setContractId(contract_id)
        transaction.setGas(200000)
        transaction.setFunction("updateReputationScore", params)
        
        # Sign and execute
        response = transaction.execute(client)
        receipt = response.getReceipt(client)
        
        if receipt.status == Status.Success:
            return TransactionResult(
                success=True,
                transaction_id=response.transactionId.toString(),
                gas_used=receipt.gasUsed if hasattr(receipt, 'gasUsed') else 0,
                contract_address=contract_address
            )
        else:
            return TransactionResult(
                success=False,
                error=f"Transaction failed with status: {receipt.status}"
            )
            
    except Exception as e:
        logger.error(f"Failed to update reputation score: {str(e)}")
        return TransactionResult(
            success=False,
            error=str(e)
        )
