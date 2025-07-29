"""
AI Oracle Integration Module

This module provides integration with GROQ-API and LangChain for AI-powered
work evaluation and reputation scoring.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional, Union, Tuple
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Skill evaluation models
class SkillEvaluation(BaseModel):
    """Model for skill evaluation results."""
    score: float = Field(..., description="Numerical score between 0-100")
    reasoning: str = Field(..., description="Reasoning behind the score")
    strengths: List[str] = Field(..., description="List of identified strengths")
    weaknesses: List[str] = Field(..., description="List of identified weaknesses")
    
    @field_validator('score')
    @classmethod
    def validate_score(cls, v):
        """Validate that score is between 0 and 100."""
        if not 0 <= v <= 100:
            raise ValueError('Score must be between 0 and 100')
        return v

class WorkEvaluation(BaseModel):
    """Model for complete work evaluation results."""
    overall_score: float = Field(..., description="Overall numerical score between 0-100")
    skill_scores: Dict[str, SkillEvaluation] = Field(
        ..., description="Individual skill evaluations"
    )
    recommendation: str = Field(..., description="AI recommendation for skill improvement")
    level_change: Optional[int] = Field(
        0, description="Recommended level change (-1, 0, or 1)"
    )
    
    @field_validator('overall_score')
    @classmethod
    def validate_overall_score(cls, v):
        """Validate that overall score is between 0 and 100."""
        if not 0 <= v <= 100:
            raise ValueError('Overall score must be between 0 and 100')
        return v
    
    @field_validator('level_change')
    @classmethod
    def validate_level_change(cls, v):
        """Validate that level change is -1, 0, or 1."""
        if v not in [-1, 0, 1]:
            raise ValueError('Level change must be -1, 0, or 1')
        return v

class AIOracle:
    """
    AI Oracle for evaluating work quality and updating reputation scores.
    
    This class provides methods to evaluate work submissions using LangChain
    and GROQ-API, and generate reputation scores for skill tokens.
    """
    
    def __init__(self):
        """Initialize the AI Oracle with LangChain components."""
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        
        # Initialize LLM with GROQ
        self.llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name="llama3-70b-8192",  # Using Llama 3 70B model
            temperature=0.2,  # Low temperature for more consistent evaluations
            max_tokens=4096
        )
        
        # Initialize output parser
        self.parser = PydanticOutputParser(pydantic_object=WorkEvaluation)
        
        # Create evaluation prompt template
        self.evaluation_template = PromptTemplate(
            template="""
            You are an expert AI Oracle for the TalentChain Pro platform. Your task is to evaluate work submissions
            and provide fair, objective assessments of skill levels.
            
            # Work Submission Details
            - Skill Categories: {skill_categories}
            - Current Skill Levels: {current_levels}
            - Work Description: {work_description}
            - Work Content: {work_content}
            - Evaluation Criteria: {evaluation_criteria}
            
            # Instructions
            1. Carefully analyze the work submission
            2. Evaluate each skill category separately
            3. Provide an overall score and individual skill scores (0-100)
            4. List strengths and weaknesses for each skill
            5. Make a recommendation for skill improvement
            6. Determine if any skill level should change (-1 for downgrade, 0 for no change, 1 for upgrade)
            
            # Output Format
            {format_instructions}
            """,
            input_variables=[
                "skill_categories",
                "current_levels",
                "work_description",
                "work_content",
                "evaluation_criteria"
            ],
            partial_variables={"format_instructions": self.parser.get_format_instructions()}
        )
        
        # Create evaluation chain
        self.evaluation_chain = LLMChain(
            llm=self.llm,
            prompt=self.evaluation_template
        )
        
        logger.info("AI Oracle initialized")
    
    async def evaluate_work(
        self,
        work_data: Dict[str, Any]
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Evaluate work submission and generate reputation scores.
        
        Args:
            work_data: Dictionary containing work submission details:
                - skill_categories: List of skill categories
                - current_levels: Dict of current skill levels
                - work_description: Description of the work
                - work_content: Actual work content/artifacts
                - evaluation_criteria: Optional custom evaluation criteria
        
        Returns:
            Tuple containing:
                - overall_score: Float between 0-100
                - evaluation_results: Complete evaluation results
        
        Raises:
            ValueError: If required data is missing
            Exception: For other errors during evaluation
        """
        required_fields = ["skill_categories", "current_levels", "work_description", "work_content"]
        for field in required_fields:
            if field not in work_data:
                raise ValueError(f"Missing required field: {field}")
        
        try:
            # Prepare input for evaluation chain
            evaluation_input = {
                "skill_categories": json.dumps(work_data["skill_categories"]),
                "current_levels": json.dumps(work_data["current_levels"]),
                "work_description": work_data["work_description"],
                "work_content": work_data["work_content"],
                "evaluation_criteria": work_data.get("evaluation_criteria", "Standard evaluation criteria")
            }
            
            # Run evaluation chain
            logger.info(f"Evaluating work for skills: {work_data['skill_categories']}")
            result = await self.evaluation_chain.arun(**evaluation_input)
            
            # Parse results
            evaluation_results = self.parser.parse(result)
            
            logger.info(f"Work evaluation complete. Overall score: {evaluation_results.overall_score}")
            return evaluation_results.overall_score, evaluation_results.dict()
        
        except Exception as e:
            logger.error(f"Error evaluating work: {str(e)}")
            raise

# Singleton instance
_ai_oracle: Optional[AIOracle] = None

def get_ai_oracle() -> AIOracle:
    """
    Get or create the AI Oracle instance.
    
    Returns:
        AIOracle: The AI Oracle instance
    """
    global _ai_oracle
    
    if _ai_oracle is None:
        _ai_oracle = AIOracle()
        
    return _ai_oracle
