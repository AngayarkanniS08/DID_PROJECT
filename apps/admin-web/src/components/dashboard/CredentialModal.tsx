import React, { useState, useEffect } from "react";
import { studentService } from "../../services/Student.service";
import { Icon } from "./DashboardIcons";
import "./ImportModal.css";

interface CredentialPreviewModalProps {
    studentId: string;
    onClose: () => void;
}

export const CredentialPreviewModal: React.FC<CredentialPreviewModalProps> = ({ studentId, onClose }) => {
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const data = await studentService.getStudentById(studentId);
                setStudent(data);
            } catch (err: any) {
                console.error("Failed to fetch student details", err);
                setError("Could not load credential details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [studentId]);

    const downloadJson = () => {
        if (!student || !student.credentials || student.credentials.length === 0) return;

        const credential = student.credentials[0];
        const fileName = `credential-${student.rollNumber}.json`;

        // Reconstruct the VC for download
        const vc = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1"
            ],
            "type": ["VerifiableCredential", "StudentCredential"],
            "issuer": credential.issuerDid || "did:polygon:0xIssuer",
            "issuanceDate": credential.issuanceDate,
            "expirationDate": credential.expirationDate,
            "credentialSubject": {
                "id": student.did,
                "name": student.name,
                "rollNumber": student.rollNumber,
                "email": student.email,
                "department": student.department
            },
            "proof": {
                "type": "EthereumEip712Signature2021",
                "proofPurpose": "assertionMethod",
                "verificationMethod": "did:polygon:0xIssuer#controller",
                "created": credential.issuanceDate,
                "jws": credential.signature
            }
        };

        const json = JSON.stringify(vc, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="import-modal-overlay">
                <div className="import-modal-card" style={{ textAlign: 'center' }}>
                    <div className="shimmer" style={{ height: 40, width: '60%', margin: '0 auto 20px' }}></div>
                    <div className="shimmer" style={{ height: 200, width: '100%', borderRadius: 12 }}></div>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="import-modal-overlay">
                <div className="import-modal-card">
                    <div className="error-banner">{error || "Student not found"}</div>
                    <button className="card-action" onClick={onClose} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        );
    }

    const hasCredential = student.status === "ACTIVE" && student.credentials && student.credentials.length > 0;
    const latestCred = hasCredential ? student.credentials[0] : null;

    return (
        <div className="import-modal-overlay">
            <div className="import-modal-card credential-preview-card" style={{ maxWidth: 500 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ margin: 0 }}>Credential Preview</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Icon.XCircle />
                    </button>
                </div>

                <div className="student-profile-mini" style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div className="td-avatar" style={{ width: 64, height: 64, fontSize: 24, background: 'var(--em-glow)' }}>
                        {student.name.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{student.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-sub)', fontFamily: 'var(--font-mono)' }}>{student.rollNumber}</div>
                        <div style={{ marginTop: 4 }}>
                            <span className={`pill ${student.status.toLowerCase()}`}>{student.status}</span>
                        </div>
                    </div>
                </div>

                {hasCredential ? (
                    <div className="vc-data-wrap">
                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Decentralized Identifier (DID)</div>
                        <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--em-light)', border: '1px solid rgba(16,185,129,0.2)', wordBreak: 'break-all', marginBottom: 20 }}>
                            {student.did}
                        </div>

                        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Cryptographic Proof</div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, border: '1px solid var(--border)', maxHeight: 120, overflowY: 'auto', marginBottom: 24 }}>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', whiteSpace: 'pre-wrap', lineBreak: 'anywhere' }}>
                                {latestCred.signature}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button onClick={onClose} style={{ minWidth: 60 }}>Done</button>
                            <button
                                onClick={() => {
                                    const shareUrl = `${window.location.origin}/share/${student.id}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    alert("Magic Link copied to clipboard!");
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)' }}
                            >
                                Copy Share Link
                            </button>
                            <button className="em-bg" onClick={downloadJson}>
                                <Icon.Download /> Download JSON
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Icon.LockBlue />
                        <p style={{ marginTop: 16, color: 'var(--text-sub)' }}>This identity has not been issued a credential yet.</p>
                        <button className="em-bg" onClick={onClose} style={{ width: '100%', marginTop: 24 }}>Close</button>
                    </div>
                )}
            </div>
        </div>
    );
};
