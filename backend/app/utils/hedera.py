"""
Enhanced Hedera Client Utility Module

This module provides comprehensive utilities for interacting with the Hedera network,
including client initialization, smart contract interactions, event processing,
and transaction management for the TalentChain Pro ecosystem.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv
from hedera import (
    Client, 
    AccountId, 
    PrivateKey,
    PublicKey,
    TopicId,
    TopicMessageSubmitTransaction,
    TokenId,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenMintTransaction,
    ContractCallQuery,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
    TransactionId,
    TransactionReceipt,
    TransactionRecord,
    Status
)

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # dotenv not available, environment variables should be set directly
    pass


# Data Classes and Enums
class SkillCategory(str, Enum):
    """Skill category enumeration."""
    FRONTEND = "frontend"
    BACKEND = "backend"
    BLOCKCHAIN = "blockchain"
    DESIGN = "design"
    DATA_SCIENCE = "data_science"
    DEVOPS = "devops"
    MOBILE = "mobile"
    MARKETING = "marketing"
    MANAGEMENT = "management"
    OTHER = "other"


@dataclass
class SkillTokenData:
    """Data structure for skill token information."""
    token_id: str
    owner_address: str
    skill_name: str
    skill_category: SkillCategory
    level: int
    experience_points: int
    description: str
    metadata_uri: str
    is_active: bool
    created_at: datetime
    last_updated: datetime


@dataclass
class JobPoolData:
    """Data structure for job pool information."""
    pool_id: str
    creator_address: str
    title: str
    description: str
    required_skills: List[Dict[str, Any]]
    min_reputation: int
    stake_amount: float
    deadline: datetime
    status: str
    created_at: datetime


@dataclass
class ContractCallResult:
    """Result of a smart contract call."""
    success: bool
    result: Any
    transaction_id: Optional[str]
    receipt: Optional[TransactionReceipt]
    error: Optional[str]
    gas_used: Optional[int]


@dataclass
class EventLog:
    """Smart contract event log."""
    contract_address: str
    event_name: str
    parameters: Dict[str, Any]
    transaction_id: str
    timestamp: datetime
    block_number: Optional[int]


# Global client instance
_client = None


class HederaContractManager:
    """Manager for smart contract interactions on Hedera."""
    
    def __init__(self, client):
        self.client = client
        self.contracts = self._load_contract_addresses()
        self.abis = self._load_contract_abis()
    
    def _load_contract_addresses(self) -> Dict[str, str]:
        """Load contract addresses from environment variables."""
        return {
            "skill_token": os.getenv("CONTRACT_SKILL_TOKEN"),
            "talent_pool": os.getenv("CONTRACT_TALENT_POOL"),
            "governance": os.getenv("CONTRACT_GOVERNANCE"),
            "reputation_oracle": os.getenv("CONTRACT_REPUTATION_ORACLE")
        }
    
    def _load_contract_abis(self) -> Dict[str, List[Dict]]:
        """Load contract ABIs from files or environment."""
        abis = {}
        
        # Try to load ABIs from files
        abi_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "contracts", "artifacts", "contracts")
        
        for contract_name in ["SkillTokenSimple", "TalentPoolSimple"]:
            try:
                abi_path = os.path.join(abi_dir, f"{contract_name}.sol", f"{contract_name}.json")
                if os.path.exists(abi_path):
                    with open(abi_path, 'r') as f:
                        contract_data = json.load(f)
                        abis[contract_name.lower()] = contract_data.get("abi", [])
                        logger.info(f"Loaded ABI for {contract_name}")
            except Exception as e:
                logger.warning(f"Could not load ABI for {contract_name}: {str(e)}")
        
        return abis
    
    async def call_contract_function(
        self,
        contract_name: str,
        function_name: str,
        parameters: Optional[ContractFunctionParameters] = None,
        gas_limit: int = 100000,
        value: Optional[Hbar] = None
    ) -> ContractCallResult:
        """
        Execute a smart contract function.
        
        Args:
            contract_name: Name of the contract (skill_token, talent_pool, etc.)
            function_name: Name of the function to call
            parameters: Function parameters
            gas_limit: Gas limit for the transaction
            value: HBAR value to send with the transaction
            
        Returns:
            ContractCallResult: Result of the contract call
        """
        try:
            contract_address = self.contracts.get(contract_name)
            if not contract_address:
                return ContractCallResult(
                    success=False,
                    result=None,
                    transaction_id=None,
                    receipt=None,
                    error=f"Contract address not found for {contract_name}",
                    gas_used=None
                )
            
            # Build the transaction
            transaction = ContractExecuteTransaction().setContractId(
                ContractId.fromString(contract_address)
            ).setGas(gas_limit).setFunction(function_name, parameters or ContractFunctionParameters())
            
            if value:
                transaction.setPayableAmount(value)
            
            # Execute the transaction
            tx_response = await transaction.executeAsync(self.client)
            receipt = await tx_response.getReceiptAsync(self.client)
            
            # Get transaction record for detailed information
            record = await tx_response.getRecordAsync(self.client)
            
            if receipt.status == Status.SUCCESS:
                return ContractCallResult(
                    success=True,
                    result=receipt.contractFunctionResult,
                    transaction_id=tx_response.transactionId.toString(),
                    receipt=receipt,
                    error=None,
                    gas_used=record.contractFunctionResult.gasUsed if record.contractFunctionResult else None
                )
            else:
                return ContractCallResult(
                    success=False,
                    result=None,
                    transaction_id=tx_response.transactionId.toString(),
                    receipt=receipt,
                    error=f"Transaction failed with status: {receipt.status}",
                    gas_used=None
                )
        
        except Exception as e:
            logger.error(f"Contract call error: {str(e)}")
            return ContractCallResult(
                success=False,
                result=None,
                transaction_id=None,
                receipt=None,
                error=str(e),
                gas_used=None
            )
    
    async def query_contract_function(
        self,
        contract_name: str,
        function_name: str,
        parameters: Optional[ContractFunctionParameters] = None,
        gas_limit: int = 50000
    ) -> ContractCallResult:
        """
        Query a smart contract function (read-only).
        
        Args:
            contract_name: Name of the contract
            function_name: Name of the function to call
            parameters: Function parameters
            gas_limit: Gas limit for the query
            
        Returns:
            ContractCallResult: Result of the contract query
        """
        try:
            contract_address = self.contracts.get(contract_name)
            if not contract_address:
                return ContractCallResult(
                    success=False,
                    result=None,
                    transaction_id=None,
                    receipt=None,
                    error=f"Contract address not found for {contract_name}",
                    gas_used=None
                )
            
            # Build the query
            query = ContractCallQuery().setContractId(
                ContractId.fromString(contract_address)
            ).setGas(gas_limit).setFunction(function_name, parameters or ContractFunctionParameters())
            
            # Execute the query
            result = await query.executeAsync(self.client)
            
            return ContractCallResult(
                success=True,
                result=result,
                transaction_id=None,
                receipt=None,
                error=None,
                gas_used=result.gasUsed if hasattr(result, 'gasUsed') else None
            )
        
        except Exception as e:
            logger.error(f"Contract query error: {str(e)}")
            return ContractCallResult(
                success=False,
                result=None,
                transaction_id=None,
                receipt=None,
                error=str(e),
                gas_used=None
            )


# Global contract manager instance
_contract_manager = None

def initialize_hedera_client():
    """
    Initialize the Hedera client based on environment variables.
    
    Returns:
        Client: Initialized Hedera client
    
    Raises:
        ValueError: If required environment variables are missing
    """
    global _client, _contract_manager
    
    # Check if client already initialized
    if _client is not None:
        return _client
    
    # Get environment variables
    operator_id = os.getenv("HEDERA_ACCOUNT_ID") or os.getenv("HEDERA_OPERATOR_ID")
    operator_key = os.getenv("HEDERA_PRIVATE_KEY") or os.getenv("HEDERA_OPERATOR_KEY")
    network = os.getenv("HEDERA_NETWORK", "testnet").lower()
    
    if not operator_id or not operator_key:
        raise ValueError("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set")
    
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
    
    # Initialize contract manager
    _contract_manager = HederaContractManager(_client)
    
    logger.info(f"Hedera client initialized for {network} with account {operator_id}")
    return _client


def get_client():
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


def get_contract_manager() -> HederaContractManager:
    """
    Get the contract manager instance.
    
    Returns:
        HederaContractManager: Contract manager instance
    """
    global _contract_manager
    
    if _contract_manager is None:
        client = get_client()
        _contract_manager = HederaContractManager(client)
    
    return _contract_manager


# High-Level Smart Contract Functions

async def create_skill_token(
    recipient_address: str,
    skill_name: str,
    skill_category: str,
    level: int,
    description: str = "",
    metadata_uri: str = ""
) -> ContractCallResult:
    """
    Create a new skill token.
    
    Args:
        recipient_address: Address to receive the skill token
        skill_name: Name of the skill
        skill_category: Category of the skill
        level: Initial skill level (1-10)
        description: Skill description
        metadata_uri: URI to additional metadata
        
    Returns:
        ContractCallResult: Result of the skill token creation
    """
    contract_manager = get_contract_manager()
    
    # Prepare function parameters
    params = ContractFunctionParameters()
    params.addString(recipient_address)
    params.addString(skill_name)
    params.addString(skill_category)
    params.addUint256(level)
    params.addString(description)
    params.addString(metadata_uri)
    
    return await contract_manager.call_contract_function(
        "skill_token",
        "mintSkillToken",
        params,
        gas_limit=150000
    )


async def update_skill_level(
    token_id: int,
    new_level: int,
    evidence_uri: str = ""
) -> ContractCallResult:
    """
    Update the level of a skill token.
    
    Args:
        token_id: ID of the skill token
        new_level: New skill level
        evidence_uri: URI to evidence supporting the level increase
        
    Returns:
        ContractCallResult: Result of the skill level update
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(token_id)
    params.addUint256(new_level)
    params.addString(evidence_uri)
    
    return await contract_manager.call_contract_function(
        "skill_token",
        "updateSkillLevel",
        params,
        gas_limit=100000
    )


