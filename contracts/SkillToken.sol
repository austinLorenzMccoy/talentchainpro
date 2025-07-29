// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SkillToken
 * @dev Implementation of a Soulbound Token (SBT) for representing skills
 * with dynamic metadata that can be updated by reputation oracles.
 * Follows HIP-412 metadata standard for Hedera compatibility.
 */
contract SkillToken is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to skill level
    mapping(uint256 => uint8) private _skillLevels;
    
    // Mapping from token ID to skill category
    mapping(uint256 => string) private _skillCategories;
    
    // Mapping of authorized reputation oracles
    mapping(address => bool) private _reputationOracles;
    
    // Events
    event SkillTokenMinted(address indexed to, uint256 tokenId, string skillCategory, uint8 level);
    event SkillLevelUpdated(uint256 tokenId, uint8 oldLevel, uint8 newLevel);
    event ReputationOracleAdded(address oracle);
    event ReputationOracleRemoved(address oracle);
    
    /**
     * @dev Modifier to restrict function access to reputation oracles
     */
    modifier onlyReputationOracle() {
        require(_reputationOracles[msg.sender], "SkillToken: caller is not a reputation oracle");
        _;
    }
    
    /**
     * @dev Constructor initializes the contract with a name and symbol
     */
    constructor() ERC721("TalentChainPro Skill Token", "SKILL") {}
    
    /**
     * @dev Add a reputation oracle
     * @param oracle Address of the oracle to add
     */
    function addReputationOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "SkillToken: oracle is the zero address");
        require(!_reputationOracles[oracle], "SkillToken: oracle already exists");
        
        _reputationOracles[oracle] = true;
        emit ReputationOracleAdded(oracle);
    }
    
    /**
     * @dev Remove a reputation oracle
     * @param oracle Address of the oracle to remove
     */
    function removeReputationOracle(address oracle) external onlyOwner {
        require(_reputationOracles[oracle], "SkillToken: oracle does not exist");
        
        _reputationOracles[oracle] = false;
        emit ReputationOracleRemoved(oracle);
    }
    
    /**
     * @dev Check if an address is a reputation oracle
     * @param oracle Address to check
     * @return bool True if the address is a reputation oracle
     */
    function isReputationOracle(address oracle) external view returns (bool) {
        return _reputationOracles[oracle];
    }
    
    /**
     * @dev Mint a new skill token
     * @param to Address to mint the token to
     * @param skillCategory Category of the skill
     * @param level Initial skill level (1-10)
     * @param uri Metadata URI following HIP-412 standard
     * @return uint256 ID of the minted token
     */
    function mintSkillToken(
        address to,
        string memory skillCategory,
        uint8 level,
        string memory uri
    ) external onlyOwner returns (uint256) {
        require(level > 0 && level <= 10, "SkillToken: level must be between 1 and 10");
        require(bytes(skillCategory).length > 0, "SkillToken: skill category cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        _skillLevels[tokenId] = level;
        _skillCategories[tokenId] = skillCategory;
        
        emit SkillTokenMinted(to, tokenId, skillCategory, level);
        
        return tokenId;
    }
    
    /**
     * @dev Update the skill level of a token
     * @param tokenId ID of the token to update
     * @param newLevel New skill level (1-10)
     * @param newUri Updated metadata URI
     */
    function updateSkillLevel(
        uint256 tokenId,
        uint8 newLevel,
        string memory newUri
    ) external onlyReputationOracle {
        require(_exists(tokenId), "SkillToken: token does not exist");
        require(newLevel > 0 && newLevel <= 10, "SkillToken: level must be between 1 and 10");
        
        uint8 oldLevel = _skillLevels[tokenId];
        _skillLevels[tokenId] = newLevel;
        _setTokenURI(tokenId, newUri);
        
        emit SkillLevelUpdated(tokenId, oldLevel, newLevel);
    }
    
    /**
     * @dev Get the skill metadata for a token
     * @param tokenId ID of the token
     * @return skillCategory Category of the skill
     * @return level Current skill level
     * @return uri Metadata URI
     */
    function getSkillMetadata(uint256 tokenId) external view returns (
        string memory skillCategory,
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
     * @dev Prevent token transfers to make it soulbound
     * @param from Address sending the token
     * @param to Address receiving the token
     * @param tokenId ID of the token
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == 0) but prevent transfers between addresses
        require(from == address(0) || to == address(0), "SkillToken: token is soulbound");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Override required function for ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Override required function for ERC721URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Check if token is soulbound
     * @return bool Always returns true for this implementation
     */
    function isSoulbound() external pure returns (bool) {
        return true;
    }
}
