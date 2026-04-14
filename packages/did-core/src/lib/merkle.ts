import MerkleTree from 'merkletreejs';
import keccak256 from 'keccak256';


// ─── Types ─────────────────────────────────────────────────
export interface MerkleProofResult {
  proof: string[];
  leaf: string;
  leafIndex: number;
}

export interface MerkleVerifyInput {
  did: string;
  proof: string[];
  root: string;
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Hash a DID string into a keccak256 leaf.
 * Using Buffer for Node.js compatibility; ethers.keccak256 fallback for mobile.
 */
function hashDID(did: string): Buffer {
  return keccak256(Buffer.from(did, 'utf8'));
}

function bufferToHex(buf: Buffer): string {
  return '0x' + buf.toString('hex');
}

// ─── Tree Builder ──────────────────────────────────────────

/**
 * Build a Merkle Tree from an array of student DIDs.
 * Leaves are sorted for determinism (same input → same root always).
 */
export function buildMerkleTree(dids: string[]): any {
  if (dids.length === 0) throw new Error('Cannot build Merkle Tree with 0 DIDs');
  const leaves = dids.map(hashDID);
  return new MerkleTree(leaves, keccak256, { sortPairs: true });
}

// ─── Root ──────────────────────────────────────────────────

/**
 * Get the 32-byte Merkle Root as a 0x-prefixed hex string.
 * This is what gets anchored to the Polygon smart contract.
 */
export function getMerkleRoot(tree: any): string {
  return bufferToHex(tree.getRoot() as Buffer);
}

// ─── Proof ─────────────────────────────────────────────────

/**
 * Generate the Merkle Proof for a specific student DID.
 * The proof is embedded in the student's QR code.
 *
 * @returns proof array (3-4 hex strings for 10k students) + leaf + index
 */
export function getMerkleProof(
  tree: any,
  dids: string[],
  targetDID: string
): MerkleProofResult {
  const leafIndex = dids.indexOf(targetDID);
  if (leafIndex === -1) throw new Error(`DID not found in registry: ${targetDID}`);

  const leaf = hashDID(targetDID);
  const proof = tree.getProof(leaf).map((p: { data: Buffer }) => bufferToHex(p.data));

  return {
    proof,
    leaf: bufferToHex(leaf),
    leafIndex,
  };
}

// ─── Verify ────────────────────────────────────────────────

/**
 * Verify a student's Merkle proof against the cached root.
 * This runs completely OFFLINE on the guard's phone.
 *
 * Algorithm:
 *   1. Hash the student DID → leaf
 *   2. Walk up the proof: hash(sortAndCombine(current, sibling))
 *   3. Compare final hash to stored root
 *
 * @returns true if student is in the enrolled registry
 */
export function verifyMerkleProof(input: MerkleVerifyInput): boolean {
  const { did, proof, root } = input;

  if (!proof || proof.length === 0) return false;
  if (!root || root === '0x') return false;

  const leaf = hashDID(did);

  // Reconstruct the path using sorted-pair hashing (must match tree options)
  let computed: Buffer = leaf;
  for (const proofHex of proof) {
    const sibling = Buffer.from(proofHex.replace('0x', ''), 'hex');
    // Sort pairs deterministically (same as tree's sortPairs: true option)
    if (Buffer.compare(computed, sibling) < 0) {
      computed = keccak256(Buffer.concat([computed, sibling]));
    } else {
      computed = keccak256(Buffer.concat([sibling, computed]));
    }
  }

  return bufferToHex(computed) === root.toLowerCase();
}

// ─── Utility ───────────────────────────────────────────────

/**
 * Verify directly against a MerkleTree instance (for backend use).
 * Uses merkletreejs built-in verification (faster, no manual walk needed).
 */
export function verifyWithTree(
  tree: any,
  did: string,
  proof: string[]
): boolean {
  const leaf = hashDID(did);
  const proofBuffers = proof.map(p => Buffer.from(p.replace('0x', ''), 'hex'));
  return tree.verify(proofBuffers, leaf, tree.getRoot());
}

/**
 * How many hashes are in a proof for N leaves.
 * Useful for estimating QR code payload size.
 * For 10,000 students → ceil(log2(10000)) = 14 hashes = 14 × 32 bytes = ~450 bytes
 */
export function proofDepth(leafCount: number): number {
  return Math.ceil(Math.log2(leafCount));
}
