import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupService } from '../../services/setup.service';

interface Step4Props {
    onBack: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

// ── Import method definitions ──
const IMPORT_METHODS = [
    {
        id: 'csv',
        recommended: true,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
            </svg>
        ),
        title: 'Upload CSV File',
        description: 'Add students in bulk using our Excel template. Fastest way to onboard hundreds of students at once.',
        tags: ['Recommended', 'Bulk Upload'],
        tagColors: ['em', 'blue'],
        actionLabel: 'Download Template →',
    },
    {
        id: 'manual',
        recommended: false,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
        ),
        title: 'Manual Entry',
        description: 'I will add students one by one later. Best for small institutions or pilot programmes.',
        tags: ['Flexible'],
        tagColors: ['amber'],
        actionLabel: null,
    },
    {
        id: 'erp',
        recommended: false,
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M7 8h4M7 11h2" />
                <circle cx="17" cy="9" r="2" />
                <path d="M17 11v2" />
            </svg>
        ),
        title: 'ERP Integration',
        description: 'Connect via API to sync student records automatically. Designed for enterprise clients with existing ERP systems.',
        tags: ['Enterprise', 'API'],
        tagColors: ['rose', 'blue'],
        actionLabel: 'View API Docs →',
    },
];

const TAG_STYLES: Record<string, { color: string; bg: string; border: string }> = {
    em: { color: 'var(--em-light)', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.22)' },
    amber: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' },
    blue: { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', border: 'rgba(96,165,250,0.22)' },
    rose: { color: 'var(--rose)', bg: 'rgba(244,63,94,0.09)', border: 'rgba(244,63,94,0.20)' },
};

const VALIDITY_LABELS: Record<string, string> = {
    '4y': '4 Years',
    '3y': '3 Years',
    '2y': '2 Years',
    '1y': '1 Year',
    'custom': 'Custom',
};

const Step4StudentData: React.FC<Step4Props> = ({ onBack, formData, setFormData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const selectedMethod: string = formData.importMethod || 'csv';

    const selectMethod = (id: string) => {
        setFormData({ ...formData, importMethod: id });
    };

    // ── Confetti ──
    const launchConfetti = () => {
        const colors = ['#34D399', '#10B981', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];
        for (let i = 0; i < 65; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.cssText = `
        left:${Math.random() * 100}vw;
        top:-10px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        width:${6 + Math.random() * 8}px;
        height:${6 + Math.random() * 8}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '3px'};
        animation-duration:${1.5 + Math.random() * 2}s;
        animation-delay:${Math.random() * 0.6}s;
      `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        }
    };

    // ── Final submit — all formData goes here ──
    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await setupService.saveOrganization(formData);
            launchConfetti();
            setTimeout(() => setShowSuccess(true), 300);
        } catch (error) {
            console.error('Setup submission error:', error);
            alert('Failed to save configuration. Please ensure the backend is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* ══ SUCCESS OVERLAY ══ */}
            <div className={`success-overlay ${showSuccess ? 'visible' : ''}`}>
                <div className="success-card">
                    <div className="success-icon-ring">
                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <div className="success-title">Setup Complete 🎉</div>
                    </div>
                    <p className="success-sub">
                        Your institution has been configured on SecureVerify. You're ready to start issuing
                        tamper-proof digital credentials.
                    </p>
                    <div className="success-pills">
                        <span className="spill">Identity ✓</span>
                        <span className="spill">Structure ✓</span>
                        <span className="spill">Security ✓</span>
                        <span className="spill">Students ✓</span>
                    </div>
                    <button className="success-close" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard →
                    </button>
                </div>
            </div>

            {/* ══ CARD BODY ══ */}
            <div className="card-body">

                {/* Eyebrow */}
                <div className="eyebrow">
                    <span className="eyebrow-dot"></span>
                    Student Onboarding
                    <span className="final-badge">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Final Step
                    </span>
                </div>

                <h1>Student Data Setup</h1>
                <p className="sub">
                    Choose how you'd like to bring your students onto SecureVerify. You can always change
                    this later from your dashboard.
                </p>

                {/* ══ METHOD SELECTION CARDS ══ */}
                <div className="import-methods-grid">
                    {IMPORT_METHODS.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        return (
                            <div
                                key={method.id}
                                className={`import-method-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => selectMethod(method.id)}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => e.key === ' ' && selectMethod(method.id)}
                            >
                                {/* Top row: radio + recommended badge */}
                                <div className="method-card-top">
                                    <div className={`method-radio ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <div className="method-radio-dot" />}
                                    </div>
                                    {method.recommended && (
                                        <span className="method-recommended-badge">★ Recommended</span>
                                    )}
                                </div>

                                {/* Icon */}
                                <div className={`method-icon-wrap ${isSelected ? 'active' : ''}`}>
                                    {method.icon}
                                </div>

                                {/* Text */}
                                <div className="method-title">{method.title}</div>
                                <p className="method-desc">{method.description}</p>

                                {/* Tags */}
                                <div className="method-tags">
                                    {method.tags.map((tag, i) => {
                                        const s = TAG_STYLES[method.tagColors[i]] || TAG_STYLES.em;
                                        return (
                                            <span
                                                key={tag}
                                                className="method-tag"
                                                style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
                                            >
                                                {tag}
                                            </span>
                                        );
                                    })}
                                </div>

                                {/* Action link */}
                                {method.actionLabel && isSelected && (
                                    <button className="method-action-link">
                                        {method.actionLabel}
                                    </button>
                                )}

                                {/* Selected glow overlay */}
                                {isSelected && <div className="method-selected-glow" />}
                            </div>
                        );
                    })}
                </div>

                {/* ══ INLINE CSV UPLOAD (appears when CSV is selected) ══ */}
                {selectedMethod === 'csv' && (
                    <div className="csv-upload-zone">
                        <div className="csv-upload-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <p className="csv-upload-label">Drop your CSV here, or <span className="csv-upload-browse">browse files</span></p>
                        <p className="csv-upload-hint">Supports .csv and .xlsx · Max 10MB · Up to 5,000 students</p>
                        <input
                            type="file"
                            accept=".csv,.xlsx"
                            className="csv-file-input"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setFormData({ ...formData, csvFile: file.name });
                            }}
                        />
                        {formData.csvFile && (
                            <div className="csv-file-selected">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {formData.csvFile}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ ERP NOTE (appears when ERP is selected) ══ */}
                {selectedMethod === 'erp' && (
                    <div className="erp-note-card">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '13.5px', color: 'var(--text)', marginBottom: '4px' }}>
                                    API credentials will be generated after setup
                                </div>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-sub)', fontWeight: 300, lineHeight: 1.55 }}>
                                    Your unique API key and webhook endpoint will be available in the dashboard under
                                    Settings → Integrations. Our team will reach out within 24 hours to assist with ERP connection.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ SETUP SUMMARY ══ */}
                <div style={{ marginTop: '24px' }}>
                    <div className="form-label" style={{ marginBottom: '10px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                        Final Setup Summary
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span className="summary-label">Institution</span>
                        <span className="summary-value">{formData?.institutionName || 'Not Set'}</span>
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                        </div>
                        <span className="summary-label">Departments</span>
                        <span className="summary-value">{formData?.departments?.length || 0} added</span>
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <span className="summary-label">Access Zones</span>
                        <span className="summary-value">{formData?.accessZones?.length || 0} selected</span>
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span className="summary-label">ID Validity</span>
                        <span className="summary-value">{VALIDITY_LABELS[formData?.validity || '4y'] || formData?.validity}</span>
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M20 21a8 8 0 10-16 0" />
                            </svg>
                        </div>
                        <span className="summary-label">Verifier Staff Roles</span>
                        <span className="summary-value">{formData?.staffVerifierRoles?.length || 0} configured</span>
                    </div>

                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <span className="summary-label">Import Method</span>
                        <span className="summary-value capitalize">
                            {{ csv: 'CSV Upload', manual: 'Manual Entry', erp: 'ERP Integration' }[selectedMethod] || 'CSV Upload'}
                        </span>
                    </div>
                </div>

            </div>

            {/* ══ FOOTER ══ */}
            <div className="card-footer">
                <div className="footer-left">
                    <button className="back-btn" onClick={onBack}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Back
                    </button>
                    <div className="pdots-wrap">
                        <div className="pdot done"></div>
                        <div className="pdot done"></div>
                        <div className="pdot done"></div>
                        <div className="pdot active"></div>
                    </div>
                    <span className="step-count">4 of 4</span>
                </div>

                <button
                    className="complete-btn"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="btn-spinner" />
                            Saving…
                        </>
                    ) : (
                        <>
                            Complete Setup
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </>
    );
};

export default Step4StudentData;