// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDMerkleRegistry
 * @notice Anchors the Merkle Root of all enrolled student DIDs on-chain.
 *         The root represents the exact state of 10,000+ students in 32 bytes.
 *         Guards' phones fetch this root once (morning sync) and verify offline.
 *
 * @dev Deployed on Polygon Amoy Testnet.
 *      Only the owner (NestJS issuer wallet) can update the root.
 */
contract DIDMerkleRegistry {
    // ── State ─────────────────────────────────────────────────────
    bytes32 public merkleRoot;
    uint256 public lastUpdated;
    uint256 public updateCount;
    address public owner;

    // ── Events ────────────────────────────────────────────────────
    event RootUpdated(
        bytes32 indexed newRoot,
        bytes32 indexed prevRoot,
        uint256 timestamp,
        uint256 updateCount
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Errors ────────────────────────────────────────────────────
    error Unauthorized();
    error SameRoot();
    error ZeroRoot();

    // ── Constructor ───────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ── Modifiers ─────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ── Core Functions ────────────────────────────────────────────

    /**
     * @notice Update the Merkle Root (called by NestJS nightly cron).
     * @param newRoot The new 32-byte Merkle Root computed from all student DIDs.
     */
    function updateRoot(bytes32 newRoot) external onlyOwner {
        if (newRoot == bytes32(0)) revert ZeroRoot();
        if (newRoot == merkleRoot) revert SameRoot();

        bytes32 prevRoot = merkleRoot;
        merkleRoot = newRoot;
        lastUpdated = block.timestamp;
        updateCount++;

        emit RootUpdated(newRoot, prevRoot, block.timestamp, updateCount);
    }

    /**
     * @notice Transfer ownership to a new admin wallet.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ── Read Functions ────────────────────────────────────────────

    /**
     * @notice Returns the current registry state in one call.
     * @return root     Current Merkle Root
     * @return updated  Unix timestamp of last update
     * @return count    Total number of root updates
     */
    function getRegistryState() external view returns (
        bytes32 root,
        uint256 updated,
        uint256 count
    ) {
        return (merkleRoot, lastUpdated, updateCount);
    }
}
