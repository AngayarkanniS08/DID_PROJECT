# 🛡️ SecureVerify: Decentralized Identity Validation System

SecureVerify is an enterprise-grade, offline-first identity verification platform. Designed for universities, highly restricted physical en# 🛡️ SecureVerify: Decentralized Identity Validation System

SecureVerify is an enterprise-grade, offline-first identity verification platform. Designed for universities, highly restricted physical environments, and campus gates, it allows institutions to issue unforgeable digital credentials backed by the Ethereum (Polygon) blockchain, while allowing security guards to verify those credentials in **sub 1.5-seconds entirely offline**.

---

## 💡 The Core Idea

Traditional digital identity systems rely on security guards scanning a QR code that ping a centralized database (like a PostgreSQL server) over campus Wi-Fi. If the Wi-Fi is slow, the cellular network drops, or the server crashes, the physical campus gate shuts down completely. 

**SecureVerify solves this using Cryptography and Blockchain.** 
By leveraging Elliptic Curve Digital Signatures (ECDSA) and Merkle Trees, the system cryptographically mathematically guarantees a student's identity completely off-network. Security guards download a tiny, 32-byte "Merkle Root" at the start of their shift. Using this single anchor point, their local mobile CPU can instantly determine if an ID is valid, forged, or administratively revoked—without ever making an HTTP request during the actual scan.

---

## 🏗️ Architecture & Tech Stack

The project is structured as a strict **Nx Monorepo**, ensuring total code sharing and unified cryptographic libraries between the centralized servers and edge devices.

*   **api-issuer:** A high-security **NestJS** backend utilizing **TypeORM** and **PostgreSQL**.
*   **admin-web:** A **React** dashboard for institutional batch enrollment and revocation management.
*   **mobile-wallet:** A **React Native / Expo** application running on the student's phone, locked by hardware FaceID, capable of rendering dynamic QR vectors.
*   **mobile-verifier:** A completely offline **React Native / Expo** scanning application for campus security.
*   **packages/did-core:** The unified TS library executing `ethers.js` signing and `merkletreejs` verification logic across all platforms.
*   **Smart Contract Base:** Deployed on the **Polygon Amoy Testnet** via Hardhat to ensure negligible gas fees for daily Root anchoring.

---

## ⚙️ Detailed Workflow (The Identity Lifecycle)

The system passes the responsibility of trust from the Database, to the Blockchain, to the Mathematics of the Mobile CPU.

### Chapter 1: The Gateway (Administrative Issuance)
1. **Authentication:** Administrators log into the React dashboard. The NestJS backend authenticates them via `@nestjs/passport` and `bcrypt` matching against the PostgreSQL database, issuing a JWT.
2. **Batch Ingestion:** Admins upload a `.csv` file via `papaparse`. The data is rigorously enforced against the `STUDENT_CREDENTIAL_SCHEMA` via NestJS `class-validator` DTOs before being safely inserted into TypeORM ledgers.
3. **The Cryptographic Engine (Backend Works):**
   * **DID Generation:** The system gives each student a W3C Decentralized Identifier (`did:sec:verify:uuidv4`).
   * **ECDSA Signature:** Operating strictly on the server, `ethers.Wallet` uses the `ISSUER_PRIVATE_KEY` to hash the student's demographic payload (`keccak256`) and stamp it with an Elliptic Curve signature (`secp256k1`).
   * **Merkle State Construction:** The backend queries Postgres for all `status='ACTIVE'` students. It hashes their DIDs into a colossal binary pyramid (a Merkle Tree). The ultimate tip of the pyramid, the 32-byte **Merkle Root**, is deterministically calculated. 
4. **Blockchain Anchor:** That single Root is committed immutably onto the Polygon blockchain by invoking the `DIDMerkleRegistry.sol` smart contract's `updateRoot` mechanism.
5. **Deep Link Dispatch:** The student receives an `exp://` deep link via email containing their data, signature, and their specific path through the Merkle Tree (their Merkle Proof).

### Chapter 2: The Handshake (Student Wallet)
1. **Secure Enclave Capture:** The student taps the link. The Expo React Native app natively intercepts the payload. The data is serialized into Apple/Android's strictly isolated hardware memory via `AsyncStorage` or `expo-secure-store`.
2. **Biological Lock:** To prevent ID extraction from a stolen phone, the decryption keys only unlock if the local OS `expo-local-authentication` routine (FaceID / Fingerprint) formally succeeds.
3. **Optical Matrix Generation:** When required, the payload (Demographics + Signature + Merkle Proof array) is jammed into a 2D optical array canvas using `qrcode.react`, ready to be physically scanned.

