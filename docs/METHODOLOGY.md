# 3. METHODOLOGY: THE IDENTITY LIFECYCLE

This section details the expansive technical architecture, cryptographic strategies, and exact operational workflows of the SecureVerify decentralized identity system. The methodology is structured as a chronological "Identity Lifecycle," tracing the flow of sensitive data from its inception within centralized administrative gateways, across immutable blockchain ledgers, and ultimately into the completely off-network mathematical engines residing on physical mobile devices. 

By dissecting the implementation block-by-block, this report exhaustively documents the programmatic logic, module integrations, and exact system calls required to facilitate sub-second, trustless Verifiable Credential (VC) validation.

---

## 3.1 THE GATEWAY (ADMINISTRATIVE ISSUANCE)

The foundational layer encapsulates the high-security Node.js infrastructure responsible for orchestrating persistent database transactions, generating fundamental cryptographic parameters, and bridging the centralized university administrative network with the decentralized Polygon blockchain cluster.

### 3.1.1 The Trust Anchor (NestJS & TypeORM Initialization)
The operational sequence initiates with the provisioning of the NestJS (`@nestjs/core`, version 11.x) backend framework. Unlike lightweight web servers, NestJS enforces a rigorous modular architecture utilizing dependency injection. The primary `api-issuer` process initializes on the host server and instantly requests a connection pool to the underlying PostgreSQL database cluster. This bridging is governed entirely by TypeORM (`@nestjs/typeorm`), a sophisticated Object-Relational Mapper that enforces strict TypeScript Entity mappings directly into SQL DDL constraints.

Administrative access to the system is fiercely guarded. When an onboarding officer attempts to access the React-based `admin-web` dashboard, the `/auth/login` endpoint is invoked. The `@nestjs/passport` strategy dynamically intercepts the HTTP request, extracting the plaintext credentials. The system explicitly bypasses plaintext storage; rather, it queries the `Admin` database table for the matching identity. The submitted password is mathematically salted and hashed locally taking roughly 10 rounds using the `bcrypt` module, and identically compared against the stored 60-character hash footprint. 

Upon a positive algorithmic match, the NestJS `JwtService` generates an encrypted JSON Web Token (JWT) injected with roles and expiration metadata. This bearer token acts as the mandatory gateway key, seamlessly passed in the HTTP Headers of all subsequent issuance and management calls.

### 3.1.2 Batch Processing and Payload Validation
Because university deployments require the simultaneous onboarding of thousands of students per academic cycle, individual manual entry is computationally inefficient. Within the React dashboard interface, the administrator invokes the **Bulk Enroll Students** protocol.

On the client side, a `.csv` (Comma Separated Values) dataset is uploaded. To prevent massive memory overhead on the NestJS server, the raw data parsing occurs entirely within the client’s browser runtime utilizing the `papaparse` library. The resulting structured JSON matrices are batched and POSTed to the NestJS `/students/bulk` pipeline.

Once the payload strikes the server, the backend controllers aggressively sanitize it. Using a suite of `class-validator` and `class-transformer` modules, the data is forced through rigorous Data Transfer Object (DTO) schematics. Every demographic string (Name, Roll Number, Department) must perfectly align with the expected `STUDENT_CREDENTIAL_SCHEMA` boundaries before the data is permitted to touch the database layer. Successfully validated blocks are then dispatched to TypeORM, which executes heavily optimized bulk `INSERT` statements into the PostgreSQL `Student` entity ledger. These initial records are inserted as "inactive" structures, awaiting their cryptographic wrapping.

### 3.1.3 Cryptography & The Blockchain Anchor (ethers.js & Solidity)
This represents the primary security innovation of the issuance phase: transforming simple database rows into mathematically unforgeable identities. Driven by the bespoke `@secure-verify/did-core` module, this process is isolated within the Node.js backend.

1. **DID Generation & Structure Definition:** For every student newly inserted into the database, the `StudentsService` constructor executes the `DIDGenerator`. It dynamically creates a formal W3C Decentralized Identifier string (e.g., `did:sec:verify:8a6b4c...`) utilizing `uuidv4()` randomness to guarantee zero collision probability globally.