async def add_skill_experience(
    token_id: int,
    experience_points: int
) -> ContractCallResult:
    """
    Add experience points to a skill token.
    
    Args:
        token_id: ID of the skill token
        experience_points: Points to add
        
    Returns:
        ContractCallResult: Result of the experience addition
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(token_id)
    params.addUint256(experience_points)
    
    return await contract_manager.call_contract_function(
        "skill_token",
        "addExperience",
        params,
        gas_limit=80000
    )


async def create_job_pool(
    title: str,
    description: str,
    required_skills: List[Dict[str, Any]],
    min_reputation: int,
    stake_amount: float,
    duration_days: int
) -> ContractCallResult:
    """
    Create a new job pool.
    
    Args:
        title: Job title
        description: Job description
        required_skills: List of required skills with levels
        min_reputation: Minimum reputation required
        stake_amount: Stake amount in HBAR
        duration_days: Pool duration in days
        
    Returns:
        ContractCallResult: Result of the job pool creation
    """
    contract_manager = get_contract_manager()
    
    # Convert required skills to contract format
    skill_names = [skill["name"] for skill in required_skills]
    skill_levels = [skill["level"] for skill in required_skills]
    
    params = ContractFunctionParameters()
    params.addString(title)
    params.addString(description)
    params.addStringArray(skill_names)
    params.addUint256Array(skill_levels)
    params.addUint256(min_reputation)
    params.addUint256(duration_days)
    
    # Convert stake amount to tinybars
    stake_tinybars = int(stake_amount * 100_000_000)  # 1 HBAR = 100M tinybars
    
    return await contract_manager.call_contract_function(
        "talent_pool",
        "createPool",
        params,
        gas_limit=200000,
        value=Hbar.fromTinybars(stake_tinybars)
    )


async def apply_to_pool(
    pool_id: int,
    skill_token_ids: List[int],
    cover_letter: str = ""
) -> ContractCallResult:
    """
    Apply to a job pool.
    
    Args:
        pool_id: ID of the job pool
        skill_token_ids: List of skill token IDs to submit
        cover_letter: Cover letter for the application
        
    Returns:
        ContractCallResult: Result of the pool application
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(pool_id)
    params.addUint256Array(skill_token_ids)
    params.addString(cover_letter)
    
    return await contract_manager.call_contract_function(
        "talent_pool",
        "applyToPool",
        params,
        gas_limit=150000
    )


