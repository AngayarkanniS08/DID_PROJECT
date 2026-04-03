# PLAN: Merkle Tree Blockchain Cache for Offline DID Verification

**Slug:** `merkle-blockchain-cache`  
**Stack:** NestJS + Solidity (Polygon Amoy) + React Native (Expo)  
**Goal:** Remove the hardcoded issuer address. Replace with a cryptographically provable, blockchain-anchored, offline-capable Merkle Tree cache.

---

## 🧠 Concept Summary

Instead of every guard phone caching 10,000 student records, we compress the entire enrollment into **1 Merkle Root (32 bytes)** anchored to a Polygon smart contract. Each student's QR embeds their **Merkle Proof** (3–4 hashes). The verifier recomputes the path offline and checks it against the cached root. No server. No database. Mathematically guaranteed.

---

## Phase 1 — Smart Contract (`DIDMerkleRegistry.sol`)

**Network:** Polygon Amoy Testnet (free gas)  
**Deployer:** NestJS backend using `ethers.js`

### Contract Design
```
DIDMerkleRegistry.sol
├─ bytes32 public merkleRoot          ← current enrollment state
├─ uint256 public lastUpdated         ← block timestamp
├─ address public owner               ← NestJS wallet
├─ function updateRoot(bytes32 root)  ← onlyOwner
└─ event RootUpdated(bytes32 root, uint256 timestamp)
```

### Tasks
- [ ] Write `DIDMerkleRegistry.sol` in `packages/did-core/contracts/`
- [ ] Set up Hardhat or Foundry for compilation + testing
- [ ] Deploy to Polygon Amoy Testnet
- [ ] Save contract address + ABI to `packages/did-core/src/lib/registry.ts`
- [ ] Fund deployer wallet with test MATIC (faucet: `faucet.polygon.technology`)

---

## Phase 2 — Backend Merkle Engine (`NestJS`)

**Package to add:** `merkletreejs` + `keccak256` (both pure JS, no native deps)

### Files to create/modify

#### `apps/api-issuer/src/app/merkle/merkle.service.ts` [NEW]
```
MerkleService
├─ buildTree(dids: string[]): MerkleTree
│   └─ leaves = dids.map(did => keccak256(did))
│   └─ sort leaves (deterministic)
│   └─ return new MerkleTree(leaves, keccak256, { sortPairs: true })
├─ getRoot(tree): string         ← 32-byte hex
├─ getProof(tree, did): string[] ← array of sibling hashes
└─ verifyProof(proof, leaf, root): boolean ← pure math check
```

#### `apps/api-issuer/src/app/merkle/merkle.controller.ts` [NEW]
```
GET /merkle/root
  └─ Returns current on-chain root + lastUpdated timestamp

GET /merkle/sync
  └─ Mobile calls this on WiFi. Returns: { root, contractAddress, chainId }
```

#### `apps/api-issuer/src/app/students/students.service.ts` [MODIFY]
```
issueCredential()
  └─ EXISTING: build VC + sign
  └─ NEW: generate merkleProof for this student's DID
  └─ NEW: embed merkleProof[] + merkleLeafIndex in VC payload
```

#### `apps/api-issuer/src/app/merkle/merkle.cron.ts` [NEW]
```
@Cron('0 0 * * *')  ← Every midnight
rebuildAndAnchor()
  1. Fetch all active student DIDs from DB
  2. Build Merkle Tree
  3. Call DIDMerkleRegistry.updateRoot(newRoot)
  4. Log tx hash + new root
  5. Trigger QR regeneration for all students (optional, or lazy-gen on next login)
```

---

## Phase 3 — QR Code Payload Update

