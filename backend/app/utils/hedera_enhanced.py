"""
Enhanced Hedera Client Utility Module for TalentChain Pro

This module provides comprehensive utilities for interacting with the Hedera network,
including smart contract management, HTS token operations, HCS messaging,
and advanced transaction handling.
"""

import os
import json
import asyncio
import logging
from typing import Optional, Dict, Any, List, Union, Tuple
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

from dotenv import load_dotenv
from hedera import (
    # Core
    Client, AccountId, PrivateKey, PublicKey, Hbar,
    # Smart Contracts
    ContractId, ContractCreateFlow, ContractExecuteTransaction, 
    ContractCallQuery, ContractFunctionParameters, ContractFunctionResult,
    # Tokens (HTS)
    TokenId, TokenCreateTransaction, TokenType, TokenSupplyType,
    TokenMintTransaction, TokenTransferTransaction, TokenBurnTransaction,
    TokenAssociateTransaction, TokenFreezeTransaction, TokenWipeTransaction,
    # Consensus Service (HCS)
    TopicId, TopicCreateTransaction, TopicMessageSubmitTransaction,
    TopicInfoQuery, TopicUpdateTransaction,
    # Transactions
    Transaction, TransactionResponse, TransactionReceipt,
    TransferTransaction, AccountCreateTransaction, AccountUpdateTransaction,
    # Query
    AccountBalanceQuery, AccountInfoQuery,
    # Status and Exceptions
    Status, PrecheckStatusError, ReceiptStatusError
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class NetworkType(Enum):
    MAINNET = "mainnet"
    TESTNET = "testnet"
    PREVIEWNET = "previewnet"

class SkillCategory(Enum):
    BLOCKCHAIN = "blockchain"
    FRONTEND = "frontend"
    BACKEND = "backend"
    DEVOPS = "devops"
    DESIGN = "design"
    PRODUCT = "product"
    DATA_SCIENCE = "data_science"
    AI = "ai"
    MANAGEMENT = "management"
    OTHER = "other"

@dataclass
class HederaConfig:
    """Hedera network configuration"""
    network: NetworkType
    account_id: str
    private_key: str
    max_transaction_fee: float = 20.0  # HBAR
    max_query_payment: float = 1.0    # HBAR

@dataclass
class ContractInfo:
    """Smart contract information"""
    contract_id: str
    name: str
    abi: Dict[str, Any]
    bytecode: str

@dataclass
class SkillTokenData:
    """Skill token metadata structure"""
    name: str
    category: SkillCategory
    level: int
    description: str
    evidence_links: List[str]
    issuer: str
    issued_at: datetime
    metadata: Dict[str, Any]

@dataclass
class HCSMessage:
    """HCS message structure"""
    topic_id: str
    message: str
    sequence_number: Optional[int] = None
    consensus_timestamp: Optional[datetime] = None
    running_hash: Optional[bytes] = None

class HederaManager:
    """
    Enhanced Hedera network manager with comprehensive functionality
    for TalentChain Pro operations
    """
    
    def __init__(self, config: Optional[HederaConfig] = None):
        """Initialize Hedera manager with configuration"""
        self.config = config or self._load_config_from_env()
        self._client: Optional[Client] = None
        self._contracts: Dict[str, ContractInfo] = {}
        self._topics: Dict[str, TopicId] = {}
        
        # Initialize client
        self._initialize_client()
        
        # Load contract configurations
        self._load_contracts()
        
    def _load_config_from_env(self) -> HederaConfig:
        """Load configuration from environment variables"""
        network_str = os.getenv("HEDERA_NETWORK", "testnet").lower()
        network = NetworkType(network_str)
        
        account_id = os.getenv("HEDERA_ACCOUNT_ID")
        private_key = os.getenv("HEDERA_PRIVATE_KEY")
        
        if not account_id or not private_key:
            raise ValueError("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set")
            
        return HederaConfig(
            network=network,
            account_id=account_id,
            private_key=private_key,
            max_transaction_fee=float(os.getenv("HEDERA_MAX_TRANSACTION_FEE", "20")),
            max_query_payment=float(os.getenv("HEDERA_MAX_QUERY_PAYMENT", "1"))
        )
    
    def _initialize_client(self):
        """Initialize Hedera client based on network"""
        if self.config.network == NetworkType.MAINNET:
            self._client = Client.forMainnet()
        elif self.config.network == NetworkType.TESTNET:
            self._client = Client.forTestnet()
        elif self.config.network == NetworkType.PREVIEWNET:
            self._client = Client.forPreviewnet()
        else:
            raise ValueError(f"Invalid network: {self.config.network}")
        
        # Set operator
        operator_id = AccountId.fromString(self.config.account_id)
        operator_key = PrivateKey.fromString(self.config.private_key)
        
        self._client.setOperator(operator_id, operator_key)
        self._client.setDefaultMaxTransactionFee(Hbar.fromTinybars(int(self.config.max_transaction_fee * 100_000_000)))
        self._client.setDefaultMaxQueryPayment(Hbar.fromTinybars(int(self.config.max_query_payment * 100_000_000)))
        
        logger.info(f"Hedera client initialized for {self.config.network.value}")
        logger.info(f"Operator account: {self.config.account_id}")
    
    def _load_contracts(self):
        """Load smart contract configurations"""
        # Load from environment or configuration files
        skill_token_id = os.getenv("CONTRACT_SKILL_TOKEN")
        talent_pool_id = os.getenv("CONTRACT_TALENT_POOL")
        
        if skill_token_id:
            self._contracts["SkillToken"] = ContractInfo(
                contract_id=skill_token_id,
                name="SkillToken",
                abi={},  # Would be loaded from artifacts
                bytecode=""
            )
            
        if talent_pool_id:
            self._contracts["TalentPool"] = ContractInfo(
                contract_id=talent_pool_id,
                name="TalentPool", 
                abi={},
                bytecode=""
            )
    
    @property
    def client(self) -> Client:
        """Get the Hedera client"""
        if not self._client:
            self._initialize_client()
        return self._client
    
    # ============ SMART CONTRACT OPERATIONS ============
    
    async def deploy_contract(
        self, 
        bytecode: str, 
        constructor_params: Optional[ContractFunctionParameters] = None,
        gas: int = 4_000_000
    ) -> Tuple[str, str]:
        """
        Deploy a smart contract to Hedera
        
        Args:
            bytecode: Contract bytecode (hex string)
            constructor_params: Constructor parameters
            gas: Gas limit for deployment
            
        Returns:
            Tuple of (contract_id, transaction_id)
        """
        try:
            # Remove 0x prefix if present
            clean_bytecode = bytecode[2:] if bytecode.startswith("0x") else bytecode
            
            # Create contract
            contract_create_flow = ContractCreateFlow().setGas(gas).setBytecode(clean_bytecode)
            
            if constructor_params:
                contract_create_flow.setConstructorParameters(constructor_params)
            
            # Execute transaction
            tx_response = await contract_create_flow.executeAsync(self.client)
            receipt = await tx_response.getReceiptAsync(self.client)
            
            contract_id = receipt.contractId.toString()
            transaction_id = tx_response.transactionId.toString()
            
            logger.info(f"Contract deployed: {contract_id}")
            return contract_id, transaction_id
            
        except Exception as e:
            logger.error(f"Contract deployment failed: {e}")
            raise
    
    async def call_contract_function(
        self,
        contract_id: str,
        function_name: str,
        parameters: Optional[ContractFunctionParameters] = None,
        gas: int = 100_000,
        hbar_amount: Optional[Hbar] = None
    ) -> Tuple[str, ContractFunctionResult]:
        """
        Call a smart contract function
        
        Args:
            contract_id: Contract ID
            function_name: Function name to call
            parameters: Function parameters
            gas: Gas limit
            hbar_amount: HBAR to send with transaction
            
        Returns:
            Tuple of (transaction_id, result)
        """
        try:
            contract_exec_tx = (
                ContractExecuteTransaction()
                .setContractId(ContractId.fromString(contract_id))
                .setGas(gas)
                .setFunction(function_name, parameters)
            )
            
            if hbar_amount:
                contract_exec_tx.setPayableAmount(hbar_amount)
            
            tx_response = await contract_exec_tx.executeAsync(self.client)
            receipt = await tx_response.getReceiptAsync(self.client)
            
            # Get function result if available
            result = receipt.getContractExecuteResult()
            
            transaction_id = tx_response.transactionId.toString()
            logger.info(f"Contract function {function_name} executed: {transaction_id}")
            
            return transaction_id, result
            
        except Exception as e:
            logger.error(f"Contract function call failed: {e}")
            raise
    
    async def query_contract_function(
        self,
        contract_id: str,
        function_name: str,
        parameters: Optional[ContractFunctionParameters] = None,
        gas: int = 50_000
    ) -> ContractFunctionResult:
        """
        Query a smart contract function (read-only)
        
        Args:
            contract_id: Contract ID
            function_name: Function name to query
            parameters: Function parameters
            gas: Gas limit
            
        Returns:
            Contract function result
        """
        try:
            contract_query = (
                ContractCallQuery()
                .setContractId(ContractId.fromString(contract_id))
                .setGas(gas)
                .setFunction(function_name, parameters)
            )
            
            result = await contract_query.executeAsync(self.client)
            logger.info(f"Contract function {function_name} queried successfully")
            
            return result
            
        except Exception as e:
            logger.error(f"Contract function query failed: {e}")
            raise
    
    # ============ SKILL TOKEN OPERATIONS ============
    
    async def mint_skill_token(
        self,
        recipient_id: str,
        skill_data: SkillTokenData
    ) -> Tuple[str, int]:
        """
        Mint a new skill token (soulbound NFT)
        
        Args:
            recipient_id: Recipient's Hedera account ID
            skill_data: Skill token metadata
            
        Returns:
            Tuple of (transaction_id, token_id)
        """
        try:
            skill_contract_id = self._contracts["SkillToken"].contract_id
            
            # Prepare function parameters
            params = (
                ContractFunctionParameters()
                .addAddress(recipient_id)
                .addString(skill_data.name)
                .addString(skill_data.category.value)
                .addUint8(skill_data.level)
                .addUint256(0)  # initial experience
                .addString(json.dumps({
                    "name": skill_data.name,
                    "description": skill_data.description,
                    "category": skill_data.category.value,
                    "level": skill_data.level,
                    "evidence_links": skill_data.evidence_links,
                    "issuer": skill_data.issuer,
                    "issued_at": skill_data.issued_at.isoformat(),
                    "metadata": skill_data.metadata
                }))
            )
            
            transaction_id, result = await self.call_contract_function(
                skill_contract_id,
                "mintSkillToken",
                params,
                gas=200_000
            )
            
            # Extract token ID from result
            token_id = result.getUint256(0) if result else 0
            
            logger.info(f"Skill token minted: {token_id} for {recipient_id}")
            return transaction_id, token_id
            
        except Exception as e:
            logger.error(f"Skill token minting failed: {e}")
            raise
    
    async def update_skill_level(
        self,
        token_id: int,
        new_level: int,
        evidence: str,
        consensus_deadline: int = 604800  # 7 days
    ) -> str:
        """
        Propose a skill level update through oracle consensus
        
        Args:
            token_id: Skill token ID
            new_level: Proposed new skill level
            evidence: Supporting evidence
            consensus_deadline: Consensus deadline in seconds
            
        Returns:
            Transaction ID
        """
        try:
            skill_contract_id = self._contracts["SkillToken"].contract_id
            
            params = (
                ContractFunctionParameters()
                .addUint256(token_id)
                .addUint8(new_level)
                .addString(evidence)
                .addUint256(consensus_deadline)
            )
            
            transaction_id, _ = await self.call_contract_function(
                skill_contract_id,
                "proposeSkillLevelUpdate",
                params,
                gas=150_000
            )
            
            logger.info(f"Skill level update proposed for token {token_id}")
            return transaction_id
            
        except Exception as e:
            logger.error(f"Skill level update failed: {e}")
            raise
    
    async def get_skill_metadata(
        self,
        token_id: int
    ) -> Dict[str, Any]:
        """
        Get comprehensive skill token metadata
        
        Args:
            token_id: Skill token ID
            
        Returns:
            Skill metadata dictionary
        """
        try:
            skill_contract_id = self._contracts["SkillToken"].contract_id
            
            params = ContractFunctionParameters().addUint256(token_id)
            
            result = await self.query_contract_function(
                skill_contract_id,
                "getSkillMetadata",
                params
            )
            
            # Parse result (adjust based on actual contract return structure)
            metadata = {
                "name": result.getString(0),
                "category": result.getString(1),
                "level": result.getUint8(2),
                "experience": result.getUint256(3),
                "last_updated": result.getUint256(4),
                "is_active": result.getBool(6),
                "uri": result.getString(7)
            }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to get skill metadata: {e}")
            raise
    
    # ============ TALENT POOL OPERATIONS ============
    
    async def create_talent_pool(
        self,
        job_title: str,
        job_description: str,
        required_skills: List[str],
        min_skill_levels: List[int],
        candidate_reward: int,  # in tinybars
        max_candidates: int,
        application_duration: int,  # seconds
        selection_duration: int    # seconds
    ) -> Tuple[str, int]:
        """
        Create a new talent pool
        
        Args:
            job_title: Job title
            job_description: Job description
            required_skills: List of required skill categories
            min_skill_levels: Minimum levels for each skill
            candidate_reward: Reward amount in tinybars
            max_candidates: Maximum number of candidates
            application_duration: Application period in seconds
            selection_duration: Selection period in seconds
            
        Returns:
            Tuple of (transaction_id, pool_id)
        """
        try:
            pool_contract_id = self._contracts["TalentPool"].contract_id
            
            # Create matching criteria (simplified)
            criteria_params = (
                ContractFunctionParameters()
                .addUint256(100)  # min_reputation
                .addUint256(0)    # min_experience
                .addUint8(1)      # min_skill_level
                .addBool(False)   # require_certification
            )
            
            params = (
                ContractFunctionParameters()
                .addString(job_title)
                .addString(job_description)
                .addStringArray(required_skills)
                .addUint8Array(min_skill_levels)
                .addUint256(candidate_reward)
                .addUint8(0)  # pool_type (Standard)
                .addUint256(max_candidates)
                .addUint256(application_duration)
                .addUint256(selection_duration)
                # Note: Matching criteria would need special handling for struct
            )
            
            transaction_id, result = await self.call_contract_function(
                pool_contract_id,
                "createPool",
                params,
                gas=300_000,
                hbar_amount=Hbar.fromTinybars(candidate_reward + 1000000)  # Add extra for fees
            )
            
            # Extract pool ID from result
            pool_id = result.getUint256(0) if result else 0
            
            logger.info(f"Talent pool created: {pool_id}")
            return transaction_id, pool_id
            
        except Exception as e:
            logger.error(f"Talent pool creation failed: {e}")
            raise
    
    async def apply_to_pool(
        self,
        pool_id: int,
        stake_amount: int = 100000000  # 1 HBAR in tinybars
    ) -> str:
        """
        Apply to a talent pool
        
        Args:
            pool_id: Pool ID to apply to
            stake_amount: Stake amount in tinybars
            
        Returns:
            Transaction ID
        """
        try:
            pool_contract_id = self._contracts["TalentPool"].contract_id
            
            params = ContractFunctionParameters().addUint256(pool_id)
            
            transaction_id, _ = await self.call_contract_function(
                pool_contract_id,
                "applyToPool",
                params,
                gas=200_000,
                hbar_amount=Hbar.fromTinybars(stake_amount)
            )
            
            logger.info(f"Applied to pool {pool_id}")
            return transaction_id
            
        except Exception as e:
            logger.error(f"Pool application failed: {e}")
            raise
    
    # ============ HCS OPERATIONS ============
    
    async def create_topic(
        self,
        topic_memo: str,
        admin_key: Optional[PrivateKey] = None,
        submit_key: Optional[PrivateKey] = None,
        auto_renew_period: int = 7890000  # ~3 months
    ) -> Tuple[str, str]:
        """
        Create a new HCS topic
        
        Args:
            topic_memo: Topic description
            admin_key: Admin key for topic management
            submit_key: Submit key for private topics
            auto_renew_period: Auto-renew period in seconds
            
        Returns:
            Tuple of (topic_id, transaction_id)
        """
        try:
            topic_create_tx = (
                TopicCreateTransaction()
                .setTopicMemo(topic_memo)
                .setAutoRenewPeriod(auto_renew_period)
                .setAutoRenewAccountId(self.client.getOperatorAccountId())
            )
            
            if admin_key:
                topic_create_tx.setAdminKey(admin_key)
            if submit_key:
                topic_create_tx.setSubmitKey(submit_key)
            
            tx_response = await topic_create_tx.executeAsync(self.client)
            receipt = await tx_response.getReceiptAsync(self.client)
            
            topic_id = receipt.topicId.toString()
            transaction_id = tx_response.transactionId.toString()
            
            # Store topic for future reference
            self._topics[topic_memo] = receipt.topicId
            
            logger.info(f"HCS topic created: {topic_id}")
            return topic_id, transaction_id
            
        except Exception as e:
            logger.error(f"HCS topic creation failed: {e}")
            raise
    
    async def submit_hcs_message(
        self,
        topic_id: str,
        message: Union[str, Dict[str, Any]],
        max_chunks: int = 1
    ) -> str:
        """
        Submit a message to an HCS topic
        
        Args:
            topic_id: Topic ID to submit to
            message: Message content (string or dict)
            max_chunks: Maximum message chunks for large messages
            
        Returns:
            Transaction ID
        """
        try:
            # Convert dict to JSON string
            if isinstance(message, dict):
                message = json.dumps(message, default=str)
            
            # Handle large messages by chunking if needed
            message_bytes = message.encode('utf-8')
            if len(message_bytes) > 1024:  # HCS message limit
                if max_chunks <= 1:
                    raise ValueError("Message too large for single chunk")
                # TODO: Implement message chunking
                message = message[:1024]  # Truncate for now
                logger.warning("Message truncated due to size limit")
            
            topic_message_tx = (
                TopicMessageSubmitTransaction()
                .setTopicId(TopicId.fromString(topic_id))
                .setMessage(message)
            )
            
            tx_response = await topic_message_tx.executeAsync(self.client)
            receipt = await tx_response.getReceiptAsync(self.client)
            
            transaction_id = tx_response.transactionId.toString()
            sequence_number = receipt.topicSequenceNumber
            
            logger.info(f"HCS message submitted: {transaction_id}, sequence: {sequence_number}")
            return transaction_id
            
        except Exception as e:
            logger.error(f"HCS message submission failed: {e}")
            raise
    
    async def submit_work_evaluation(
        self,
        topic_id: str,
        user_id: str,
        skill_token_ids: List[int],
        work_description: str,
        work_content: str,
        evaluation_result: Dict[str, Any]
    ) -> str:
        """
        Submit work evaluation to HCS for transparency
        
        Args:
            topic_id: HCS topic ID for evaluations
            user_id: User account ID
            skill_token_ids: List of relevant skill token IDs
            work_description: Description of work evaluated
            work_content: Work content or links
            evaluation_result: Detailed evaluation results
            
        Returns:
            Transaction ID
        """
        evaluation_message = {
            "type": "work_evaluation",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "skill_token_ids": skill_token_ids,
            "work_description": work_description,
            "work_content": work_content,
            "evaluation": evaluation_result,
            "evaluator": self.config.account_id
        }
        
        return await self.submit_hcs_message(topic_id, evaluation_message)
    
    async def submit_reputation_update(
        self,
        topic_id: str,
        account_id: str,
        reputation_change: int,
        reason: str,
        evidence: Dict[str, Any]
    ) -> str:
        """
        Submit reputation update to HCS for audit trail
        
        Args:
            topic_id: HCS topic ID for reputation updates
            account_id: Account being evaluated
            reputation_change: Reputation change amount
            reason: Reason for the change
            evidence: Supporting evidence
            
        Returns:
            Transaction ID
        """
        reputation_message = {
            "type": "reputation_update",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "account_id": account_id,
            "reputation_change": reputation_change,
            "reason": reason,
            "evidence": evidence,
            "oracle": self.config.account_id
        }
        
        return await self.submit_hcs_message(topic_id, reputation_message)
    
    # ============ ACCOUNT OPERATIONS ============
    
    async def get_account_balance(
        self,
        account_id: str
    ) -> Dict[str, Any]:
        """
        Get account balance information
        
        Args:
            account_id: Account ID to query
            
        Returns:
            Balance information dictionary
        """
        try:
            balance_query = AccountBalanceQuery().setAccountId(AccountId.fromString(account_id))
            balance = await balance_query.executeAsync(self.client)
            
            balance_info = {
                "hbar_balance": balance.hbars.toTinybars(),
                "tokens": {}
            }
            
            for token_id, amount in balance.tokens.items():
                balance_info["tokens"][token_id.toString()] = amount
            
            return balance_info
            
        except Exception as e:
            logger.error(f"Failed to get account balance: {e}")
            raise
    
    async def get_account_info(
        self,
        account_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed account information
        
        Args:
            account_id: Account ID to query
            
        Returns:
            Account information dictionary
        """
        try:
            info_query = AccountInfoQuery().setAccountId(AccountId.fromString(account_id))
            info = await info_query.executeAsync(self.client)
            
            account_info = {
                "account_id": info.accountId.toString(),
                "balance": info.balance.toTinybars(),
                "key": info.key.toString() if info.key else None,
                "auto_renew_period": info.autoRenewPeriod.total_seconds() if info.autoRenewPeriod else None,
                "proxy_account_id": info.proxyAccountId.toString() if info.proxyAccountId else None,
                "is_deleted": info.isDeleted,
                "expiration_time": info.expirationTime.isoformat() if info.expirationTime else None
            }
            
            return account_info
            
        except Exception as e:
            logger.error(f"Failed to get account info: {e}")
            raise
    
    # ============ UTILITY METHODS ============
    
    async def wait_for_consensus(
        self,
        transaction_id: str,
        timeout: int = 30
    ) -> TransactionReceipt:
        """
        Wait for transaction consensus with timeout
        
        Args:
            transaction_id: Transaction ID to wait for
            timeout: Timeout in seconds
            
        Returns:
            Transaction receipt
        """
        # Implementation would depend on specific Hedera SDK methods
        # This is a placeholder for the concept
        await asyncio.sleep(2)  # Simple delay for now
        logger.info(f"Transaction {transaction_id} reached consensus")
        return None
    
    def get_explorer_url(
        self,
        entity_type: str,
        entity_id: str
    ) -> str:
        """
        Get HashScan explorer URL for entity
        
        Args:
            entity_type: Type (transaction, account, contract, topic, token)
            entity_id: Entity ID
            
        Returns:
            Explorer URL
        """
        network = "testnet" if self.config.network == NetworkType.TESTNET else self.config.network.value
        return f"https://hashscan.io/{network}/{entity_type}/{entity_id}"
    
    async def close(self):
        """Close the Hedera client connection"""
        if self._client:
            await self._client.close()
            self._client = None
            logger.info("Hedera client connection closed")

# Global instance
_hedera_manager: Optional[HederaManager] = None

def get_hedera_manager() -> HederaManager:
    """Get the global Hedera manager instance"""
    global _hedera_manager
    if _hedera_manager is None:
        _hedera_manager = HederaManager()
    return _hedera_manager

async def initialize_hedera_manager(config: Optional[HederaConfig] = None):
    """Initialize the global Hedera manager"""
    global _hedera_manager
    _hedera_manager = HederaManager(config)
    return _hedera_manager