2. **Elliptic Curve Signing Validation:** The system then instantiates the `Signer` utility, a mechanism driven by the industry-standard `ethers.js` (v6.x) library. It internally initializes a secure `ethers.Wallet` specifically bound to the highly sensitive `ISSUER_PRIVATE_KEY` ecosystem variable. The student’s raw JSON demographic data and expiration timestamps are hashed together using the Keccak-256 (`keccak256`) collision-resistant sequence. The `ethers.Wallet` seamlessly signs this generated hash block utilizing the Elliptic Curve Digital Signature Algorithm (ECDSA) mapped onto the `secp256k1` mathematical curve. Exploring advanced asymmetric cryptography, this process ensures anyone with the Issuer's Public Key can verify without having access to the Private Key.

3. **Merkle Tree Construction:** Simultaneously, the revocation state mapping initiates via the `@nestjs/schedule` automated `MerkleService` cron-job. The module extracts all student DIDs currently possessing an `ACTIVE` state within the PostgreSQL database. Utilizing the `merkletreejs` library, every DID acts as a pristine leaf node in a binary cryptographic tree. Every leaf is hashed individually via Keccak-256, and adjacent leaf combinations are recursively combined and re-hashed upwards until a deterministic, singular 32-byte hexadecimal **Merkle Root** is produced. 

4. **Polygon Amoy Invocation:** Finally, the transition to decentralized permanence. The NestJS service connects over the public internet to the Polygon Amoy testnet RPC (`https://rpc-amoy.polygon.technology`) using an `ethers.JsonRpcProvider`. The service constructs an encoded, gas-optimized on-chain transaction targeting the bespoke `DIDMerkleRegistry.sol` smart contract (which was compiled and committed to the ledger via Hardhat scripts previously). The service calls the explicitly restricted `updateRoot(bytes32)` function, transacting the newly computed 32-byte Root directly onto the blockchain state mapping, rendering the database explicitly unchangeable. 

---

## 3.2 THE HANDSHAKE (STUDENT WALLET ACQUISITION)

Unlike traditional database-driven web applications, Self-Sovereign Identity strictly demands that users physically control their data. This stage details the client-side pipeline built in React Native (Expo) which ferries cryptographic data directly into the fortified hardware of individual mobile devices.

### 3.2.1 Secure Transport and Deep Linking
With the identity sealed mathematically in the database and the blockchain, the backend queries the particular student's database ledger. It retrieves the W3C credential JSON, the generated ECDSA `signature`, and explicitly constructs an individual array of sibling node hashes forming the student's unique **Merkle Proof**.

To avoid forcing users into complex password-based log-ins on mobile devices, the NestJS service packages this entire architectural payload into a serialized URI string base64url-encoded parameters. These dynamic Deep Links (`exp://mobile-wallet/credential?payload=...`) are transmitted to the student via secure SMTP email pipelines. 

When the student’s cellular device receives the URL, the Expo `Linking` API detects the custom scheme suffix. It natively forces the OS to launch the `mobile-wallet` bundle, automatically injecting the parsed parameters into the React Navigation listener scope. 

### 3.2.2 Hardware Locking & Biometrics (FaceID/TouchID)
Upon immediate app launch, the payload must be protected from extraction or local storage snooping by malicious concurrent applications. System architecture mandates that abstract digital possession fundamentally align with definitive biological reality. 

Before the raw API keys and signature chains can be completely written into persistent local files or instantiated into JavaScript RAM, the application throws a hard block leveraging the `expo-local-authentication` framework. This invokes direct kernel-level calls to Apple's FaceID or Android’s Fingerprint biometric subsystems. If the hardware optical or capacitive read fails to mirror the primary enrolled user, the decryption keys simply evaporate, rendering the application inert and preventing unauthorized key access if the physical device is stolen or lost.

If the biometric hurdle is positively cleared, the credential is piped into `@react-native-async-storage/async-storage` for highly resistant, sandboxed application-level permanence.

### 3.3.3 The Dynamic Payload Matrix (QR Rendering)
Whenever the student needs to physically authenticate themselves (e.g., at an examination hall or campus gate), the active credential must be passed to the interrogator. Because the environment demands absolute speed without relying on NFC dependencies, the system creates a high-density optical transfer vector.

