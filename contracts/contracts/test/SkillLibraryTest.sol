// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../libraries/SkillLibrary.sol";
import "../interfaces/ISkillToken.sol";

/**
 * @title SkillLibraryTest
 * @dev Test contract that exposes SkillLibrary functions for testing
 */
contract SkillLibraryTest {
    function testValidateSkillLevel(uint8 level) external pure {
        SkillLibrary.validateSkillLevel(level);
    }

    function testValidateExpiryDate(uint64 expiryDate) external view {
        SkillLibrary.validateExpiryDate(expiryDate);
    }

    function testIsSkillExpired(uint64 expiryDate) external view returns (bool) {
        return SkillLibrary.isSkillExpired(expiryDate);
    }

    function testValidateSkillCategory(string memory category) external pure {
        SkillLibrary.validateSkillCategory(category);
    }

    function testCalculateSkillScore(uint8 level, uint256 endorsementCount) 
        external pure returns (uint256) {
        return SkillLibrary.calculateSkillScore(level, endorsementCount);
    }

    function testGetDefaultExpiryDate() external view returns (uint64) {
        return SkillLibrary.getDefaultExpiryDate();
    }

    function testValidateEndorser(address owner, address endorser) external pure {
        SkillLibrary.validateEndorser(owner, endorser);
    }

    function testCanEndorse(uint64 lastEndorsementTime) external view returns (bool) {
        return SkillLibrary.canEndorse(lastEndorsementTime);
    }

    function testGetRequiredEndorsements(uint8 currentLevel, uint8 targetLevel) 
        external pure returns (uint256) {
        return SkillLibrary.getRequiredEndorsements(currentLevel, targetLevel);
    }

    function testLevelToString(uint8 level) external pure returns (string memory) {
        return SkillLibrary.levelToString(level);
    }

    function testNormalizeCategory(string memory category) 
        external pure returns (string memory) {
        return SkillLibrary.normalizeCategory(category);
    }
}
