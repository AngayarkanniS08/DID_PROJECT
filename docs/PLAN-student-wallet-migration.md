# PLAN: Student Wallet Migration (Hero Card UI)

This plan outlines the migration of student features from the backend into a premium "Hero Card" experience in the `mobile-wallet` app.

## Objective
Transform the `mobile-wallet` into a secure, aesthetic digital identity container that students can use for offline verification.

## 🛠️ Proposed Changes

### 1. Data Layer & Caching
- **Implementation**: Use `expo-secure-store` for sensitive keys (DID private key) and `AsyncStorage` (or generic cache) for the VC payload.
- **Goal**: Allow the student to show their ID card even without an active internet connection.

### 2. Security (Biometric Gate)
- **Library**: `expo-local-authentication`.
- **Flow**: When the student taps "Reveal QR," the app will trigger FaceID/Fingerprint. Access to the cryptographic signing (TOTP/QR) is only granted after successful auth.

### 3. UI/UX: Hero Card Experience
- **Component**: Create a `StudentCard` component with:
    - Glassmorphism effect.
    - Placeholder profile photo.
    - Floating name/enrollment details.
- **Animations**: Use `react-native-reanimated` for a "Flip" or "Slide" effect to transition from the ID photo to the QR code.

### 4. Verification Logic (TOTP QR)
- **TOTP**: Use the `totpSecret` from the backend to generate a 30-second rotating code.
- **QR Content**: The QR will contain a signed JWT containing `did`, `timestamp`, and the `6-digit TOTP`.
- **Verifier Sync**: The `mobile-verifier` will validate this TOTP against the student's public record to prevent replay attacks.

## 🗒️ Task Breakdown

### Phase 1: Infrastructure
- [ ] Install `expo-secure-store` and `expo-local-authentication`.
- [ ] Create `StorageService` for VC/DID management.
- [ ] Implement `TOTPService` for QR code generation.

### Phase 2: User Interface
- [ ] Design `StudentCard` (Front & Back).
- [ ] Implement "Reveal QR" button with Biometric gating.
- [ ] Add "Verify with DigiLocker" as an onboarding step (if wallet is empty).

### Phase 3: Integration & Testing
- [ ] Verify TOTP sync with backend.
- [ ] Test offline card display.
- [ ] E2E test with `mobile-verifier` app.

## ✅ Verification Plan
- **Security Test**: Ensure QR code cannot be revealed without biometric success.
- **Offline Test**: Disable Wi-Fi/Data and verify the ID card still renders correctly.
- **Rotation Test**: Verify the QR code changes every 30 seconds and the Verifier accepts all valid rotations.