The frontend retrieves the credential object and can computationally augment it with a rapidly rotating Time-based One-Time Password (TOTP) derivative to protect against screenshot-replay vulnerabilities. The complete, structured JSON schema—holding the exact `credentialSubject` block, the ECDSA signature hex string, and the specific `merkleProof` array—is piped linearly into the `qrcode.react` (or `react-native-svg`) rendering canvas engine. This engine generates a deterministic, dense 2D optical mathematical matrix on the LED screen, placing the application into a **QR Ready** state.

---

## 3.3 THE VERDICT (OFFLINE SECURITY VERIFICATION)

This layer physically governs the environmental checkpoints. Designed exclusively for sub-optimal network conditions, it consumes the advanced cryptography generated across the previous layers to render an infallible, instantaneous security decision strictly offline, utilizing the mobile phone's native CPU processing capabilities.

### 3.3.1 Severing the Cord (The Morning Cache Sync)
The cardinal innovation of the Verifier architecture is the eradication of cloud latency or outage disruption. At the commencement of a duty shift within a Wi-Fi-enabled zone, the security guard opens the `mobile-verifier` application. 

The application executes an `axios` HTTP GET request against the NestJS backend `/merkle/root` micro-endpoint. Unlike downloading tens of thousands of student rows, the application downloads a single lightweight string: the current 32-byte Merkle Root representing today’s unrevoked students. This mathematical anchor is committed heavily into local persistent memory (`AsyncStorage`). Consequently, the verifier severs external Wi-Fi and 5G/LTE requirements, operating fundamentally closed-loop for the remainder of the operational cycle.

### 3.3.2 Optical Scanning and Packet Unpacking
During gate operations, the application heavily utilizes the `expo-camera` optical stream subsystem. Continually analyzing 30 to 60 frames per second on the Android/iOS hardware level, the optical array hunts for standardized QR geometries. 

Upon successfully locking onto a passing student’s `mobile-wallet` screen, the `onBarcodeScanned` listener immediately engages, seizing and locking the decoding state to block redundant scanning loops. The unwrapped optical data string is parsed back into its JSON map through strict try/catch guardrails, instantly isolating malformed or injected data packets.

### 3.3.3 The Offline Validation Engine (Cryptographic Execution)
This discrete module forms the absolute mathematical core of the verification protocol, housed within the shared `did-core/src/lib/merkle.ts` logic layer. It sequentially subjects the captured payload against three distinct, disconnected proof arrays relying entirely on physical device computation speed.

1. **The Origin Authenticity Check (Signature Recovery):** Firstly, the engine mathematically determines if the ID itself is a counterfeit. It separates the raw text data payload from the embedded `signature` block. Using local processing exclusively, it applies the Keccak-256 algorithm against the text payload. Next, it executes the immensely complex `ethers.recoverAddress(hash, signature)` elliptic-curve algebraic algorithm. 
   
   Because ECDSA allows for deterministic asymmetric recovery, the output produced is precisely the original Ethereum-style public wallet address of whoever signed the data fragment. The engine explicitly compares this dynamically recovered address against the verifier application's hardcoded and completely trusted `ISSUER_ADDRESS`. An address mismatch indicates the payload text was tampered with post-issuance or generated by a malicious third-party, and the process mechanically terminates.

2. **The Integrity Execution (Merkle Tracing & Revocation):** Knowing the card was indeed created correctly by the university, the engine must still guarantee the student has not been subsequently suspended, expelled, or had their identity administratively flagged as `REVOKED` in the distant PostgreSQL database. 

   To accomplish this totally offline, the engine hashes the specific student's ID (their decentralized identifier). It extracts the isolated `merkleProof` array supplied tightly by the student's barcode. For every sequential element within that proof array, the local engine concatenates the current computed hash alongside the proof's sibling logic hash, cascading upwards algorithmically. 

3. **The Root Judgment (State Validation):** 
   If mathematically calculated without error, the final computed hash effectively represents the crest of that specific branch path. This String output is compared with exact algebraic precision (`===`) against the master Merkle Root cached tightly within the device during the Morning Sync phase. 
   
   If the student was suspended the prerequisite day, the NestJS database cron-job would have explicitly excluded their DID leaf when drafting the tree, broadcasting a uniquely different Root variable to Polygon. The student's old QR trace would crash into the newly downloaded Root with completely diverse hexadecimal outputs, catching an immutable fail. If the numbers perfectly mirror, the entity proves absolute status compliance directly based on mathematical induction.

