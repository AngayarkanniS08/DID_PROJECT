import React, { useState } from "react";
import { studentService } from "../../services/Student.service";
import "./ImportModal.css";

interface VerifyCredentialModalProps {
    onClose: () => void;
}

export const VerifyCredentialModal: React.FC<VerifyCredentialModalProps> = ({ onClose }) => {
    const [isVerifying, setIsVerifying] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsVerifying(true);
        setError(null);
        setResult(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const verificationResult = await studentService.verifyCredential(json);
                setResult(verificationResult);
            } catch (err: any) {
                console.error("Verification Error:", err);
                const backendError = err?.response?.data?.message || err?.message;
                setError(backendError || "Invalid JSON file or connection error.");
            } finally {
                setIsVerifying(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="import-modal-overlay">
            <div className="import-modal-card">
                <h2>Verify Credential</h2>
                <p>Upload a student's JSON credential to verify its authenticity.</p>

                {error && <div className="error-banner">{error}</div>}

                {!result ? (
                    <div className="file-drop-zone" style={{ padding: '40px', border: '2px dashed hsl(var(--primary))', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleFileUpload} 
                            style={{ 
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                top: 0,
                                left: 0,
                                opacity: 0,
                                cursor: 'pointer'
                            }} 
                            id="verify-upload" 
                        />
                        <div style={{ pointerEvents: 'none' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📄</div>
                            <div>{isVerifying ? "Checking Signature..." : "Click to select JSON file"}</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                            {result.success ? "✅" : "❌"}
                        </div>
                        <h3 style={{ color: result.success ? '#10b981' : '#ef4444' }}>
                            {result.success ? "Verification Successful" : "Verification Failed"}
                        </h3>
                        <div style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '12px', 
                            borderRadius: '8px', 
                            marginTop: '20px',
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '4px' }}>Recovered Address</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--primary)', wordBreak: 'break-all' }}>{result.recoveredAddress}</div>
                            
                            <div style={{ fontSize: '12px', color: 'var(--text-sub)', marginTop: '12px', marginBottom: '4px' }}>Issuer Address</div>
                            <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--foreground)', wordBreak: 'break-all' }}>{result.issuerAddress}</div>
                            
                            {!result.success && (
                                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', fontWeight: 'bold' }}>
                                    Error: {result.error}
                                </div>
                            )}
                        </div>
                        <button className="em-bg" style={{ marginTop: '20px', width: '100%' }} onClick={() => setResult(null)}>Verify Another</button>
                    </div>
                )}

                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button onClick={onClose} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        </div>
    );
};