async def make_pool_match(
    pool_id: int,
    candidate_address: str,
    match_score: int
) -> ContractCallResult:
    """
    Make a match in a job pool.
    
    Args:
        pool_id: ID of the job pool
        candidate_address: Address of the selected candidate
        match_score: AI-calculated match score (0-100)
        
    Returns:
        ContractCallResult: Result of the match creation
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(pool_id)
    params.addString(candidate_address)
    params.addUint256(match_score)
    
    return await contract_manager.call_contract_function(
        "talent_pool",
        "makeMatch",
        params,
        gas_limit=120000
    )


# Query Functions

async def get_skill_token_info(token_id: int) -> Dict[str, Any]:
    """
    Get information about a skill token.
    
    Args:
        token_id: ID of the skill token
        
    Returns:
        Dict containing skill token information
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(token_id)
    
    result = await contract_manager.query_contract_function(
        "skill_token",
        "getSkillInfo",
        params
    )
    
    if result.success:
        # Parse the result based on the contract's return structure
        # This would need to be customized based on actual contract ABI
        return {
            "token_id": token_id,
            "success": True,
            "data": result.result
        }
    else:
        return {
            "token_id": token_id,
            "success": False,
            "error": result.error
        }


async def get_user_skills(user_address: str) -> List[Dict[str, Any]]:
    """
    Get all skill tokens owned by a user.
    
    Args:
        user_address: User's Hedera account address
        
    Returns:
        List of skill token information
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addString(user_address)
    
    result = await contract_manager.query_contract_function(
        "skill_token",
        "getUserSkills",
        params
    )
    
    if result.success:
        # Parse and return the skills list
        return {
            "user_address": user_address,
            "success": True,
            "skills": result.result  # This would be parsed based on contract ABI
        }
    else:
        return {
            "user_address": user_address,
            "success": False,
            "error": result.error
        }


async def get_job_pool_info(pool_id: int) -> Dict[str, Any]:
    """
    Get information about a job pool.
    
    Args:
        pool_id: ID of the job pool
        
    Returns:
        Dict containing job pool information
    """
    contract_manager = get_contract_manager()
    
    params = ContractFunctionParameters()
    params.addUint256(pool_id)
    
    result = await contract_manager.query_contract_function(
        "talent_pool",
        "getPool",
        params
    )
    
    if result.success:
        return {
            "pool_id": pool_id,
            "success": True,
            "data": result.result
        }
    else:
        return {
            "pool_id": pool_id,
            "success": False,
            "error": result.error
        }

# Legacy HCS and Token Functions (for compatibility)

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
    supply_key = None
) -> str:
    """
    Create a new non-fungible token on Hedera.
    
    Args:
        name (str): Token name
        symbol (str): Token symbol
        metadata (Dict[str, Any]): Token metadata
        supply_key: Supply key for minting tokens
        
    Returns:
        str: The token ID
        
    Raises:
        Exception: If the transaction fails
    """
    client = get_client()
    
    if supply_key is None:
        supply_key = PrivateKey.fromString(os.getenv("HEDERA_PRIVATE_KEY") or os.getenv("HEDERA_OPERATOR_KEY"))
    
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


# Event Processing Functions

async def get_transaction_record(transaction_id: str) -> Optional[TransactionRecord]:
    """
    Get transaction record by transaction ID.
    
    Args:
        transaction_id: Transaction ID to query
        
    Returns:
        TransactionRecord or None if not found
    """
    client = get_client()
    
    try:
        tx_id = TransactionId.fromString(transaction_id)
        record = await client.getTransactionRecord(tx_id)
        return record
    except Exception as e:
        logger.error(f"Error getting transaction record: {str(e)}")
        return None


def parse_contract_events(transaction_record) -> List[EventLog]:
    """
    Parse contract events from a transaction record.
    
    Args:
        transaction_record: Transaction record containing contract events
        
    Returns:
        List of parsed event logs
    """
    events = []
    
    try:
        if hasattr(transaction_record, 'contractFunctionResult') and transaction_record.contractFunctionResult:
            # Parse events from the contract function result
            # This would need to be implemented based on the specific contract ABI
            contract_result = transaction_record.contractFunctionResult
            
            # For now, return basic event structure
            # In production, this would parse actual event logs
            events.append(EventLog(
                contract_address=str(contract_result.contractId),
                event_name="ContractCall",
                parameters={},
                transaction_id=str(transaction_record.transactionId),
                timestamp=datetime.now(timezone.utc),
                block_number=None
            ))
    
    except Exception as e:
        logger.error(f"Error parsing contract events: {str(e)}")
    
    return events


# Utility Functions

def validate_hedera_address(address: str) -> bool:
    """
    Validate a Hedera account ID format.
    
    Args:
        address: Address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        AccountId.fromString(address)
        return True
    except:
        return False