### Chapter 3: The Verdict (Offline Security Verification)
1. **The Morning Sync:** At the beginning of a guard's shift, their scanner app makes ONE network call (`axios`/GET) to download today's exact 32-byte Merkle Root from the NestJS system. Cellular data is completely disabled thereafter.
2. **Optical Scan:** The student’s QR is scanned. `expo-camera` traps the matrix instantly, halting processing overhead.
3. **The Offline Math (Execution):** 
   * *Signature Check:* The verifier's ARM Processor hashes the raw text, executing `ethers.recoverAddress(hash, signature)`. If it doesn't math out to the hardcoded `ISSUER_ADDRESS`, the card is visibly fake. Access Denied.
   * *Revocation Check:* The device takes the student's unique `did`, hashes it, and climbs the provided `merkleProof` array mathematically. If the final hash doesn't perfectly match the cache's Root from the Morning Sync, it means the database administrator switched their SQL Enum to `'REVOKED'`, effectively locking them out instantly offline.
4. **Sub-second UI:** Depending on the Boolean cryptography return, the complex multi-stage calculation collapses in under `1.5` seconds. The screen flashes deep Green (with demographic data overlaid) or vivid Red, triggering double-vibration `expo-haptics` warnings for physical feedback.

---

## 💻 Developer Setup & Scripts

Everything runs from the root Nx workspace. You must have Node.js 20+ and Docker installed.

### 1. Database Initialization
Boot the PostgreSQL container locally before launching the backend:
```bash
npm run db:up
```
*(To tear down the database, run `npm run db:down`)*

### 2. Full System Build & Lint
Nx handles intelligent, parallel monorepo management:
```bash
# Run everything simultaneously
npx nx run-many -t lint test build
```

### 3. Launching Applications
```bash
# 1. Start the NestJS Backend Backend (api-issuer) and React Admin Dashboard
npm run dev

# 2. Launch the Web3 Backend/Issuer individually
npx nx serve api-issuer

# 3. Launch the Admin Dashboard individually
npx nx serve admin-web

# 4. Boot the React Native Student Wallet (requires Expo Go)
npx nx start mobile-wallet

# 5. Boot the React Native Verifier App (requires Expo Go)
npx nx start mobile-verifier
```

### 4. Running the Crypto Test Suites
Ensure the `did-core` module correctly isolates Node.js dependencies from React Native environments:
```bash
npx nx test did-core
```vironments, and campus gates, it allows institutions to issue unforgeable digital credentials backed by the Ethereum (Polygon) blockchain, while allowing security guards to verify those credentials in **sub 1.5-seconds entirely offline**.

---

## 💡 The Core Idea

Traditional digital identity systems rely on security guards scanning a QR code that ping a centralized database (like a PostgreSQL server) over campus Wi-Fi. If the Wi-Fi is slow, the cellular network drops, or the server crashes, the physical campus gate shuts down completely. 

**SecureVerify solves this using Cryptography and Blockchain.** 
By leveraging Elliptic Curve Digital Signatures (ECDSA) and Merkle Trees, the system cryptographically mathematically guarantees a student's identity completely off-network. Security guards download a tiny, 32-byte "Merkle Root" at the start of their shift. Using this single anchor point, their local mobile CPU can instantly determine if an ID is valid, forged, or administratively revoked—without ever making an HTTP request during the actual scan.

---

## 🏗️ Architecture & Tech Stack

The project is structured as a strict **Nx Monorepo**, ensuring total code sharing and unified cryptographic libraries between the centralized servers and edge devices.

*   **api-issuer:** A high-security **NestJS** backend utilizing **TypeORM** and **PostgreSQL**.
*   **admin-web:** A **React** dashboard for institutional batch enrollment and revocation management.
*   **mobile-wallet:** A **React Native / Expo** application running on the student's phone, locked by hardware FaceID, capable of rendering dynamic QR vectors.
*   **mobile-verifier:** A completely offline **React Native / Expo** scanning application for campus security.
*   **packages/did-core:** The unified TS library executing `ethers.js` signing and `merkletreejs` verification logic across all platforms.
*   **Smart Contract Base:** Deployed on the **Polygon Amoy Testnet** via Hardhat to ensure negligible gas fees for daily Root anchoring.

---

## ⚙️ Detailed Workflow (The Identity Lifecycle)

The system passes the responsibility of trust from the Database, to the Blockchain, to the Mathematics of the Mobile CPU.

