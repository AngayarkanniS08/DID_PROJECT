import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Verifier } from "@secure-verify/did-core";
import { Icon } from "../../components/dashboard/DashboardIcons";
import { studentService } from "../../services/Student.service";
import "./VerifierPortal.css";

export const VerifierPortal: React.FC = () => {
    const [issuerAddress, setIssuerAddress] = useState<string | null>(null);
    const issuerAddressRef = useRef<string | null>(null);

    const [scanResult, setScanResult] = useState<{
        isValid: boolean;
        studentData?: any;
        error?: string;
    } | null>(null);

    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // 1. Fetch the trusted issuer address once
        const fetchConfig = async () => {
            try {
                const config = await studentService.getIssuerConfig();
                setIssuerAddress(config.address);
                issuerAddressRef.current = config.address;
            } catch (err) {
                console.error("Failed to load issuer config", err);
            }
        };
        fetchConfig();

        // 2. Initialize scanner once
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                videoConstraints: {
                    facingMode: "environment"
                }
            },
            /* verbose= */ false
        );

        // Define a local function that captures the latest issuerAddress via a ref or similar
        // For simplicity here, we'll just check it inside the callback
        scanner.render((text) => {
            onScanSuccess(text, scanner);
        }, onScanError);

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, []); // 🟢 Run ONCE on mount

    const onScanSuccess = (decodedText: string, scanner: Html5QrcodeScanner) => {
        const currentAddress = issuerAddressRef.current;
        if (!currentAddress) {
            console.warn("Issuer address not yet loaded. Skipping verification.");
            return;
        }

        try {
            const payload = JSON.parse(decodedText);

            // Perform Cryptographic Verification
            const verification = Verifier.verifyIdentity(payload, currentAddress);

            if (verification.isValid) {
                setScanResult({
                    isValid: true,
                    studentData: payload
                });
                scanner.pause();

                // OPTIONAL: Log the verification attempt to backend
                // This would be Phase 4
            } else {
                setScanResult({
                    isValid: false,
                    error: verification.error || "Signature Mismatch"
                });
            }
        } catch (err) {
            console.error("Invalid QR Format", err);
        }
    };

    const onScanError = (err: any) => {
        // We ignore scan errors to keep noise low
    };

    const handleReset = () => {
        setScanResult(null);
        if (scannerRef.current) {
            try {
                scannerRef.current.resume();
            } catch (e) {
                // If it fails to resume, just re-instance
                console.error("Failed to resume scanner", e);
            }
        }
    };

    return (
        <div className="verifier-root">
            <div className="verifier-header">
                <p>Gateway Security</p>
                <h1>Identity Verification</h1>
            </div>

            <div className="scanner-container">
                <div id="reader"></div>

                <div className="scanner-overlay">
                    <div className="scan-corner top-left"></div>
                    <div className="scan-corner top-right"></div>
                    <div className="scan-corner bottom-left"></div>
                    <div className="scan-corner bottom-right"></div>
                    <div className="scan-line"></div>
                </div>
            </div>

            {scanResult && (
                <div className={`verifier-result ${scanResult.isValid ? 'success' : 'error'}`}>
                    <div className="result-card">
                        <div className="result-icon">
                            {scanResult.isValid ? <Icon.Check /> : <Icon.XCircle />}
                        </div>

                        <h2>{scanResult.isValid ? "Identity Verified" : "Access Denied"}</h2>
                        <p>{scanResult.isValid
                            ? "This credential has been cryptographically validated."
                            : scanResult.error || "Security protocol failure detected."}
                        </p>

                        {scanResult.isValid && scanResult.studentData && (
                            <div className="student-data-reveal">
                                <div className="data-row">
                                    <label>Name</label>
                                    <span>
                                        {scanResult.studentData.vc?.credentialSubject?.name || scanResult.studentData.name}
                                    </span>
                                </div>
                                <div className="data-row">
                                    <label>Roll No</label>
                                    <span>
                                        {scanResult.studentData.vc?.credentialSubject?.roll || scanResult.studentData.roll}
                                    </span>
                                </div>
                                <div className="data-row">
                                    <label>Issuer</label>
                                    <span>SECUREVERIFY UNIV.</span>
                                </div>
                            </div>
                        )}

                        <button className="btn-reset" onClick={handleReset}>
                            {scanResult.isValid ? "Finish & Reset" : "Retry Scan"}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 40, opacity: 0.5, fontSize: 11, textAlign: 'center' }}>
                🛡️ E2E Cryptographic Verification • Powered by SecureVerify
            </div>
        </div>
    );
};