def format_hbar_amount(tinybars: int) -> str:
    """
    Format tinybars as HBAR amount.
    
    Args:
        tinybars: Amount in tinybars
        
    Returns:
        str: Formatted HBAR amount
    """
    hbar_amount = tinybars / 100_000_000  # 1 HBAR = 100M tinybars
    return f"{hbar_amount:.8f} HBAR"


def get_network_info() -> Dict[str, Any]:
    """
    Get information about the current Hedera network configuration.
    
    Returns:
        Dict containing network information
    """
    return {
        "network": os.getenv("HEDERA_NETWORK", "testnet"),
        "account_id": os.getenv("HEDERA_ACCOUNT_ID") or os.getenv("HEDERA_OPERATOR_ID"),
        "contracts": {
            "skill_token": os.getenv("CONTRACT_SKILL_TOKEN"),
            "talent_pool": os.getenv("CONTRACT_TALENT_POOL"),
            "governance": os.getenv("CONTRACT_GOVERNANCE"),
            "reputation_oracle": os.getenv("CONTRACT_REPUTATION_ORACLE")
        }
    }


# Health Check Functions

async def check_hedera_connection() -> Dict[str, Any]:
    """
    Check the health of the Hedera connection.
    
    Returns:
        Dict containing connection status
    """
    try:
        client = get_client()
        account_id = client.getOperatorAccountId()
        
        # Try to get account balance as a health check
        balance_query = client.getAccountBalance(account_id)
        balance = await balance_query.executeAsync(client)
        
        return {
            "status": "healthy",
            "account_id": account_id.toString(),
            "balance": balance.hbars.toString(),
            "network": os.getenv("HEDERA_NETWORK", "testnet")
        }
    
    except Exception as e:
        logger.error(f"Hedera connection check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "network": os.getenv("HEDERA_NETWORK", "testnet")
        }


