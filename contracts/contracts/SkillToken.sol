// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

import "./interfaces/ISkillToken.sol";
import "./libraries/SkillLibrary.sol";

/**
 * @title SkillToken
 * @dev Enterprise-grade Soulbound Token implementation for verifiable skills
 * @author TalentChain Pro Team
 * 
 * Features:
 * - Soulbound (non-transferable) skill tokens
 * - Multi-level skill progression (1-10)
 * - Skill endorsements with cooldown
 * - Expiry dates for skill validity
 * - Role-based access control for minting/updating
 * - Oracle integration for automated skill assessment
 * - Pausable for emergency scenarios
 * - Meta-transaction support for gasless operations
 * - Comprehensive skill metadata and categorization
 */
contract SkillToken is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard,
    EIP712,
    ISkillToken 
{
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using SkillLibrary for uint8;
    using SkillLibrary for string;

    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // EIP-712 type hashes
    bytes32 private constant _ENDORSEMENT_TYPEHASH = 
        keccak256("Endorsement(uint256 tokenId,string endorsementData,uint256 nonce,uint256 deadline)");

    // State variables
    Counters.Counter private _tokenIdCounter;
    
    // Token ID => Skill data
    mapping(uint256 => SkillData) private _skillData;
    
    // Token ID => Array of endorsements
    mapping(uint256 => SkillEndorsement[]) private _skillEndorsements;
    
    // Token ID => Last endorsement timestamp
    mapping(uint256 => uint64) private _lastEndorsementTime;
    
    // Category => Array of token IDs
    mapping(string => uint256[]) private _tokensByCategory;
    
    // Owner => Array of token IDs
    mapping(address => uint256[]) private _tokensByOwner;
    
    // Category => Total count
    mapping(string => uint256) private _totalByCategory;
    
    // Nonces for meta-transactions
    mapping(address => uint256) private _nonces;
    
    // Revoked tokens
    mapping(uint256 => bool) private _revokedTokens;
    mapping(uint256 => string) private _revocationReasons;

    // Events (additional to interface)
    event BatchSkillTokensMinted(
        address indexed recipient,
        uint256[] tokenIds,
        string[] categories
    );
    
    event SkillTokenExpired(
        uint256 indexed tokenId,
        address indexed owner
    );
    
    event SkillTokenRenewed(
        uint256 indexed tokenId,
        uint64 newExpiryDate,
        address indexed renewedBy
    );

    // Modifiers
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "SkillToken: caller is not token owner");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "SkillToken: token does not exist");
        _;
    }

    modifier notRevoked(uint256 tokenId) {
        require(!_revokedTokens[tokenId], "SkillToken: token has been revoked");
        _;
    }

    modifier validSkillLevel(uint8 level) {
        SkillLibrary.validateSkillLevel(level);
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address initialAdmin
    ) 
        ERC721(name, symbol)
        EIP712("SkillToken", "1")
    {
        require(initialAdmin != address(0), "SkillToken: invalid admin address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        _grantRole(ORACLE_ROLE, initialAdmin);
        _grantRole(UPDATER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    /**
     * @dev Mint a new skill token
     */
    function mintSkillToken(
        address recipient,
        string calldata category,
        string calldata subcategory,
        uint8 level,
        uint64 expiryDate,
        string calldata metadata,
        string calldata tokenURI
    ) 
        external 
        override 
        onlyRole(MINTER_ROLE) 
        whenNotPaused
        validSkillLevel(level)
        returns (uint256 tokenId)
    {
        require(recipient != address(0), "SkillToken: invalid recipient");
        SkillLibrary.validateSkillCategory(category);
        
        if (expiryDate == 0) {
            expiryDate = SkillLibrary.getDefaultExpiryDate();
        } else {
            SkillLibrary.validateExpiryDate(expiryDate);
        }

        tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint token
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Store skill data
        string memory normalizedCategory = category.normalizeCategory();
        _skillData[tokenId] = SkillData({
            category: normalizedCategory,
            level: level,
            subcategory: subcategory,
            issuedAt: uint64(block.timestamp),
            expiryDate: expiryDate,
            issuer: _msgSender(),
            isActive: true,
            metadata: metadata
        });

        // Update indexes
        _tokensByCategory[normalizedCategory].push(tokenId);
        _tokensByOwner[recipient].push(tokenId);
        _totalByCategory[normalizedCategory]++;

        emit SkillTokenMinted(tokenId, recipient, normalizedCategory, level, _msgSender());
    }

    /**
     * @dev Mint multiple skill tokens in a single transaction
     */
    function batchMintSkillTokens(
        address recipient,
        string[] calldata categories,
        string[] calldata subcategories,
        uint8[] calldata levels,
        uint64[] calldata expiryDates,
        string[] calldata metadataArray,
        string[] calldata tokenURIs
    ) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused
        returns (uint256[] memory tokenIds)
    {
        require(recipient != address(0), "SkillToken: invalid recipient");
        require(
            categories.length == subcategories.length &&
            categories.length == levels.length &&
            categories.length == expiryDates.length &&
            categories.length == metadataArray.length &&
            categories.length == tokenURIs.length,
            "SkillToken: array length mismatch"
        );

        uint256 length = categories.length;
        tokenIds = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            tokenIds[i] = mintSkillToken(
                recipient,
                categories[i],
                subcategories[i],
                levels[i],
                expiryDates[i],
                metadataArray[i],
                tokenURIs[i]
            );
        }

        emit BatchSkillTokensMinted(recipient, tokenIds, categories);
    }

    /**
     * @dev Update skill level (oracle only)
     */
    function updateSkillLevel(
        uint256 tokenId,
        uint8 newLevel,
        string calldata evidence
    ) 
        external 
        override 
        onlyRole(ORACLE_ROLE) 
        whenNotPaused
        tokenExists(tokenId)
        notRevoked(tokenId)
        validSkillLevel(newLevel)
    {
        SkillData storage skill = _skillData[tokenId];
        require(skill.isActive, "SkillToken: skill is inactive");
        require(!SkillLibrary.isSkillExpired(skill.expiryDate), "SkillToken: skill has expired");

        uint8 oldLevel = skill.level;
        require(newLevel != oldLevel, "SkillToken: same level provided");

        skill.level = newLevel;

        emit SkillLevelUpdated(tokenId, oldLevel, newLevel, _msgSender(), evidence);
    }

    /**
     * @dev Revoke a skill token
     */
    function revokeSkillToken(
        uint256 tokenId,
        string calldata reason
    ) 
        external 
        override 
        tokenExists(tokenId)
        notRevoked(tokenId)
    {
        address tokenOwner = ownerOf(tokenId);
        require(
            _msgSender() == tokenOwner ||
            hasRole(ORACLE_ROLE, _msgSender()) ||
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
            "SkillToken: unauthorized revocation"
        );

        _revokedTokens[tokenId] = true;
        _revocationReasons[tokenId] = reason;
        _skillData[tokenId].isActive = false;

        emit SkillTokenRevoked(tokenId, reason, _msgSender());
    }

    /**
     * @dev Endorse a skill token
     */
    function endorseSkillToken(
        uint256 tokenId,
        string calldata endorsementData
    ) 
        external 
        override 
        whenNotPaused
        tokenExists(tokenId)
        notRevoked(tokenId)
    {
        address tokenOwner = ownerOf(tokenId);
        SkillLibrary.validateEndorser(tokenOwner, _msgSender());

        require(
            SkillLibrary.canEndorse(_lastEndorsementTime[tokenId]),
            "SkillToken: endorsement cooldown active"
        );

        SkillData storage skill = _skillData[tokenId];
        require(skill.isActive, "SkillToken: skill is inactive");
        require(!SkillLibrary.isSkillExpired(skill.expiryDate), "SkillToken: skill has expired");

        _skillEndorsements[tokenId].push(SkillEndorsement({
            endorser: _msgSender(),
            endorsementData: endorsementData,
            timestamp: uint64(block.timestamp),
            isActive: true
        }));

        _lastEndorsementTime[tokenId] = uint64(block.timestamp);

        emit SkillTokenEndorsed(tokenId, _msgSender(), endorsementData);
    }

    /**
     * @dev Endorse skill token with signature (gasless)
     */
    function endorseSkillTokenWithSignature(
        uint256 tokenId,
        string calldata endorsementData,
        uint256 deadline,
        bytes calldata signature
    ) 
        external 
        whenNotPaused
        tokenExists(tokenId)
        notRevoked(tokenId)
    {
        require(block.timestamp <= deadline, "SkillToken: signature expired");

        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner != _msgSender(), "SkillToken: cannot endorse own skill");

        // Verify signature
        bytes32 structHash = keccak256(abi.encode(
            _ENDORSEMENT_TYPEHASH,
            tokenId,
            keccak256(bytes(endorsementData)),
            _useNonce(_msgSender()),
            deadline
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == _msgSender(), "SkillToken: invalid signature");

        // Proceed with endorsement
        this.endorseSkillToken(tokenId, endorsementData);
    }

    /**
     * @dev Renew expired skill token
     */
    function renewSkillToken(
        uint256 tokenId,
        uint64 newExpiryDate
    ) 
        external 
        onlyRole(UPDATER_ROLE)
        tokenExists(tokenId)
        notRevoked(tokenId)
    {
        SkillLibrary.validateExpiryDate(newExpiryDate);
        
        _skillData[tokenId].expiryDate = newExpiryDate;
        _skillData[tokenId].isActive = true;

        emit SkillTokenRenewed(tokenId, newExpiryDate, _msgSender());
    }

    /**
     * @dev Check and mark expired tokens
     */
    function markExpiredTokens(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_exists(tokenId) && !_revokedTokens[tokenId]) {
                SkillData storage skill = _skillData[tokenId];
                if (skill.isActive && SkillLibrary.isSkillExpired(skill.expiryDate)) {
                    skill.isActive = false;
                    emit SkillTokenExpired(tokenId, ownerOf(tokenId));
                }
            }
        }
    }

    // View functions
    function getSkillData(uint256 tokenId) 
        external 
        view 
        override 
        tokenExists(tokenId)
        returns (SkillData memory) 
    {
        return _skillData[tokenId];
    }

    function getSkillEndorsements(uint256 tokenId) 
        external 
        view 
        override 
        tokenExists(tokenId)
        returns (SkillEndorsement[] memory) 
    {
        return _skillEndorsements[tokenId];
    }

    function getTokensByCategory(string calldata category) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _tokensByCategory[category.normalizeCategory()];
    }

    function getTokensByOwner(address owner) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _tokensByOwner[owner];
    }

    function isSkillActive(uint256 tokenId) 
        external 
        view 
        override 
        tokenExists(tokenId)
        returns (bool) 
    {
        if (_revokedTokens[tokenId]) return false;
        
        SkillData memory skill = _skillData[tokenId];
        return skill.isActive && !SkillLibrary.isSkillExpired(skill.expiryDate);
    }

    function getTotalSkillsByCategory(string calldata category) 
        external 
        view 
        override 
        returns (uint256) 
    {
        return _totalByCategory[category.normalizeCategory()];
    }

    function getRevocationReason(uint256 tokenId) 
        external 
        view 
        tokenExists(tokenId)
        returns (string memory) 
    {
        require(_revokedTokens[tokenId], "SkillToken: token not revoked");
        return _revocationReasons[tokenId];
    }

    function nonces(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    // Internal functions
    function _useNonce(address owner) internal returns (uint256 current) {
        current = _nonces[owner];
        _nonces[owner]++;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) 
        internal 
        override(ERC721, ERC721Enumerable) 
        whenNotPaused 
    {
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all other transfers (soulbound behavior)
        require(
            from == address(0) || to == address(0), 
            "SkillToken: tokens are soulbound and cannot be transferred"
        );
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Update owner index when minting
        if (from == address(0) && to != address(0)) {
            _tokensByOwner[to].push(tokenId);
        }
    }

    function _burn(uint256 tokenId) 
        internal 
        override(ERC721, ERC721URIStorage) 
    {
        super._burn(tokenId);
        
        // Clean up skill data
        delete _skillData[tokenId];
        delete _skillEndorsements[tokenId];
        delete _lastEndorsementTime[tokenId];
    }

    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage, IERC721Metadata) 
        returns (string memory) 
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, IERC165) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

    // Emergency functions
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}