// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SkillTokenSimple
 * @dev Simplified Soulbound Token (SBT) for TalentChain Pro MVP
 * Features:
 * - Non-transferable skill tokens
 * - Basic skill levels (1-10)
 * - Role-based access control
 * - Pausable for emergency stops
 */
contract SkillTokenSimple is ERC721, ERC721URIStorage, AccessControl, Pausable {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Token metadata
    mapping(uint256 => uint8) private _skillLevels;
    mapping(uint256 => string) private _skillCategories;
    
    // Events
    event SkillTokenMinted(uint256 indexed tokenId, address indexed to, string category, uint8 level);
    event SkillLevelUpdated(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);
    
    constructor(address initialOwner) ERC721("TalentChain Skill Token", "TCST") {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
    }
    
    /**
     * @dev Mint a new skill token
     */
    function mintSkillToken(
        address to,
        string memory skillCategory,
        uint8 level,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(level > 0 && level <= 10, "SkillToken: level must be between 1 and 10");
        require(bytes(skillCategory).length > 0, "SkillToken: skill category cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _skillLevels[tokenId] = level;
        _skillCategories[tokenId] = skillCategory;
        
        emit SkillTokenMinted(tokenId, to, skillCategory, level);
        
        return tokenId;
    }
    
    /**
     * @dev Update skill level (oracle only)
     */
    function updateSkillLevel(
        uint256 tokenId,
        uint8 newLevel,
        string memory newUri
    ) external onlyRole(ORACLE_ROLE) {
        require(_exists(tokenId), "SkillToken: token does not exist");
        require(newLevel > 0 && newLevel <= 10, "SkillToken: level must be between 1 and 10");
        
        uint8 oldLevel = _skillLevels[tokenId];
        _skillLevels[tokenId] = newLevel;
        _setTokenURI(tokenId, newUri);
        
        emit SkillLevelUpdated(tokenId, oldLevel, newLevel);
    }
    
    /**
     * @dev Get skill information
     */
    function getSkillInfo(uint256 tokenId) external view returns (
        string memory category,
        uint8 level,
        string memory uri
    ) {
        require(_exists(tokenId), "SkillToken: token does not exist");
        
        return (
            _skillCategories[tokenId],
            _skillLevels[tokenId],
            tokenURI(tokenId)
        );
    }
    
    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal pure override {
        require(from == address(0) || to == address(0), "SkillToken: transfers are disabled");
    }
    
    /**
     * @dev Pause contract (admin only)
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Required override for URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Required override for burning
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}