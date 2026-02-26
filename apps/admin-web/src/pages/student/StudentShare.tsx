import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { studentService } from "../../services/Student.service";
import { Icon } from "../../components/dashboard/DashboardIcons";
import "./StudentShare.css";

export const StudentSharePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStudent = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await studentService.getStudentById(id);
                setStudent(data);
            } catch (err) {
                console.error("Error loading student", err);
                setError("Credential not found or expired.");
            } finally {
                setLoading(false);
            }
        };
        loadStudent();
    }, [id]);

    if (loading) return (
        <div className="share-root loading">
            <div className="card-shimmer"></div>
            <p>Verifying Identity Record...</p>
        </div>
    );

    if (error || !student || student.status !== "ACTIVE") return (
        <div className="share-root error">
            <div className="error-icon">⚠️</div>
            <h1>Invalid Credential</h1>
            <p>{error || "This ID has not been activated by the institution yet."}</p>
            <button onClick={() => navigate("/")}>Go Back</button>
        </div>
    );

    // This is the data we encode in the QR
    const qrData = JSON.stringify({
        sub: student.did,
        name: student.name,
        roll: student.rollNumber,
        iss: "SecureVerify_Institution",
        sig: student.credentials?.[0]?.signature || "UN_SIGNED"
    });

    return (
        <div className="share-root">
            <div className="id-card-container">
                {/* --- FRONT OF CARD --- */}
                <div className="id-card-premium">
                    <div className="card-glass-glow"></div>

                    <div className="card-header">
                        <div className="inst-logo">
                            <Icon.Shield />
                            <span>SECUREVERIFY UNIV.</span>
                        </div>
                        <div className="chip"></div>
                    </div>

                    <div className="card-body">
                        <div className="profile-area">
                            <div className="avatar-frame">
                                <div className="avatar-main" style={{
                                    background: `linear-gradient(135deg, var(--em-light), var(--em))`
                                }}>
                                    {student.name.charAt(0)}
                                </div>
                                <div className="status-badge">ACTIVE</div>
                            </div>
                        </div>

                        <div className="info-area">
                            <h1>{student.name}</h1>
                            <p className="dept">{student.department || "General Engineering"}</p>

                            <div className="meta-grid">
                                <div className="meta-item">
                                    <label>ROLL NO</label>
                                    <span>{student.rollNumber}</span>
                                </div>
                                <div className="meta-item">
                                    <label>ISSUED ON</label>
                                    <span>{new Date(student.credentials?.[0]?.issuanceDate || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        <div className="did-tag">
                            <label>DID</label>
                            <span>{student.did.substring(0, 24)}...</span>
                        </div>
                        <div className="nfc-icon">((•))</div>
                    </div>
                </div>

                {/* --- QR ACTION AREA --- */}
                <div className="qr-reveal-area">
                    <div className="qr-container">
                        <QRCodeSVG
                            value={qrData}
                            size={180}
                            bgColor={"transparent"}
                            fgColor={"#10b981"}
                            level={"M"}
                            includeMargin={false}
                        />
                    </div>
                    <div className="qr-hint">
                        <h3>Institutional Pass</h3>
                        <p>Scan this QR at campus gates or at a Verifier kiosk to authenticate.</p>
                    </div>
                </div>

                <div className="share-actions">
                    <button className="btn-wallet">
                        <Icon.LockBlue />
                        Save to Mobile Wallet
                    </button>
                    <p className="secure-tag">🔐 End-to-End Cryptographically Signed</p>
                </div>
            </div>
        </div>
    );
};
