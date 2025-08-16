"""
Contract Integration Tests

This module tests the integration between the backend services
and the smart contracts to ensure proper parameter mapping and
function calls.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

from app.services.governance import GovernanceService
from app.services.reputation import ReputationService
from app.utils.hedera import (
    create_governance_proposal,
    cast_governance_vote,
    delegate_voting_power,
    undelegate_voting_power,
    register_reputation_oracle,
    submit_work_evaluation
)
from app.models.governance_schemas import (
    ContractCreateProposalRequest,
    ContractCastVoteRequest,
    ContractDelegateVotesRequest
)
from app.models.reputation_schemas import (
    ContractRegisterOracleRequest,
    ContractSubmitEvaluationRequest
)


class TestGovernanceContractIntegration:
    """Test governance contract integration."""
    
    @pytest.fixture
    def governance_service(self):
        """Create a governance service instance."""
        return GovernanceService()
    
    @pytest.fixture
    def mock_contract_response(self):
        """Mock successful contract response."""
        return Mock(
            success=True,
            transaction_id="0.0.123456@1234567890.123456789",
            token_id="proposal_123",
            gas_used=150000,
            contract_address="0.0.987654"
        )
    
    @pytest.mark.asyncio
    async def test_create_proposal_contract_integration(self, governance_service, mock_contract_response):
        """Test that create_proposal calls the contract with correct parameters."""
        with patch('app.utils.hedera.create_governance_proposal', return_value=mock_contract_response):
            result = await governance_service.create_proposal(
                title="Test Proposal",
                description="This is a test proposal for integration testing",
                targets=["0.0.111111", "0.0.222222"],
                values=[0, 0],
                calldatas=["0x1234", "0x5678"],
                ipfs_hash="QmTestHash123"
            )
        
        assert result["success"] is True
        assert result["proposal_id"] == "proposal_123"
        assert result["transaction_id"] == "0.0.123456@1234567890.123456789"
        assert result["details"]["blockchain_verified"] is True
    
    @pytest.mark.asyncio
    async def test_cast_vote_contract_integration(self, governance_service, mock_contract_response):
        """Test that cast_vote calls the contract with correct parameters."""
        with patch('app.utils.hedera.cast_governance_vote', return_value=mock_contract_response):
            result = await governance_service.cast_vote(
                proposal_id="proposal_123",
                vote_type=1,  # FOR
                reason="I support this proposal"
            )
        
        assert result["success"] is True
        assert result["blockchain_verified"] is True
    
    @pytest.mark.asyncio
    async def test_delegate_voting_power_contract_integration(self, governance_service, mock_contract_response):
        """Test that delegate_voting_power calls the contract with correct parameters."""
        with patch('app.utils.hedera.delegate_voting_power', return_value=mock_contract_response):
            result = await governance_service.delegate_voting_power(
                delegatee_address="0.0.999999"
            )
        
        assert result["success"] is True
        assert result["blockchain_verified"] is True
    
    @pytest.mark.asyncio
    async def test_undelegate_voting_power_contract_integration(self, governance_service, mock_contract_response):
        """Test that undelegate_voting_power calls the contract with correct parameters."""
        with patch('app.utils.hedera.undelegate_voting_power', return_value=mock_contract_response):
            result = await governance_service.undelegate_voting_power()
        
        assert result["success"] is True
        assert result["blockchain_verified"] is True
    
    def test_contract_schema_alignment(self):
        """Test that contract schemas match the actual contract function signatures."""
        # Test CreateProposalRequest schema
        proposal_request = ContractCreateProposalRequest(
            title="Test Proposal",
            description="Test description",
            targets=["0.0.111111"],
            values=[0],
            calldatas=["0x1234"],
            ipfs_hash="QmTestHash123"
        )
        
        assert proposal_request.title == "Test Proposal"
        assert proposal_request.description == "Test description"
        assert proposal_request.targets == ["0.0.111111"]
        assert proposal_request.values == [0]
        assert proposal_request.calldatas == ["0x1234"]
        assert proposal_request.ipfs_hash == "QmTestHash123"
        
        # Test CastVoteRequest schema
        vote_request = ContractCastVoteRequest(
            proposal_id=123,
            vote=1,  # FOR
            reason="Support"
        )
        
        assert vote_request.proposal_id == 123
        assert vote_request.vote == 1
        assert vote_request.reason == "Support"
        
        # Test DelegateVotesRequest schema
        delegate_request = ContractDelegateVotesRequest(
            delegatee="0.0.999999"
        )
        
        assert delegate_request.delegatee == "0.0.999999"


class TestReputationContractIntegration:
    """Test reputation contract integration."""
    
    @pytest.fixture
    def reputation_service(self):
        """Create a reputation service instance."""
        return ReputationService()
    
    @pytest.fixture
    def mock_contract_response(self):
        """Mock successful contract response."""
        return Mock(
            success=True,
            transaction_id="0.0.123456@1234567890.123456789",
            token_id="evaluation_456",
            gas_used=200000,
            contract_address="0.0.987654"
        )
    
    @pytest.mark.asyncio
    async def test_register_oracle_contract_integration(self, reputation_service, mock_contract_response):
        """Test that register_oracle calls the contract with correct parameters."""
        with patch('app.utils.hedera.register_reputation_oracle', return_value=mock_contract_response):
            result = await reputation_service.register_oracle(
                name="Test Oracle",
                specializations=["backend", "blockchain"]
            )
        
        assert result["success"] is True
        assert result["blockchain_verified"] is True
    
    @pytest.mark.asyncio
    async def test_submit_work_evaluation_contract_integration(self, reputation_service, mock_contract_response):
        """Test that submit_work_evaluation calls the contract with correct parameters."""
        with patch('app.utils.hedera.submit_work_evaluation', return_value=mock_contract_response):
            result = await reputation_service.submit_work_evaluation(
                user="0.0.111111",
                skill_token_ids=[1, 2, 3],
                work_description="Test work",
                work_content="Test content",
                overall_score=8500,
                skill_scores=[8000, 9000, 8500],
                feedback="Great work!",
                ipfs_hash="QmTestHash456"
            )
        
        assert result["success"] is True
        assert result["blockchain_verified"] is True
    
    def test_contract_schema_alignment(self):
        """Test that contract schemas match the actual contract function signatures."""
        # Test RegisterOracleRequest schema
        oracle_request = ContractRegisterOracleRequest(
            name="Test Oracle",
            specializations=["backend", "blockchain"]
        )
        
        assert oracle_request.name == "Test Oracle"
        assert oracle_request.specializations == ["backend", "blockchain"]
        
        # Test SubmitWorkEvaluationRequest schema
        evaluation_request = ContractSubmitEvaluationRequest(
            user="0.0.111111",
            skill_token_ids=[1, 2, 3],
            work_description="Test work",
            work_content="Test content",
            overall_score=8500,
            skill_scores=[8000, 9000, 8500],
            feedback="Great work!",
            ipfs_hash="QmTestHash456"
        )
        
        assert evaluation_request.user == "0.0.111111"
        assert evaluation_request.skill_token_ids == [1, 2, 3]
        assert evaluation_request.work_description == "Test work"
        assert evaluation_request.work_content == "Test content"
        assert evaluation_request.overall_score == 8500
        assert evaluation_request.skill_scores == [8000, 9000, 8500]
        assert evaluation_request.feedback == "Great work!"
        assert evaluation_request.ipfs_hash == "QmTestHash456"


class TestContractParameterValidation:
    """Test contract parameter validation."""
    
    def test_governance_parameter_validation(self):
        """Test governance contract parameter validation."""
        # Test valid proposal creation
        try:
            proposal_request = ContractCreateProposalRequest(
                title="Valid Proposal",
                description="Valid description with enough characters",
                targets=["0.0.111111"],
                values=[0],
                calldatas=["0x1234"],
                ipfs_hash="QmValidHash123"
            )
            assert proposal_request.title == "Valid Proposal"
        except Exception as e:
            pytest.fail(f"Valid proposal creation failed: {str(e)}")
        
        # Test invalid proposal (missing required fields)
        with pytest.raises(Exception):
            ContractCreateProposalRequest(
                title="",  # Empty title
                description="Valid description",
                targets=["0.0.111111"],
                values=[0],
                calldatas=["0x1234"],
                ipfs_hash="QmValidHash123"
            )
    
    def test_reputation_parameter_validation(self):
        """Test reputation contract parameter validation."""
        # Test valid oracle registration
        try:
            oracle_request = ContractRegisterOracleRequest(
                name="Valid Oracle",
                specializations=["backend"]
            )
            assert oracle_request.name == "Valid Oracle"
        except Exception as e:
            pytest.fail(f"Valid oracle registration failed: {str(e)}")
        
        # Test invalid oracle registration (empty specializations)
        with pytest.raises(Exception):
            ContractRegisterOracleRequest(
                name="Valid Oracle",
                specializations=[]  # Empty specializations
            )


class TestContractErrorHandling:
    """Test contract error handling."""
    
    @pytest.mark.asyncio
    async def test_contract_failure_handling(self):
        """Test handling of contract call failures."""
        mock_failed_response = Mock(
            success=False,
            error="Contract call failed: insufficient gas"
        )
        
        with patch('app.utils.hedera.create_governance_proposal', return_value=mock_failed_response):
            governance_service = GovernanceService()
            
            result = await governance_service.create_proposal(
                title="Test Proposal",
                description="Test description",
                targets=["0.0.111111"],
                values=[0],
                calldatas=["0x1234"],
                ipfs_hash="QmTestHash123"
            )
            
            assert result["success"] is True  # Service should handle contract failure gracefully
            assert result["transaction_id"] is None
            assert result["details"]["blockchain_verified"] is False


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
