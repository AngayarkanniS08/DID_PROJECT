🛡️ SecureVerify: Zero-Trust Campus IAM Framework

    Blockchain-Enabled Passwordless Authentication & Certification System

📖 Executive Summary

Traditional campus identity and access management (IAM) systems rely on easily forgeable physical IDs or expensive hardware like RFID and biometrics, exposing institutions to replay attacks, server downtime, and prohibitive costs. To resolve this security-to-cost dilemma, this project introduces a highly scalable, Zero-Trust Decentralized Identity (DID) framework. By leveraging a Decentralized Public Key Infrastructure (DPKI) and time-based one-time passwords (TOTP), the system replaces costly physical infrastructure with dynamic, cryptographically signed QR codes stored securely in a student's mobile local vault.

Currently 80% complete and production-ready, the architecture features a resilient data pipeline for high-concurrency bulk enrollment, a W3C/JWT-compliant cryptographic issuance engine, and a multithreaded offline Mobile Verifier app capable of sub-1.5 second authentication and rigorous tamper detection without internet connectivity. Final phases will finalize this decentralized trust model by anchoring institutional public keys to Polygon/Ethereum smart contracts and integrating government-backed DigiLocker APIs to issue globally verifiable, blockchain-anchored academic degree certificates.
🚨 The Problem

    Physical Vulnerabilities: Traditional ID cards are easily forged, lost, or shared among students, leading to unauthorized campus access.

    Infrastructure Costs: Upgrading to hardware-centric solutions (RFID smart cards, Biometric scanners) imposes prohibitive deployment and continuous maintenance costs.

    Digital Exploits: Basic static digital IDs (like barcodes or standard QR codes) are vulnerable to screenshot sharing and replay attacks.

    Single Point of Failure: Centralized database verification means that if the university server goes down, campus gate security completely collapses.

💡 Our Solution

SecureVerify shifts the paradigm from centralized databases to Decentralized Cryptographic Identity.

    Self-Sovereign Identity: Students hold their cryptographic secrets in a secure local vault on their smartphones.

    Dynamic Authentication: The student app generates a fresh, TOTP-bound QR code every 30 seconds, completely neutralizing screenshot and replay attacks.

    Offline-First Verification: Security guards utilize a mobile application equipped with the University's Public Key to mathematically verify digital signatures locally. No internet connection is required to authenticate a student.

🛠️ Technology Stack & Architecture

This project utilizes a modern, tightly coupled Monorepo structure (Nx) to ensure strict TypeScript interface sharing between the frontend, backend, and mobile applications.
Frontend (Admin Dashboard)

    Core: React.js, TypeScript, Vite

    Styling: Tailwind CSS

    Data Processing: PapaParse (Client-side bulk CSV ingestion)

    Networking: Axios (with automated JWT interceptors)

Backend (Cryptographic Engine)

    Framework: NestJS (built on Express.js)

    Database & ORM: PostgreSQL, TypeORM (Abstracted for easy SQLite/Postgres migration)

    Security: Node Crypto, JSON Web Tokens (JWT), W3C Verifiable Credentials formatting

Mobile Applications (Student & Verifier)

    Framework: React Native

    Cryptography: @secure-verify/did-core (On-device signature recovery)

    Storage: SQLite / Secure Local Vault

    Hardware APIs: Camera/Scanner APIs, expo-haptics (Tactile feedback)

Web3 & Integrations (Pending)

    Blockchain: Polygon / Ethereum Smart Contracts, Web3.js / Ethers.js

    Storage: IPFS (InterPlanetary File System)

    Govt API: DigiLocker API Integration

🚀 Key Features & Implementation Status
✅ Phase 1: Institutional Setup & Data Pipeline (100%)

    Smart Directory Search: Real-time, multi-field indexing to filter thousands of records instantly.

    Crash-Resilient Ingestion: Client-side CSV parsing handles 500+ concurrent student enrollments without bottlenecking the Node.js server.

    Dedicated Database: Isolated PostgreSQL container (port 5433) guarantees data pipeline stability.

✅ Phase 2: Cryptographic Identity Engine (75%)

    Zero-Trust Issuance: Automated generation of Decentralized Identifiers (DIDs) and unique TOTP secrets.

    Standardized Formatting: Synchronized Single and Batch issuance logic to fully comply with W3C and JWT credential standards.

✅ Phase 3: Student App & Dynamic Credential (100%)

    Magic Link Provisioning: Passwordless onboarding securely distributes credentials to the student's mobile vault.

    Anti-Spoofing Generator: The app generates dynamically rotating, encrypted QR payloads entirely offline.

✅ Phase 4: The Verifier App (100%)

    Turbo-Scan Engine: Multithreaded scanning architecture offloads cryptographic math to achieve sub-1.5 second verification speeds.

    Offline PKI Validation: Instantly detects Signature Mismatch on tampered data and grants Canonical Matched for authentic identities without network reliance.

    Tactile UX: Integrated haptic feedback for security personnel upon successful QR detection.

⏳ Phase 5 & 6: Threat Enforcement & Certificate Anchoring (In Progress)

    Live Analytics (50%): Wiring React dashboard components with live PostgreSQL metrics.

    Kill-Switch (Pending): Centralized revocation lists to invalidate stolen devices instantly.

    DigiLocker & Blockchain (Pending): Fetching base identity via Govt APIs and anchoring cryptographic degree hashes to immutable smart contracts.

⚙️ How the Offline Verification Works (The Math)

    The Payload: The Student's app combines their DID + Current Timestamp and signs it using their locally stored secret.

    The Scan: The Guard's Verifier app reads this QR payload.

    The Check: The Verifier app ensures the timestamp is within the 30-second validity window (Anti-Replay).

    The Math: The Verifier uses the locally cached University Public Key to decrypt the signature. If the resulting hash matches the data, access is instantly granted.