async def check_contract_deployments() -> Dict[str, Any]:
    """
    Check if all required contracts are deployed and accessible.
    
    Returns:
        Dict containing contract deployment status
    """
    contract_manager = get_contract_manager()
    contracts = contract_manager.contracts
    status = {}
    
    for contract_name, contract_address in contracts.items():
        if contract_address:
            try:
                # Try a simple query to verify contract exists
                result = await contract_manager.query_contract_function(
                    contract_name,
                    "name",  # Most contracts should have a name function
                    gas_limit=30000
                )
                
                status[contract_name] = {
                    "address": contract_address,
                    "status": "deployed" if result.success else "inaccessible",
                    "error": result.error if not result.success else None
                }
            except Exception as e:
                status[contract_name] = {
                    "address": contract_address,
                    "status": "error",
                    "error": str(e)
                }
        else:
            status[contract_name] = {
                "address": None,
                "status": "not_configured",
                "error": "Contract address not set in environment"
            }
    
    return status


# Export main functions and classes
__all__ = [
    'initialize_hedera_client',
    'get_client',
    'get_contract_manager',
    'HederaContractManager',
    'SkillTokenData',
    'JobPoolData',
    'ContractCallResult',
    'EventLog',
    'SkillCategory',
    'create_skill_token',
    'update_skill_level',
    'add_skill_experience',
    'create_job_pool',
    'apply_to_pool',
    'make_pool_match',
    'get_skill_token_info',
    'get_user_skills',
    'get_job_pool_info',
    'submit_hcs_message',
    'create_nft_token',
    'mint_nft',
    'validate_hedera_address',
    'format_hbar_amount',
    'get_network_info',
    'check_hedera_connection',
    'check_contract_deployments'
]
