"""
Database Models for TalentChain Pro

This module defines SQLAlchemy ORM models for caching blockchain data
and managing application state with proper relationships and indexing.
Cross-database compatible (PostgreSQL and SQLite).
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL, DateTime, Boolean, 
    ForeignKey, JSON, Index, Enum as SQLEnum, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.types import TypeDecorator, CHAR
from enum import Enum
import uuid
import json

Base = declarative_base()


# Cross-database UUID type
class UUID(TypeDecorator):
    """Cross-database UUID type that works with both PostgreSQL and SQLite."""
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if not isinstance(value, uuid.UUID):
                if isinstance(value, str):
                    return value
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            return value


# Cross-database JSON type
class JSONType(TypeDecorator):
    """Cross-database JSON type that works with both PostgreSQL and SQLite."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        else:
            return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return value
        else:
            try:
                return json.loads(value)
            except (ValueError, TypeError):
                return value


# Enums for consistent data types
class SkillCategoryEnum(str, Enum):
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


class PoolStatusEnum(str, Enum):
    """Pool status enumeration."""
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"
    EXPIRED = "expired"


class ProposalStatusEnum(str, Enum):
    """Governance proposal status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    QUEUED = "queued"
    EXECUTED = "executed"
    CANCELLED = "cancelled"
    DEFEATED = "defeated"


class EvaluationStatusEnum(str, Enum):
    """Evaluation status enumeration."""
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    CONSENSUS_REACHED = "consensus_reached"
    FINALIZED = "finalized"
    CHALLENGED = "challenged"


# Core Models
class SkillToken(Base):
    """Cache for skill tokens from blockchain."""
    __tablename__ = "skill_tokens"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    token_id = Column(String(50), unique=True, nullable=False, index=True)
    owner_address = Column(String(50), nullable=False, index=True)
    
    # Skill information
    skill_name = Column(String(100), nullable=False)
    skill_category = Column(SQLEnum(SkillCategoryEnum), nullable=False, index=True)
    level = Column(Integer, nullable=False, default=1)
    experience_points = Column(Integer, nullable=False, default=0)
    
    # Metadata
    description = Column(Text)
    token_metadata = Column(JSONType)
    token_uri = Column(String(500))
    evidence_uri = Column(String(500))
    
    # Blockchain data
    contract_address = Column(String(50), nullable=False)
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Status and timestamps
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    last_synced = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    evaluations = relationship("WorkEvaluation", back_populates="skill_token", cascade="all, delete-orphan")
    proposals = relationship("SkillUpdateProposal", back_populates="skill_token", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_skill_tokens_owner_category', 'owner_address', 'skill_category'),
        Index('idx_skill_tokens_level_active', 'level', 'is_active'),
        Index('idx_skill_tokens_created', 'created_at'),
    )


class JobPool(Base):
    """Cache for job pools from blockchain."""
    __tablename__ = "job_pools"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pool_id = Column(String(50), unique=True, nullable=False, index=True)
    creator_address = Column(String(50), nullable=False, index=True)
    
    # Pool information
    title = Column(String(200), nullable=False)
    description = Column(Text)
    company_name = Column(String(100))
    location = Column(String(100))
    is_remote = Column(Boolean, default=False)
    
    # Requirements
    required_skills = Column(JSONType)  # [{"name": "React", "level": 4, "category": "frontend"}]
    min_reputation = Column(Integer, default=0)
    experience_required = Column(Integer)  # in months
    
    # Financial terms
    salary_min = Column(DECIMAL(15, 2))
    salary_max = Column(DECIMAL(15, 2))
    currency = Column(String(10), default="USD")
    stake_amount = Column(DECIMAL(15, 8), nullable=False)  # in HBAR
    
    # Pool lifecycle
    status = Column(SQLEnum(PoolStatusEnum), default=PoolStatusEnum.ACTIVE, index=True)
    deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_days = Column(Integer, nullable=False)
    max_candidates = Column(Integer, default=50)
    
    # Blockchain data
    contract_address = Column(String(50), nullable=False)
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    last_synced = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    applications = relationship("PoolApplication", back_populates="pool", cascade="all, delete-orphan")
    matches = relationship("PoolMatch", back_populates="pool", cascade="all, delete-orphan")
    stakes = relationship("PoolStake", back_populates="pool", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_job_pools_status_deadline', 'status', 'deadline'),
        Index('idx_job_pools_creator_status', 'creator_address', 'status'),
        Index('idx_job_pools_location_remote', 'location', 'is_remote'),
    )


class PoolApplication(Base):
    """Applications to job pools."""
    __tablename__ = "pool_applications"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(), ForeignKey('job_pools.id'), nullable=False)
    applicant_address = Column(String(50), nullable=False, index=True)
    
    # Application data
    cover_letter = Column(Text)
    skill_token_ids = Column(JSONType)  # List of skill token IDs submitted
    match_score = Column(DECIMAL(5, 2))  # AI-calculated match score (0-100)
    
    # Status tracking
    status = Column(String(20), default="applied", index=True)  # applied, reviewed, matched, rejected
    reviewed_at = Column(DateTime(timezone=True))
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    pool = relationship("JobPool", back_populates="applications")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('pool_id', 'applicant_address', name='uq_pool_application'),
        Index('idx_applications_status_created', 'status', 'created_at'),
    )


class PoolMatch(Base):
    """Matches made in job pools."""
    __tablename__ = "pool_matches"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(), ForeignKey('job_pools.id'), nullable=False)
    candidate_address = Column(String(50), nullable=False, index=True)
    
    # Match details
    match_score = Column(DECIMAL(5, 2), nullable=False)
    ai_reasoning = Column(Text)
    match_metadata = Column(JSONType)
    
    # Status tracking
    status = Column(String(20), default="pending", index=True)  # pending, accepted, rejected, finalized
    accepted_at = Column(DateTime(timezone=True))
    finalized_at = Column(DateTime(timezone=True))
    
    # Financial terms
    agreed_salary = Column(DECIMAL(15, 2))
    bonus_terms = Column(JSONType)
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    pool = relationship("JobPool", back_populates="matches")
    
    # Indexes
    __table_args__ = (
        Index('idx_matches_candidate_status', 'candidate_address', 'status'),
        Index('idx_matches_score_status', 'match_score', 'status'),
    )


class PoolStake(Base):
    """Stakes in job pools."""
    __tablename__ = "pool_stakes"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(), ForeignKey('job_pools.id'), nullable=False)
    staker_address = Column(String(50), nullable=False, index=True)
    
    # Stake details
    stake_amount = Column(DECIMAL(15, 8), nullable=False)  # in HBAR
    stake_type = Column(String(20), default="support")  # support, challenge, oracle
    
    # Status and rewards
    status = Column(String(20), default="active", index=True)  # active, withdrawn, slashed, rewarded
    reward_amount = Column(DECIMAL(15, 8), default=0)
    withdrawn_at = Column(DateTime(timezone=True))
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    pool = relationship("JobPool", back_populates="stakes")
    
    # Constraints
    __table_args__ = (
        Index('idx_stakes_staker_status', 'staker_address', 'status'),
        Index('idx_stakes_amount_type', 'stake_amount', 'stake_type'),
    )


# Governance Models
class GovernanceProposal(Base):
    """Governance proposals cache."""
    __tablename__ = "governance_proposals"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(String(50), unique=True, nullable=False, index=True)
    proposer_address = Column(String(50), nullable=False, index=True)
    
    # Proposal content
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    proposal_type = Column(String(50), nullable=False)  # parameter_change, upgrade, funding
    target_contract = Column(String(50))
    calldata = Column(Text)
    
    # Voting details
    voting_starts = Column(DateTime(timezone=True), nullable=False)
    voting_ends = Column(DateTime(timezone=True), nullable=False)
    execution_delay = Column(Integer, default=0)  # in seconds
    
    # Vote counts
    votes_for = Column(DECIMAL(30, 0), default=0)
    votes_against = Column(DECIMAL(30, 0), default=0)
    votes_abstain = Column(DECIMAL(30, 0), default=0)
    quorum_required = Column(DECIMAL(30, 0), nullable=False)
    
    # Status
    status = Column(SQLEnum(ProposalStatusEnum), default=ProposalStatusEnum.PENDING, index=True)
    executed_at = Column(DateTime(timezone=True))
    
    # Blockchain data
    contract_address = Column(String(50), nullable=False)
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    votes = relationship("GovernanceVote", back_populates="proposal", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_proposals_status_voting', 'status', 'voting_ends'),
        Index('idx_proposals_proposer_created', 'proposer_address', 'created_at'),
    )


class GovernanceVote(Base):
    """Individual votes on governance proposals."""
    __tablename__ = "governance_votes"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(), ForeignKey('governance_proposals.id'), nullable=False)
    voter_address = Column(String(50), nullable=False, index=True)
    
    # Vote details
    vote_choice = Column(String(10), nullable=False)  # for, against, abstain
    voting_power = Column(DECIMAL(30, 0), nullable=False)
    reason = Column(Text)
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    proposal = relationship("GovernanceProposal", back_populates="votes")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('proposal_id', 'voter_address', name='uq_proposal_vote'),
        Index('idx_votes_voter_choice', 'voter_address', 'vote_choice'),
    )


# Reputation and Evaluation Models
class WorkEvaluation(Base):
    """Work evaluations for reputation scoring."""
    __tablename__ = "work_evaluations"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    evaluation_id = Column(String(50), unique=True, nullable=False, index=True)
    skill_token_id = Column(UUID(), ForeignKey('skill_tokens.id'), nullable=False)
    evaluator_address = Column(String(50), nullable=False, index=True)
    
    # Work details
    work_description = Column(Text, nullable=False)
    work_artifacts = Column(JSONType)  # URLs to work samples, repos, etc.
    submission_metadata = Column(JSONType)
    
    # Evaluation results
    overall_score = Column(DECIMAL(5, 2))  # 0-100
    skill_scores = Column(JSONType)  # {"frontend": 85, "react": 90, "typescript": 80}
    feedback = Column(Text)
    evaluation_criteria = Column(JSONType)
    
    # Oracle consensus
    oracle_votes = Column(JSONType)  # {"oracle1": 85, "oracle2": 87, "oracle3": 86}
    consensus_score = Column(DECIMAL(5, 2))
    consensus_reached = Column(Boolean, default=False)
    
    # Status
    status = Column(SQLEnum(EvaluationStatusEnum), default=EvaluationStatusEnum.SUBMITTED, index=True)
    
    # Blockchain data
    contract_address = Column(String(50), nullable=False)
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    skill_token = relationship("SkillToken", back_populates="evaluations")
    challenges = relationship("EvaluationChallenge", back_populates="evaluation", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_evaluations_status_created', 'status', 'created_at'),
        Index('idx_evaluations_evaluator_score', 'evaluator_address', 'overall_score'),
    )


class EvaluationChallenge(Base):
    """Challenges to work evaluations."""
    __tablename__ = "evaluation_challenges"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    challenge_id = Column(String(50), unique=True, nullable=False, index=True)
    evaluation_id = Column(UUID(), ForeignKey('work_evaluations.id'), nullable=False)
    challenger_address = Column(String(50), nullable=False, index=True)
    
    # Challenge details
    challenge_reason = Column(Text, nullable=False)
    evidence = Column(JSONType)  # Supporting evidence for the challenge
    stake_amount = Column(DECIMAL(15, 8), nullable=False)  # Stake required for challenge
    
    # Resolution
    status = Column(String(20), default="pending", index=True)  # pending, resolved, dismissed
    resolution = Column(Text)
    resolved_by = Column(String(50))
    resolved_at = Column(DateTime(timezone=True))
    
    # Outcome
    challenge_successful = Column(Boolean)
    stake_returned = Column(Boolean, default=False)
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    evaluation = relationship("WorkEvaluation", back_populates="challenges")
    
    # Indexes
    __table_args__ = (
        Index('idx_challenges_status_created', 'status', 'created_at'),
        Index('idx_challenges_challenger_outcome', 'challenger_address', 'challenge_successful'),
    )


class ReputationScore(Base):
    """Cached reputation scores for users."""
    __tablename__ = "reputation_scores"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_address = Column(String(50), unique=True, nullable=False, index=True)
    
    # Overall reputation
    overall_score = Column(DECIMAL(5, 2), default=0)  # 0-100
    total_evaluations = Column(Integer, default=0)
    successful_evaluations = Column(Integer, default=0)
    
    # Category scores
    category_scores = Column(JSONType)  # {"frontend": 85, "backend": 75, "blockchain": 90}
    skill_scores = Column(JSONType)  # Individual skill scores
    
    # Reputation history
    score_history = Column(JSONType)  # Historical score changes
    last_evaluation_date = Column(DateTime(timezone=True))
    
    # Oracle status
    is_oracle = Column(Boolean, default=False, index=True)
    oracle_specializations = Column(JSONType)  # ["frontend", "blockchain"]
    oracle_accuracy = Column(DECIMAL(5, 2))  # Oracle evaluation accuracy
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    last_synced = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Indexes
    __table_args__ = (
        Index('idx_reputation_overall_score', 'overall_score'),
        Index('idx_reputation_oracle_status', 'is_oracle', 'oracle_accuracy'),
    )


class SkillUpdateProposal(Base):
    """Proposals for skill level updates requiring oracle consensus."""
    __tablename__ = "skill_update_proposals"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(String(50), unique=True, nullable=False, index=True)
    skill_token_id = Column(UUID(), ForeignKey('skill_tokens.id'), nullable=False)
    proposer_address = Column(String(50), nullable=False, index=True)
    
    # Proposal details
    current_level = Column(Integer, nullable=False)
    proposed_level = Column(Integer, nullable=False)
    evidence = Column(JSONType)  # Evidence supporting the level increase
    reasoning = Column(Text)
    
    # Oracle voting
    required_votes = Column(Integer, default=3)
    votes_received = Column(Integer, default=0)
    vote_threshold = Column(DECIMAL(3, 2), default=0.67)  # 67% consensus required
    
    # Status
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected, executed
    voting_deadline = Column(DateTime(timezone=True), nullable=False)
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    
    # Relationships
    skill_token = relationship("SkillToken", back_populates="proposals")
    votes = relationship("SkillUpdateVote", back_populates="proposal", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_skill_proposals_status_deadline', 'status', 'voting_deadline'),
        Index('idx_skill_proposals_proposer_created', 'proposer_address', 'created_at'),
    )


class SkillUpdateVote(Base):
    """Oracle votes on skill update proposals."""
    __tablename__ = "skill_update_votes"
    
    # Primary identifiers
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(), ForeignKey('skill_update_proposals.id'), nullable=False)
    oracle_address = Column(String(50), nullable=False, index=True)
    
    # Vote details
    vote = Column(Boolean, nullable=False)  # True = approve, False = reject
    confidence = Column(DECIMAL(3, 2))  # 0.0 - 1.0
    feedback = Column(Text)
    
    # Blockchain data
    transaction_id = Column(String(100), nullable=False)
    block_timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    
    # Relationships
    proposal = relationship("SkillUpdateProposal", back_populates="votes")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('proposal_id', 'oracle_address', name='uq_skill_proposal_vote'),
        Index('idx_skill_votes_oracle_vote', 'oracle_address', 'vote'),
    )


# Utility Models
class AuditLog(Base):
    """Audit log for all significant actions."""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    user_address = Column(String(50), index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100))
    
    # Action details
    details = Column(JSONType)
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    
    # Results
    success = Column(Boolean, nullable=False, index=True)
    error_message = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), index=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_user_action', 'user_address', 'action'),
        Index('idx_audit_resource_created', 'resource_type', 'created_at'),
    )


class SystemMetrics(Base):
    """System-wide metrics and statistics."""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(DECIMAL(20, 8), nullable=False)
    metric_type = Column(String(20), default="counter")  # counter, gauge, histogram
    
    # Metadata
    labels = Column(JSONType)  # Additional metric labels
    description = Column(Text)
    
    # Timestamps
    recorded_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc), index=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_metrics_name_recorded', 'metric_name', 'recorded_at'),
    )


# Create all tables
def create_tables(engine):
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def drop_tables(engine):
    """Drop all database tables."""
    Base.metadata.drop_all(bind=engine)
