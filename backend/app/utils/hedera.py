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


@dataclass 
class SkillTokenData:
    """Skill token metadata structure."""
    token_id: int
    owner_address: str
    skill_name: str
    skill_category: SkillCategory
    level: int
    experience_points: int
    created_at: datetime
    last_updated: datetime
    metadata_uri: str
    verified: bool = False


@dataclass
class JobPoolData:
    """Job pool metadata structure."""
    pool_id: int
    creator_address: str
    title: str
    description: str
    required_skills: List[Dict[str, Any]]
    stake_amount: float
    expiry_date: datetime
    status: str
    candidates: List[str]


@dataclass
class ContractCallResult:
    """Result of a contract function call."""
    success: bool
    transaction_id: str
    result: Optional[Any] = None
    error: Optional[str] = None
    gas_used: Optional[int] = None


@dataclass
class EventLog:
    """Blockchain event log data."""
    transaction_id: str
    contract_id: str
    event_name: str
    event_data: Dict[str, Any]
    block_number: int
    timestamp: datetime


@dataclass
class HCSMessage:
    """HCS message structure."""
    topic_id: str
    message: str
    sequence_number: int
    timestamp: datetime
    running_hash: str


# =============================================================================
# HEDERA MANAGER CLASS
# =============================================================================

class HederaManager:
    """
    Unified Hedera client manager for all blockchain operations.
    
    This class provides a single interface for all Hedera network interactions,
    including smart contracts, tokens, consensus service, and account operations.
    """
    
    def __init__(self, config: Optional[HederaConfig] = None):
        """Initialize the Hedera manager."""
        self.config = config or self._load_config_from_env()
        self._client = None
        self.contracts: Dict[str, ContractInfo] = {}
        self._initialize_client()
        self._load_contracts()
        
        logger.info(f"Initialized HederaManager for {self.config.network.value}")
    
    def _load_config_from_env(self) -> HederaConfig:
        """Load configuration from environment variables."""
        network_name = os.getenv("HEDERA_NETWORK", "testnet").lower()
        
        try:
            network = NetworkType(network_name)
        except ValueError:
            logger.warning(f"Invalid network '{network_name}', defaulting to testnet")
            network = NetworkType.TESTNET
        
        return HederaConfig(
            network=network,
            operator_id=os.getenv("HEDERA_OPERATOR_ID", ""),
            operator_key=os.getenv("HEDERA_OPERATOR_KEY", ""),
            max_transaction_fee=int(os.getenv("HEDERA_MAX_TRANSACTION_FEE", "100")),
            max_query_payment=int(os.getenv("HEDERA_MAX_QUERY_PAYMENT", "50"))
        )
    
    def _initialize_client(self):
        """Initialize the Hedera client."""
        try:
            if self.config.network == NetworkType.MAINNET:
                self._client = Client.forMainnet()
            elif self.config.network == NetworkType.PREVIEWNET:
                self._client = Client.forPreviewnet()
            else:  # Default to testnet
                self._client = Client.forTestnet()
            
            # Set operator
            if self.config.operator_id and self.config.operator_key:
                operator_id = AccountId.fromString(self.config.operator_id)
                operator_key = PrivateKey.fromString(self.config.operator_key)
                self._client.setOperator(operator_id, operator_key)
                
                # Set default fees
                self._client.setDefaultMaxTransactionFee(Hbar.fromTinybars(self.config.max_transaction_fee))
                self._client.setDefaultMaxQueryPayment(Hbar.fromTinybars(self.config.max_query_payment))
                
                logger.info(f"Hedera client initialized with operator {self.config.operator_id}")
            else:
                logger.warning("No operator credentials provided")
                
        except Exception as e:
            logger.error(f"Failed to initialize Hedera client: {str(e)}")
            raise
    
    def _load_contracts(self):
        """Load contract addresses and ABIs from configuration."""
        try:
            # Load contract addresses
            contracts_file = os.getenv("CONTRACTS_FILE", "contracts.json")
            if os.path.exists(contracts_file):
                with open(contracts_file, 'r') as f:
                    contract_data = json.load(f)
                    
                for name, info in contract_data.get("contracts", {}).items():
                    self.contracts[name] = ContractInfo(
                        contract_id=info.get("address", ""),
                        name=name,
                        abi=info.get("abi", []),
                        deployed_at=datetime.fromisoformat(info.get("deployed_at", datetime.now().isoformat()))
                    )
                    
                logger.info(f"Loaded {len(self.contracts)} contract definitions")
            else:
                logger.warning(f"Contracts file {contracts_file} not found")
                
        except Exception as e:
            logger.error(f"Failed to load contracts: {str(e)}")
    
    @property
    def client(self) -> Client:
        """Get the Hedera client instance."""
        if not self._client:
            raise RuntimeError("Hedera client not initialized")
        return self._client
    
    # =============================================================================
    # CONTRACT OPERATIONS
    # =============================================================================
    
    async def deploy_contract(
        self,
        contract_name: str,
        bytecode: str,
        constructor_params=None,
        gas_limit: int = 100000
    ) -> ContractCallResult:
        """Deploy a smart contract to Hedera."""
        try:
            # Create contract
            transaction = ContractCreateFlow().setBytecode(bytecode).setGas(gas_limit)
            
            if constructor_params:
                transaction.setConstructorParameters(constructor_params)
            
            # Execute transaction
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            if receipt.status == Status.Success:
                contract_id = receipt.contractId
                
                # Store contract info
                self.contracts[contract_name] = ContractInfo(
                    contract_id=str(contract_id),
                    name=contract_name,
                    abi=[],  # Would be loaded separately
                    deployed_at=datetime.now(timezone.utc)
                )
                
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result=str(contract_id)
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"Contract deployment failed: {receipt.status}"
                )
                
        except PrecheckStatusException as e:
            logger.error(f"Contract deployment precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Transaction precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Contract deployment receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Transaction failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Contract deployment error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def call_contract_function(
        self,
        contract_name: str,
        function_name: str,
        parameters=None,
        gas_limit: int = 100000,
        payable_amount=None
    ) -> ContractCallResult:
        """Execute a contract function that modifies state."""
        try:
            if contract_name not in self.contracts:
                raise ValueError(f"Contract {contract_name} not found")
            
            contract_id = ContractId.fromString(self.contracts[contract_name].contract_id)
            
            # Build transaction
            transaction = ContractExecuteTransaction().setContractId(contract_id).setFunction(function_name).setGas(gas_limit)
            
            if parameters:
                transaction.setFunctionParameters(parameters)
            
            if payable_amount:
                transaction.setPayableAmount(payable_amount)
            
            # Execute transaction
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            # Get transaction record for detailed results
            record = await response.getRecord(self.client)
            
            if receipt.status == Status.Success:
                result = None
                if record.contractFunctionResult:
                    result = record.contractFunctionResult
                
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result=result,
                    gas_used=record.contractFunctionResult.gasUsed if record.contractFunctionResult else None
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"Transaction failed: {receipt.status}"
                )
                
        except PrecheckStatusException as e:
            logger.error(f"Contract call precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Transaction precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Contract call receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Transaction failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Contract call error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def query_contract_function(
        self,
        contract_name: str,
        function_name: str,
        parameters=None,
        gas_limit: int = 100000
    ) -> ContractCallResult:
        """Query a contract function (read-only)."""
        try:
            if contract_name not in self.contracts:
                raise ValueError(f"Contract {contract_name} not found")
            
            contract_id = ContractId.fromString(self.contracts[contract_name].contract_id)
            
            # Build query
            query = ContractCallQuery().setContractId(contract_id).setFunction(function_name).setGas(gas_limit)
            
            if parameters:
                query.setFunctionParameters(parameters)
            
            # Execute query
            result = await query.execute(self.client)
            
            return ContractCallResult(
                success=True,
                transaction_id="",  # Queries don't have transaction IDs
                result=result,
                gas_used=result.gasUsed if hasattr(result, 'gasUsed') else None
            )
            
        except PrecheckStatusException as e:
            logger.error(f"Contract query precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Query precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Contract query receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Query failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Contract query error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    # =============================================================================
    # SKILL TOKEN OPERATIONS
    # =============================================================================
    
    async def mint_skill_token(
        self,
        skill_name: str,
        skill_category: SkillCategory,
        initial_level: int = 1,
        recipient_address: str = None
    ) -> ContractCallResult:
        """Mint a new skill token."""
        try:
            # Use recipient_address or operator as default
            recipient = recipient_address or self.config.operator_id
            
            # Prepare parameters
            params = ContractFunctionParameters().addString(skill_name).addString(skill_category.value).addUint256(initial_level).addString(recipient)
            
            return await self.call_contract_function(
                contract_name="SkillToken",
                function_name="createSkill",
                parameters=params
            )
            
        except Exception as e:
            logger.error(f"Skill token minting error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def update_skill_level(
        self,
        token_id: int,
        new_level: int,
        experience_gained: int = 0
    ) -> ContractCallResult:
        """Update skill token level and experience."""
        try:
            params = ContractFunctionParameters().addUint256(token_id).addUint256(new_level).addUint256(experience_gained)
            
            return await self.call_contract_function(
                contract_name="SkillToken",
                function_name="updateSkillLevel",
                parameters=params
            )
            
        except PrecheckStatusException as e:
            logger.error(f"Skill level update precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Update precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Skill level update receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Update failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Skill level update error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def get_skill_metadata(
        self,
        token_id: int
    ) -> ContractCallResult:
        """Get skill token metadata."""
        try:
            params = ContractFunctionParameters().addUint256(token_id)
            
            return await self.query_contract_function(
                contract_name="SkillToken",
                function_name="getSkillMetadata",
                parameters=params
            )
            
        except PrecheckStatusException as e:
            logger.error(f"Skill metadata query precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Metadata query precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Skill metadata query receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Metadata query failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Skill metadata query error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    # =============================================================================
    # TALENT POOL OPERATIONS  
    # =============================================================================
    
    async def create_talent_pool(
        self,
        title: str,
        description: str,
        required_skills: List[Dict[str, Any]],
        stake_amount: float,
        duration_days: int
    ) -> ContractCallResult:
        """Create a new talent pool."""
        try:
            # Convert stake amount to tinybars
            stake_tinybars = int(stake_amount * 100_000_000)  # HBAR to tinybars
            
            # Serialize required skills
            skills_json = json.dumps(required_skills)
            
            params = ContractFunctionParameters().addString(title).addString(description).addString(skills_json).addUint256(stake_tinybars).addUint256(duration_days)
            
            return await self.call_contract_function(
                contract_name="TalentPool",
                function_name="createPool",
                parameters=params,
                payable_amount=Hbar.fromTinybars(stake_tinybars)
            )
            
        except Exception as e:
            logger.error(f"Talent pool creation error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def apply_to_pool(
        self,
        pool_id: int,
        skill_token_ids: List[int],
        cover_letter: str = ""
    ) -> ContractCallResult:
        """Apply to a talent pool."""
        try:
            # Convert skill token IDs to contract format
            skill_ids_bytes = b"".join(id.to_bytes(32, byteorder='big') for id in skill_token_ids)
            
            params = ContractFunctionParameters().addUint256(pool_id).addBytes(skill_ids_bytes).addString(cover_letter)
            
            return await self.call_contract_function(
                contract_name="TalentPool", 
                function_name="applyToPool",
                parameters=params
            )
            
        except PrecheckStatusException as e:
            logger.error(f"Pool application precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Application precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Pool application receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Application failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Pool application error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    # =============================================================================
    # HCS OPERATIONS
    # =============================================================================
    
    async def create_topic(
        self,
        memo: str = "",
        admin_key=None,
        submit_key=None
    ) -> ContractCallResult:
        """Create a new HCS topic."""
        try:
            transaction = TopicCreateTransaction()
            
            if memo:
                transaction.setTopicMemo(memo)
            if admin_key:
                transaction.setAdminKey(admin_key.publicKey)
            if submit_key:
                transaction.setSubmitKey(submit_key.publicKey)
            
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            if receipt.status == Status.Success:
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result=str(receipt.topicId)
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"Topic creation failed: {receipt.status}"
                )
                
        except PrecheckStatusException as e:
            logger.error(f"Topic creation precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Topic creation precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"Topic creation receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Topic creation failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"Topic creation error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def submit_hcs_message(
        self,
        topic_id: str,
        message: str
    ) -> ContractCallResult:
        """Submit a message to HCS topic."""
        try:
            topic = TopicId.fromString(topic_id)
            
            transaction = TopicMessageSubmitTransaction().setTopicId(topic).setMessage(message)
            
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            if receipt.status == Status.Success:
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result={"sequence_number": receipt.topicSequenceNumber}
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"Message submission failed: {receipt.status}"
                )
                
        except PrecheckStatusException as e:
            logger.error(f"HCS message submission precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Message submission precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"HCS message submission receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"Message submission failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"HCS message submission error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    # =============================================================================
    # TOKEN OPERATIONS (HTS)
    # =============================================================================
    
    async def create_nft_token(
        self,
        name: str,
        symbol: str,
        metadata: Dict[str, Any]
    ) -> ContractCallResult:
        """Create a new NFT token."""
        try:
            transaction = (TokenCreateTransaction()
                         .setTokenName(name)
                         .setTokenSymbol(symbol)
                         .setTokenType(TokenType.NON_FUNGIBLE_UNIQUE)
                         .setSupplyType(TokenSupplyType.FINITE)
                         .setMaxSupply(1000000)  # Max 1M tokens
                         .setTreasuryAccountId(AccountId.fromString(self.config.operator_id))
                         .setSupplyKey(PrivateKey.fromString(self.config.operator_key).publicKey)
                         .setAdminKey(PrivateKey.fromString(self.config.operator_key).publicKey))
            
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            if receipt.status == Status.Success:
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result=str(receipt.tokenId)
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"Token creation failed: {receipt.status}"
                )
                
        except Exception as e:
            logger.error(f"NFT token creation error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    async def mint_nft(
        self,
        token_id: str,
        metadata_uri: str,
        recipient_id: str
    ) -> ContractCallResult:
        """Mint an NFT to a recipient."""
        try:
            token = TokenId.fromString(token_id)
            recipient = AccountId.fromString(recipient_id)
            
            # Metadata as bytes
            metadata_bytes = metadata_uri.encode('utf-8')
            
            transaction = (TokenMintTransaction()
                         .setTokenId(token)
                         .addMetadata(metadata_bytes))
            
            response = await transaction.execute(self.client)
            receipt = await response.getReceipt(self.client)
            
            if receipt.status == Status.Success:
                # Transfer to recipient if different from treasury
                if recipient_id != self.config.operator_id:
                    serial_number = receipt.serials[0]
                    
                    transfer_tx = (TransferTransaction()
                                 .addNftTransfer(token.nft(serial_number), 
                                               AccountId.fromString(self.config.operator_id), 
                                               recipient))
                    
                    transfer_response = await transfer_tx.execute(self.client)
                    transfer_receipt = await transfer_response.getReceipt(self.client)
                    
                    if transfer_receipt.status != Status.Success:
                        logger.warning(f"NFT minted but transfer failed: {transfer_receipt.status}")
                
                return ContractCallResult(
                    success=True,
                    transaction_id=str(response.transactionId),
                    result={"serial_number": receipt.serials[0]}
                )
            else:
                return ContractCallResult(
                    success=False,
                    transaction_id=str(response.transactionId),
                    error=f"NFT minting failed: {receipt.status}"
                )
                
        except PrecheckStatusException as e:
            logger.error(f"NFT minting precheck failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"NFT minting precheck failed: {e.status}"
            )
        except ReceiptStatusException as e:
            logger.error(f"NFT minting receipt failed: {e.status}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=f"NFT minting failed with status: {e.status}"
            )
        except Exception as e:
            logger.error(f"NFT minting error: {str(e)}")
            return ContractCallResult(
                success=False,
                transaction_id="",
                error=str(e)
            )
    
    # =============================================================================
    # UTILITY METHODS
    # =============================================================================
    
    async def get_account_balance(self, account_id: str) -> Dict[str, Any]:
        """Get account balance."""
        try:
            account = AccountId.fromString(account_id)
            balance = await AccountBalanceQuery().setAccountId(account).execute(self.client)
            
            return {
                "hbar_balance": balance.hbars.toTinybars(),
                "tokens": {str(token_id): amount for token_id, amount in balance.tokens.items()}
            }
            
        except Exception as e:
            logger.error(f"Balance query error: {str(e)}")
            return {"error": str(e)}
    
    async def check_connection(self) -> Dict[str, Any]:
        """Check Hedera network connection."""
        try:
            # Try to get operator account balance as a health check
            if self.config.operator_id:
                balance_result = await self.get_account_balance(self.config.operator_id)
                if "error" not in balance_result:
                    return {
                        "status": "connected",
                        "network": self.config.network.value,
                        "operator_id": self.config.operator_id,
                        "balance": balance_result["hbar_balance"]
                    }
            
            return {
                "status": "error",
                "message": "Failed to query operator balance"
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": str(e)
            }
    
    def validate_hedera_address(self, address: str) -> bool:
        """Validate Hedera account address format."""
        try:
            AccountId.fromString(address)
            return True
        except:
            return False


# =============================================================================
# GLOBAL MANAGER INSTANCE
# =============================================================================

# Global manager instance
_hedera_manager: Optional[HederaManager] = None


def initialize_hedera_client() -> None:
    """Initialize the global Hedera manager instance."""
    global _hedera_manager
    try:
        _hedera_manager = HederaManager()
        logger.info("Hedera client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Hedera client: {str(e)}")
        raise


def get_client() -> Client:
    """Get the Hedera client instance."""
    if not _hedera_manager:
        initialize_hedera_client()
    return _hedera_manager.client


def get_contract_manager() -> HederaManager:
    """Get the global Hedera manager instance."""
    if not _hedera_manager:
        initialize_hedera_client()
    return _hedera_manager


def get_hedera_manager() -> HederaManager:
    """Get the global Hedera manager instance (alias for get_contract_manager)."""
    return get_contract_manager()


# =============================================================================
# CONVENIENCE FUNCTIONS (for backward compatibility)
# =============================================================================

async def create_skill_token(
    skill_name: str,
    skill_category: SkillCategory,
    initial_level: int = 1,
    recipient_address: str = None
) -> ContractCallResult:
    """Create a skill token (convenience function)."""
    manager = get_hedera_manager()
    return await manager.mint_skill_token(skill_name, skill_category, initial_level, recipient_address)


async def update_skill_level(
    token_id: int,
    new_level: int,
    experience_gained: int = 0
) -> ContractCallResult:
    """Update skill level (convenience function)."""
    manager = get_hedera_manager()
    return await manager.update_skill_level(token_id, new_level, experience_gained)


async def add_skill_experience(
    token_id: int,
    experience_points: int
) -> ContractCallResult:
    """Add experience to skill token (convenience function).""" 
    manager = get_hedera_manager()
    # Get current skill data first, then update
    current_result = await manager.get_skill_metadata(token_id)
    if current_result.success and current_result.result:
        # Extract current level and add experience
        # This would need to parse the contract result properly
        pass
    return await manager.update_skill_level(token_id, 0, experience_points)  # Level 0 means don't change level


async def get_skill_token_info(token_id: int) -> Dict[str, Any]:
    """Get skill token information (convenience function)."""
    manager = get_hedera_manager()
    result = await manager.get_skill_metadata(token_id)
    
    if result.success:
        return {
            "success": True,
            "token_id": token_id,
            "metadata": result.result
        }
    else:
        return {
            "success": False,
            "error": result.error
        }


async def get_user_skills(user_address: str) -> Dict[str, Any]:
    """Get all skills for a user (convenience function)."""
    manager = get_hedera_manager()
    # This would require a contract query to get all user skills
    # Implementation depends on how the smart contract stores this data
    return {
        "success": True,
        "user_address": user_address,
        "skills": []  # Would be populated from contract query
    }


async def create_job_pool(
    title: str,
    description: str,
    required_skills: List[Dict[str, Any]],
    stake_amount: float,
    duration_days: int
) -> ContractCallResult:
    """Create a job pool (convenience function)."""
    manager = get_hedera_manager()
    return await manager.create_talent_pool(title, description, required_skills, stake_amount, duration_days)


async def apply_to_pool(
    pool_id: int,
    skill_token_ids: List[int],
    cover_letter: str = ""
) -> ContractCallResult:
    """Apply to a pool (convenience function)."""
    manager = get_hedera_manager()
    return await manager.apply_to_pool(pool_id, skill_token_ids, cover_letter)


async def make_pool_match(
    pool_id: int,
    candidate_address: str,
    match_score: int
) -> ContractCallResult:
    """Make a pool match (convenience function)."""
    manager = get_hedera_manager()
    # This would call a contract function to finalize the match
    params = ContractFunctionParameters().addUint256(pool_id).addString(candidate_address).addUint256(match_score)
    
    return await manager.call_contract_function(
        contract_name="TalentPool",
        function_name="finalizeMatch",
        parameters=params
    )


async def get_job_pool_info(pool_id: int) -> Dict[str, Any]:
    """Get job pool information (convenience function)."""
    manager = get_hedera_manager()
    params = ContractFunctionParameters().addUint256(pool_id)
    
    result = await manager.query_contract_function(
        contract_name="TalentPool",
        function_name="getPoolInfo", 
        parameters=params
    )
    
    if result.success:
        return {
            "success": True,
            "pool_id": pool_id,
            "pool_data": result.result
        }
    else:
        return {
            "success": False,
            "error": result.error
        }


async def create_nft_token(
    name: str,
    symbol: str,
    metadata: Dict[str, Any]
) -> str:
    """Create NFT token (convenience function)."""
    manager = get_hedera_manager()
    result = await manager.create_nft_token(name, symbol, metadata)
    
    if result.success:
        return result.result
    else:
        raise Exception(f"Failed to create NFT token: {result.error}")


async def mint_nft(
    token_id: str,
    metadata_uri: str,
    recipient_id: str
) -> str:
    """Mint NFT (convenience function)."""
    manager = get_hedera_manager()
    result = await manager.mint_nft(token_id, metadata_uri, recipient_id)
    
    if result.success:
        return result.transaction_id
    else:
        raise Exception(f"Failed to mint NFT: {result.error}")


async def submit_hcs_message(topic_id: str, message: str) -> str:
    """Submit HCS message (convenience function)."""
    manager = get_hedera_manager()
    result = await manager.submit_hcs_message(topic_id, message)
    
    if result.success:
        return result.transaction_id
    else:
        raise Exception(f"Failed to submit HCS message: {result.error}")


def validate_hedera_address(address: str) -> bool:
    """Validate Hedera address (convenience function)."""
    try:
        manager = get_hedera_manager()
        return manager.validate_hedera_address(address)
    except:
        # Fallback validation
        try:
            AccountId.fromString(address)
            return True
        except:
            return False


async def check_hedera_connection() -> Dict[str, Any]:
    """Check Hedera connection (convenience function)."""
    try:
        manager = get_hedera_manager()
        return await manager.check_connection()
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


async def check_contract_deployments() -> Dict[str, Any]:
    """Check contract deployment status (convenience function)."""
    try:
        manager = get_hedera_manager()
        
        contracts_status = {}
        for name, contract in manager.contracts.items():
            contracts_status[name] = {
                "deployed": bool(contract.contract_id),
                "contract_id": contract.contract_id,
                "deployed_at": contract.deployed_at.isoformat()
            }
        
        return {
            "status": "checked",
            "contracts": contracts_status,
            "total_contracts": len(manager.contracts)
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e)
        }