### 3.3.4 The Fork (Human-Centric Interface Execution)
Operating strictly off the Boolean resolution values dispatched from the internal cryptographic machine, the application triggers localized React rendering lifecycles (`useState()`, `useEffect()`) within the `ResultScreen.tsx` scope.

*   **Invalid - Access Denied Failure Loop:** Should the time-stamp expire, the ECDSA signature deviate, or the final Merkle derivation fall out of sync with the Morning Cache root strings, the system immediately fails the student on the invalid branch path. The application calls directly to OS-level system drivers via the `expo-haptics` module executing `NotificationFeedbackType.Error`—which triggers a stark, sharp double structural vibration inside the cellular phone. Synchronously, the graphical user interface violently transitions to a high-contrast deep crimson background highlighting explicit failure criteria. 

*   **Valid - Access Granted (< 1.5s):** Conversely, if all mathematics sequentially clear, the screen smoothly flashes to a visually reassuring deep green `SUCCESS` banner state. The UI strips the dense hex arrays out of view entirely, pulling only the visually significant demographic text fields (`name` and `rollNumber`) outwards from the JSON hierarchy and presenting them enormously so the guard can cross-reference the physical subject quickly. 

Crucially, because each processing step—from 60 fps optical camera parsing, elliptic signature calculations, to binary Merkle pathing permutations—occurred tightly bundled inside the 64-bit local ARM processor of the mobile apparatus absent of HTTP latency, DNS lookups, SQL database load balancing, or concurrent socket negotiations, the entire operation concludes robustly in under **1.5 seconds**. This achieves extreme, offline-resilient access throughput uniquely suited to challenging real-world deployment theaters.

---

## 3.4 DATABASE ARCHITECTURE AND STATE CONSTRAINTS

Prior to any cryptography or mobile dissemination, the underlying system is fundamentally driven by a centralized persistence layer. Utilizing an enterprise-grade PostgreSQL SQL cluster mapping strongly to TypeORM schema implementations, the engine coordinates the permanent structure behind transient mathematical hashes.

### 3.4.1 The Security Authentication Ledger
The platform secures all issuance protocols using the specific `Admin` table matrix definition. Functioning explicitly to prevent database-level hacking or dump exploitation, administrators' primary entry mechanisms are highly localized to restricted inputs.
The database schema dictates:
- `id`: Formatted heavily as a binary `uuid` universally unique identifier primary key sequence limit constraint.
- `username`: Enforced strictly with `@Column({ unique: true })`.
- `password`: Enforced mechanically to never hold plaintext sequences. Using `@BeforeInsert` hook callbacks, strings are dynamically translated locally over `bcrypt` functions mapping to complex salting logic.

### 3.4.2 Staging Operations and Credential Table Architectures 
Every individual identity traverses fundamentally through the gigantic `Student` transaction ledger schema mapping. Formatted as the staging ground preceding the Node.js signing events, the table defines rigid data architecture columns outlining:
- `id`: Root level UUID constraint.
- `did`: Standard string formatting maintaining compliance with Web3 standardizations.
- Generic details columns mapping strings accurately representing `name`, `rollNumber`, and `department`.
- `credentialPayload`: Governed as a specialized `jsonb`, structured exactly to accept scalable array variations within the W3C credentialing architecture constraints.

### 3.4.3 Algorithmic Storage and the Boolean Status Mechanism
Upon successfully executing the Ethereum block signing protocols, the Node.js application permanently mutates the specific matching rows through `UPDATE` SQL modifications logging the output vector algorithm `signature` values. 

The crux of the entire Merkle system specifically anchors directly to a singular, rigid Postgres `enum` specification: `status`. The column strictly accepts identical inputs spanning solely `'ACTIVE'` or `'REVOKED'`. 

This singular column functions as the global master switch behind every offline device mathematically. When the cron-automated algorithm triggers its execution pattern pulling active identifiers to calculate the tree structure, the code parses purely utilizing SQL commands equivalent to `SELECT did FROM student WHERE status='ACTIVE'`. The instant an administrator toggles the React interface dashboard, transforming the student Boolean condition to `'REVOKED'`, the next midnight tree execution strictly skips integrating their specific identifier leaf. Consequently driving a uniquely diverse mathematical string output directly up to the blockchain smart contract node network—permanently shutting off their physical ability to access campus locations by breaking their cryptographic paths universally.
