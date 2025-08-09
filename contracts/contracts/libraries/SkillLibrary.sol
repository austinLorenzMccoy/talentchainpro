// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SkillLibrary
 * @dev Library containing utility functions for skill management
 * @author TalentChain Pro Team
 */
library SkillLibrary {
    // Constants
    uint8 public constant MIN_SKILL_LEVEL = 1;
    uint8 public constant MAX_SKILL_LEVEL = 10;
    uint256 public constant DEFAULT_SKILL_EXPIRY = 365 days * 2; // 2 years
    uint256 public constant MIN_ENDORSEMENT_COOLDOWN = 30 days;

    // Errors
    error InvalidSkillLevel(uint8 level);
    error SkillExpired(uint64 expiryDate);
    error InvalidEndorser();
    error EndorsementCooldownActive();
    error EmptySkillCategory();
    error InvalidExpiryDate();

    /**
     * @dev Validates skill level is within acceptable range
     * @param level The skill level to validate
     */
    function validateSkillLevel(uint8 level) internal pure {
        if (level < MIN_SKILL_LEVEL || level > MAX_SKILL_LEVEL) {
            revert InvalidSkillLevel(level);
        }
    }

    /**
     * @dev Validates skill expiry date
     * @param expiryDate The expiry date to validate
     */
    function validateExpiryDate(uint64 expiryDate) internal view {
        if (expiryDate <= block.timestamp) {
            revert InvalidExpiryDate();
        }
    }

    /**
     * @dev Checks if a skill token is expired
     * @param expiryDate The expiry date of the skill token
     * @return true if expired, false otherwise
     */
    function isSkillExpired(uint64 expiryDate) internal view returns (bool) {
        return block.timestamp >= expiryDate;
    }

    /**
     * @dev Validates skill category is not empty
     * @param category The skill category to validate
     */
    function validateSkillCategory(string memory category) internal pure {
        if (bytes(category).length == 0) {
            revert EmptySkillCategory();
        }
    }

    /**
     * @dev Calculates skill score based on level and endorsements
     * @param level The skill level
     * @param endorsementCount The number of endorsements
     * @return The calculated skill score
     */
    function calculateSkillScore(
        uint8 level,
        uint256 endorsementCount
    ) internal pure returns (uint256) {
        uint256 baseScore = uint256(level) * 100;
        uint256 endorsementBonus = endorsementCount * 10;
        
        // Cap endorsement bonus at 50% of base score
        uint256 maxBonus = baseScore / 2;
        if (endorsementBonus > maxBonus) {
            endorsementBonus = maxBonus;
        }
        
        return baseScore + endorsementBonus;
    }

    /**
     * @dev Generates default expiry date for a skill token
     * @return The default expiry timestamp
     */
    function getDefaultExpiryDate() internal view returns (uint64) {
        return uint64(block.timestamp + DEFAULT_SKILL_EXPIRY);
    }

    /**
     * @dev Validates endorser is not the skill token owner
     * @param owner The skill token owner
     * @param endorser The proposed endorser
     */
    function validateEndorser(address owner, address endorser) internal pure {
        if (owner == endorser) {
            revert InvalidEndorser();
        }
    }

    /**
     * @dev Checks if endorsement cooldown has passed
     * @param lastEndorsementTime The timestamp of the last endorsement
     * @return true if cooldown has passed, false otherwise
     */
    function canEndorse(uint64 lastEndorsementTime) internal view returns (bool) {
        return block.timestamp >= lastEndorsementTime + MIN_ENDORSEMENT_COOLDOWN;
    }

    /**
     * @dev Calculates level progression requirements
     * @param currentLevel The current skill level
     * @param targetLevel The target skill level
     * @return The minimum endorsements required for progression
     */
    function getRequiredEndorsements(
        uint8 currentLevel,
        uint8 targetLevel
    ) internal pure returns (uint256) {
        if (targetLevel <= currentLevel) {
            return 0;
        }
        
        uint256 levelDiff = targetLevel - currentLevel;
        return levelDiff * 2; // 2 endorsements per level increase
    }

    /**
     * @dev Converts skill level to string representation
     * @param level The skill level
     * @return The string representation of the level
     */
    function levelToString(uint8 level) internal pure returns (string memory) {
        if (level <= 2) return "Beginner";
        if (level <= 4) return "Novice";
        if (level <= 6) return "Intermediate";
        if (level <= 8) return "Advanced";
        return "Expert";
    }

    /**
     * @dev Normalizes skill category to lowercase
     * @param category The skill category to normalize
     * @return The normalized category string
     */
    function normalizeCategory(string memory category) internal pure returns (string memory) {
        bytes memory categoryBytes = bytes(category);
        for (uint i = 0; i < categoryBytes.length; i++) {
            if (categoryBytes[i] >= 0x41 && categoryBytes[i] <= 0x5A) {
                categoryBytes[i] = bytes1(uint8(categoryBytes[i]) + 32);
            }
        }
        return string(categoryBytes);
    }
}