### Chapter 1: The Gateway (Administrative Issuance)
1. **Authentication:** Administrators log into the React dashboard. The NestJS backend authenticates them via `@nestjs/passport` and `bcrypt` matching against the PostgreSQL database, issuing a JWT.
2. **Batch Ingestion:** Admins upload a `.csv` file via `papaparse`. The data is rigorously enforced against the `STUDENT_CREDENTIAL_SCHEMA` via NestJS `class-validator` DTOs before being safely inserted into TypeORM ledgers.
3. **The Cryptographic Engine (Backend Works):**
   * **DID Generation:** The system gives each student a W3C Decentralized Identifier (`did:sec:verify:uuidv4`).
   * **ECDSA Signature:** Operating strictly on the server, `ethers.Wallet` uses the `ISSUER_PRIVATE_KEY` to hash the student's demographic payload (`keccak256`) and stamp it with an Elliptic Curve signature (`secp256k1`).
   * **Merkle State Construction:** The backend queries Postgres for all `status='ACTIVE'` students. It hashes their DIDs into a colossal binary pyramid (a Merkle Tree). The ultimate tip of the pyramid, the 32-byte **Merkle Root**, is deterministically calculated. 
4. **Blockchain Anchor:** That single Root is committed immutably onto the Polygon blockchain by invoking the `DIDMerkleRegistry.sol` smart contract's `updateRoot` mechanism.
5. **Deep Link Dispatch:** The student receives an `exp://` deep link via email containing their data, signature, and their specific path through the Merkle Tree (their Merkle Proof).

### Chapter 2: The Handshake (Student Wallet)
1. **Secure Enclave Capture:** The student taps the link. The Expo React Native app natively intercepts the payload. The data is serialized into Apple/Android's strictly isolated hardware memory via `AsyncStorage` or `expo-secure-store`.
2. **Biological Lock:** To prevent ID extraction from a stolen phone, the decryption keys only unlock if the local OS `expo-local-authentication` routine (FaceID / Fingerprint) formally succeeds.
3. **Optical Matrix Generation:** When required, the payload (Demographics + Signature + Merkle Proof array) is jammed into a 2D optical array canvas using `qrcode.react`, ready to be physically scanned.

### Chapter 3: The Verdict (Offline Security Verification)
1. **The Morning Sync:** At the beginning of a guard's shift, their scanner app makes ONE network call (`axios`/GET) to download today's exact 32-byte Merkle Root from the NestJS system. Cellular data is completely disabled thereafter.
2. **Optical Scan:** The student’s QR is scanned. `expo-camera` traps the matrix instantly, halting processing overhead.
3. **The Offline Math (Execution):** 
   * *Signature Check:* The verifier's ARM Processor hashes the raw text, executing `ethers.recoverAddress(hash, signature)`. If it doesn't math out to the hardcoded `ISSUER_ADDRESS`, the card is visibly fake. Access Denied.
   * *Revocation Check:* The device takes the student's unique `did`, hashes it, and climbs the provided `merkleProof` array mathematically. If the final hash doesn't perfectly match the cache's Root from the Morning Sync, it means the database administrator switched their SQL Enum to `'REVOKED'`, effectively locking them out instantly offline.
4. **Sub-second UI:** Depending on the Boolean cryptography return, the complex multi-stage calculation collapses in under `1.5` seconds. The screen flashes deep Green (with demographic data overlaid) or vivid Red, triggering double-vibration `expo-haptics` warnings for physical feedback.

---

## 💻 Developer Setup & Scripts

Everything runs from the root Nx workspace. You must have Node.js 20+ and Docker installed.

### 1. Database Initialization
Boot the PostgreSQL container locally before launching the backend:
```bash
npm run db:up
```
*(To tear down the database, run `npm run db:down`)*

### 2. Full System Build & Lint
Nx handles intelligent, parallel monorepo management:
```bash
# Run everything simultaneously
npx nx run-many -t lint test build
```

### 3. Launching Applications
```bash
# 1. Start the NestJS Backend Backend (api-issuer) and React Admin Dashboard
npm run dev

# 2. Launch the Web3 Backend/Issuer individually
npx nx serve api-issuer

# 3. Launch the Admin Dashboard individually
npx nx serve admin-web

# 4. Boot the React Native Student Wallet (requires Expo Go)
npx nx start mobile-wallet

# 5. Boot the React Native Verifier App (requires Expo Go)
npx nx start mobile-verifier
```

### 4. Running the Crypto Test Suites
Ensure the `did-core` module correctly isolates Node.js dependencies from React Native environments:
```bash
npx nx test did-core
```