### New VC Structure
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": "did:ethr:0xISSUER...",
  "expirationDate": "2026-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:ethr:0xSTUDENT...",
    "name": "Priya Krishnamurthy",
    "rollNumber": "22CS042",
    "department": "CSE"
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "signature": "0xABCD..."
  },
  "merkleProof": ["0xhash1", "0xhash2", "0xhash3"],
  "merkleLeafIndex": 1042
}
```

**QR size impact:** ~3 hashes × 32 bytes = ~96 extra bytes. Total QR stays scannable.

---

## Phase 4 — Mobile Cache + Verifier Update

### Files to create/modify

#### `mobile-verifier/src/app/services/MerkleCache.service.ts` [NEW]
```typescript
MerkleCacheService
├─ syncFromChain()
│   └─ fetch: GET /merkle/sync
│   └─ AsyncStorage.setItem('merkleRoot', root)
│   └─ AsyncStorage.setItem('merkleLastSync', Date.now())
│   └─ Called on: app startup (if online) + every 6 hours
│
├─ getCachedRoot(): Promise<string | null>
│   └─ AsyncStorage.getItem('merkleRoot')
│
├─ verifyProof(did: string, proof: string[], root: string): boolean
│   └─ leaf = keccak256(did)
│   └─ computed = proof.reduce((hash, sibling) => keccak256(sort+combine))
│   └─ return computed === root
│
└─ getSyncAge(): Promise<number>   ← ms since last sync
```

#### `mobile-verifier/src/app/screens/ResultScreen.tsx` [MODIFY]
```
performVerification()
  Step 1: Check expirationDate                   (existing)
  Step 2: Verify ECDSA signature                 (existing)
  Step 3 (NEW): Merkle proof verification
    ├─ root = await MerkleCacheService.getCachedRoot()
    ├─ if no root → show "Sync needed" warning
    ├─ valid = MerkleCacheService.verifyProof(did, merkleProof, root)
    ├─ if !valid → FAIL (student not in enrolled registry)
    └─ if syncAge > 6hr → show amber "Stale cache" banner
```

#### `mobile-verifier/src/app/screens/HomeScreen.tsx` [MODIFY]
```
On mount (useEffect):
  └─ MerkleCacheService.syncFromChain()
  └─ Show sync status: "Registry synced 2h ago" or "⚠️ Offline — using cache"
```

---

## Phase 5 — did-core Package Update

#### `packages/did-core/src/lib/merkle.ts` [NEW]
Shared, tested Merkle logic usable by BOTH backend AND mobile:
```typescript
export function buildMerkleTree(dids: string[]): MerkleTree
export function getMerkleRoot(tree: MerkleTree): string
export function getMerkleProof(tree: MerkleTree, did: string): string[]
export function verifyMerkleProof(did: string, proof: string[], root: string): boolean
```
> ⚠️ Using a shared package means backend and mobile use identical proof logic — no drift.

---

## Verification Checklist

### Concept Tests
- [ ] Build tree with 5 DIDs → compute root → verify each with proof → all pass
- [ ] Modify one DID → root changes → old proofs fail (tamper resistance proven)

### Integration Tests
- [ ] NestJS cron fires → new root on Polygon Amoy → tx confirmed
- [ ] `GET /merkle/sync` returns correct on-chain root
- [ ] `issueCredential` response includes `merkleProof[]`

### Mobile Tests
- [ ] App launch (WiFi) → syncs root → AsyncStorage contains `merkleRoot`
- [ ] Go offline → scan valid QR with proof → ✅ PASS (Merkle match)
- [ ] Go offline → scan QR with tampered DID → ❌ FAIL (Merkle mismatch)
- [ ] Sync age > 6hr → amber banner shows on HomeScreen
- [ ] QR with no `merkleProof` field → graceful fallback warning

---

## Tech Stack Additions

| Package | Where | Purpose |
|---|---|---|
| `merkletreejs` | `did-core`, `api-issuer` | Tree building + proof generation |
| `keccak256` | `did-core`, `api-issuer` | Leaf hashing |
| `@nomicfoundation/hardhat-toolbox` | new `contracts/` folder | Contract compile + deploy |
| `ethers.js` | already installed | Contract interaction |

---

## Implementation Order

```
Phase 1: Smart Contract  (1 session)
Phase 5: did-core shared logic (1 session)  ← do before Phase 2 so backend uses it
Phase 2: Backend Merkle engine + cron (1 session)
Phase 3: QR payload update (part of Phase 2 session)
Phase 4: Mobile cache + verifier update (1 session)
```

**Total estimate:** 4 focused sessions.
