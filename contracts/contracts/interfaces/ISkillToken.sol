// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ISkillToken
 * @dev Interface for the SkillToken contract - Soulbound tokens representing verifiable skills
 * @author TalentChain Pro Team
 */
interface ISkillToken is IERC721 {
    // Events
    event SkillTokenMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string category,
        uint8 level,
        address indexed issuer
    );
    
    event SkillLevelUpdated(
        uint256 indexed tokenId,
        uint8 oldLevel,
        uint8 newLevel,
        address indexed oracle,
        string evidence
    );
    
    event SkillTokenRevoked(
        uint256 indexed tokenId,
        string reason,
        address indexed revokedBy
    );
    
    event SkillTokenEndorsed(
        uint256 indexed tokenId,
        address indexed endorser,
        string endorsementData
    );

    // Structs
    struct SkillData {
        string category;
        uint8 level;
        string subcategory;
        uint64 issuedAt;
        uint64 expiryDate;
        address issuer;
        bool isActive;
        string metadata;
    }

    struct SkillEndorsement {
        address endorser;
        string endorsementData;
        uint64 timestamp;
        bool isActive;
    }

    // Core functions
    function mintSkillToken(
        address recipient,
        string calldata category,
        string calldata subcategory,
        uint8 level,
        uint64 expiryDate,
        string calldata metadata,
        string calldata tokenURI
    ) external returns (uint256 tokenId);

    function updateSkillLevel(
        uint256 tokenId,
        uint8 newLevel,
        string calldata evidence
    ) external;

    function revokeSkillToken(
        uint256 tokenId,
        string calldata reason
    ) external;

    function endorseSkillToken(
        uint256 tokenId,
        string calldata endorsementData
    ) external;

    // View functions
    function getSkillData(uint256 tokenId) external view returns (SkillData memory);
    
    function getSkillEndorsements(uint256 tokenId) 
        external 
        view 
        returns (SkillEndorsement[] memory);
    
    function getTokensByCategory(string calldata category) 
        external 
        view 
        returns (uint256[] memory);
    
    function getTokensByOwner(address owner) 
        external 
        view 
        returns (uint256[] memory);
    
    function isSkillActive(uint256 tokenId) external view returns (bool);
    
    function getTotalSkillsByCategory(string calldata category) 
        external 
        view 
        returns (uint256);
}