# PLAN: SecureVerify Project Report (Persona-Driven Methodology)

## Goal
To structure the methodology section of the formal project report. Utilizing the "Persona-Driven Journey" format allows the report to systematically document the complex cryptographic backend, mobile enclave security, and offline verification math in a highly readable, flowing narrative.

## Report Structure: "The Identity Lifecycle"

### 🛡️ Chapter 1: The Gateway (Administrative Issuance)
*Focus: Centralized Security and Blockchain Anchors*

*   **1.1 The Trust Anchor (NestJS & TypeORM)**
    *   **Content Focus:** Document the administrative backend authentication. Explain how the `@nestjs/passport` module and `bcrypt` secure the gateway, detailing the Entity schemas stored in PostgreSQL.
*   **1.2 Batch Processing and Validation**
    *   **Content Focus:** Detail the data ingestion pipeline. Explain how `papaparse` handles the CSV and how `class-validator` enforces strict compliance with the `STUDENT_CREDENTIAL_SCHEMA` Data Transfer Objects.
*   **1.3 Cryptography & The Blockchain (ethers.js & Solidity)**
    *   **Content Focus:** This section defines the core security innovation. Explain the ECDSA `secp256k1` signing mathematically. Then, explain the `MerkleService` cron-job: constructing the tree from UUID Leaves and anchoring the 32-byte Root to the `DIDMerkleRegistry.sol` smart contract on Polygon Amoy.
    *   **Required Diagram:** A flowchart showing Database Row -> Node.js Hashing -> Merkle Tree -> Polygon Smart Contract.

### 📱 Chapter 2: The Handshake (Student Wallet Acquisition)
*Focus: Edge-Device UX and Cryptographic Storage*

*   **2.1 Secure Transport and Deep Linking**
    *   **Content Focus:** Explain the decentralized data transfer. Detail how the credential payload is packed into a URI (`exp://mobile-wallet/credential?payload=...`) and intercepted natively by the Expo Linking module.
*   **2.2 Hardware Locking & Biometrics**
    *   **Content Focus:** Document the mobile security protocol. Explain how `expo-local-authentication` binds access to biological identity (FaceID), keeping keys locked in the device's hardware enclave / `AsyncStorage`.
*   **2.3 The Dynamic Payload Matrix**
    *   **Content Focus:** Detail the generation of the optical QR code matrix using `qrcode.react`, emphasizing what data is enclosed (subject details, ECDSA signature, and the user's specific Merkle Proof arrays).

### 🔍 Chapter 3: The Verdict (Offline Security Verification)
*Focus: Offline Cryptographic Math & Sub-second Validation*

*   **3.1 Severing the Cord (The Morning Cache Sync)**
    *   **Content Focus:** Explain the architectural decision behind "Offline-First". Document how downloading the 32-byte Merkle Root once per day completely eliminates the need for HTTP API latency at the campus gate.
*   **3.2 The Offline Math (Signature Recovery)**
    *   **Content Focus:** Detail the first computational check. Show how `ethers.recoverAddress(hash, signature)` executes locally on the ARM CPU to mathematically guarantee the dataset was not tampered with.
*   **3.3 The Local Integrity Check (Merkle Tracing)**
    *   **Content Focus:** Detail the exact revocation algorithm. Explain how the app hashes the DID, walks iteratively through the provided sibling arrays, and compares the final mathematical output against the cached Morning Root to prove the Database `status` remains valid.
*   **3.4 Human-Centric UI (Hardware & Haptics)**
    *   **Content Focus:** Conclude with the user experience. Explain how complex multi-stage cryptography resolves in `< 1.5 seconds`, rendering deep green/red visual states and triggering physical `expo-haptics` feedback for the guard.

---

## 📋 Task Breakdown & Next Steps

1.  **Draft Text Bodies:** Fill out the sections defined above using the comprehensive technical notes established previously.
2.  **Generate Architecture Diagrams:** Create Eraser/Lucidchart diagrams representing the data flow at critical junctions (Section 1.3 and Section 3.3).
3.  **Review Technical Terminology:** Ensure academic/technical terms (ECDSA, Merkle Proofs, Sub-second latency, TypeORM) are formatted properly for a formal software engineering document.
