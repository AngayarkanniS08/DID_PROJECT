import React, { useState } from 'react';

interface Step3Props {
    onNext: () => void;
    onBack: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const validityMap: Record<string, string> = {
    '4y': '4 Years (Standard B.Tech)',
    '3y': '3 Years (B.Sc / B.Com)',
    '2y': '2 Years (M.Tech / MBA)',
    '1y': '1 Year (Diploma / Certificate)',
    'custom': 'Custom Duration',
};

const summaryMap: Record<string, string> = {
    '4y': '4 Years',
    '3y': '3 Years',
    '2y': '2 Years',
    '1y': '1 Year',
    'custom': 'Custom',
};

// ── Staff roles who will use the Verifier App ──
const STAFF_VERIFIER_ROLES = [
    {
        id: 'securityGuards',
        label: 'Security Guards',
        sublabel: 'Gate Access',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
    },
    {
        id: 'hostelWardens',
        label: 'Hostel Wardens',
        sublabel: 'Night Attendance',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h20M4 20V10l8-6 8 6v10" />
                <rect x="9" y="14" width="6" height="6" />
            </svg>
        ),
    },
    {
        id: 'examInvigilators',
        label: 'Exam Invigilators',
        sublabel: 'Hall Ticket Verification',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
    },
    {
        id: 'facultyLabAssistants',
        label: 'Faculty / Lab Assistants',
        sublabel: 'Lab & Classroom Access',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        id: 'librarians',
        label: 'Librarians',
        sublabel: 'Library Entry Verification',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
        ),
    },
];

const Step3Security: React.FC<Step3Props> = ({ onNext, onBack, formData, setFormData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Toggle issuance policy ──
    const toggleSetting = (key: string) => {
        setFormData((prev: any) => ({ ...prev, [key]: !prev[key] }));
    };

    // ── Toggle staff verifier role ──
    const toggleStaffRole = (roleId: string) => {
        const current: string[] = formData.staffVerifierRoles || [];
        const updated = current.includes(roleId)
            ? current.filter((r: string) => r !== roleId)
            : [...current, roleId];
        setFormData({ ...formData, staffVerifierRoles: updated });
    };

    const selectedStaffRoles: string[] = formData.staffVerifierRoles || [];
    const activeRolesCount = formData?.roles?.length || 0;

    return (
        <>
            <div className="card-body">
                <div className="eyebrow">
                    <span className="eyebrow-dot"></span>
                    Security Rules
                </div>
                <h1>Security &amp; Issuance</h1>
                <p className="sub">
                    Configure how digital credentials behave, expire, and get revoked. These rules apply globally across all issued IDs.
                </p>

                {/* ══ VALIDITY DROPDOWN ══ */}
                <div className="form-group">
                    <div className="form-label">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        Default Student ID Validity
                    </div>
                    <div className="custom-select-wrap">
                        <select
                            value={formData?.validity || '4y'}
                            onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                        >
                            {Object.entries(validityMap).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <span className="select-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </span>
                    </div>
                    <div className="validity-hints">
                        {(['4y', '3y', '2y', '1y'] as const).map((key) => (
                            <span
                                key={key}
                                className={`hint-pill ${formData?.validity === key ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, validity: key })}
                            >
                                {{ '4y': 'B.Tech — 4yr', '3y': 'B.Sc — 3yr', '2y': 'M.Tech — 2yr', '1y': 'Diploma — 1yr' }[key]}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="divider"></div>

                {/* ══ ISSUANCE POLICIES ══ */}
                <div className="form-label" style={{ marginBottom: '14px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.07 4.93A10 10 0 1 0 4.93 19.07" />
                        <path d="M20.66 16a9.95 9.95 0 0 1-1.59 2.07" />
                    </svg>
                    Issuance Policies
                    <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: '9px', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                        Toggle to enable
                    </span>
                </div>

                {/* Setting Card: Auto-Revocation */}
                <div className={`setting-card ${formData?.autoRevoke !== false ? 'on' : 'off'}`}>
                    <div className="setting-text">
                        <div className="setting-title">Auto-Revocation</div>
                        <div className="setting-desc">Automatically revoke student credentials upon graduation or status change.</div>
                        <div className="setting-meta">
                            <span className="setting-tag em">Recommended</span>
                            <span className="setting-tag warn">Irreversible</span>
                        </div>
                    </div>
                    <div className="toggle-wrap">
                        <label className="toggle">
                            <input type="checkbox" checked={formData?.autoRevoke !== false} onChange={() => toggleSetting('autoRevoke')} />
                            <div className="toggle-track"></div>
                            <div className="toggle-thumb"></div>
                        </label>
                        <span className="toggle-state" style={{ color: formData?.autoRevoke !== false ? 'var(--em-light)' : 'var(--text-muted)' }}>
                            {formData?.autoRevoke !== false ? 'On' : 'Off'}
                        </span>
                    </div>
                </div>

                {/* Setting Card: QR Watermark */}
                <div className={`setting-card ${formData?.qrWatermark !== false ? 'on' : 'off'}`}>
                    <div className="setting-text">
                        <div className="setting-title">QR Watermark Signing</div>
                        <div className="setting-desc">Embed a cryptographic signature into every issued QR code for tamper detection.</div>
                        <div className="setting-meta">
                            <span className="setting-tag em">Security</span>
                        </div>
                    </div>
                    <div className="toggle-wrap">
                        <label className="toggle">
                            <input type="checkbox" checked={formData?.qrWatermark !== false} onChange={() => toggleSetting('qrWatermark')} />
                            <div className="toggle-track"></div>
                            <div className="toggle-thumb"></div>
                        </label>
                        <span className="toggle-state" style={{ color: formData?.qrWatermark !== false ? 'var(--em-light)' : 'var(--text-muted)' }}>
                            {formData?.qrWatermark !== false ? 'On' : 'Off'}
                        </span>
                    </div>
                </div>

                {/* Setting Card: Expiry Notifications */}
                <div className={`setting-card ${formData?.expiryNotify ? 'on' : 'off'}`}>
                    <div className="setting-text">
                        <div className="setting-title">Expiry Notifications</div>
                        <div className="setting-desc">Send email alerts to students 30 days before their credential expires.</div>
                        <div className="setting-meta">
                            <span className="setting-tag warn">Email Required</span>
                        </div>
                    </div>
                    <div className="toggle-wrap">
                        <label className="toggle">
                            <input type="checkbox" checked={!!formData?.expiryNotify} onChange={() => toggleSetting('expiryNotify')} />
                            <div className="toggle-track"></div>
                            <div className="toggle-thumb"></div>
                        </label>
                        <span className="toggle-state" style={{ color: formData?.expiryNotify ? 'var(--em-light)' : 'var(--text-muted)' }}>
                            {formData?.expiryNotify ? 'On' : 'Off'}
                        </span>
                    </div>
                </div>

                <div className="divider"></div>

                {/* ══ STAFF & ROLE CONFIGURATION ══ */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <div className="form-label" style={{ marginBottom: '6px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M20 21a8 8 0 10-16 0" />
                        </svg>
                        Who will use the Verifier App?
                        <span className="hint">{selectedStaffRoles.length} selected</span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 300, lineHeight: 1.55 }}>
                        Select the staff roles that will scan and verify student digital IDs on campus.
                    </p>

                    <div className="staff-roles-list">
                        {STAFF_VERIFIER_ROLES.map((staffRole) => {
                            const isChecked = selectedStaffRoles.includes(staffRole.id);
                            return (
                                <div
                                    key={staffRole.id}
                                    className={`staff-role-row ${isChecked ? 'checked' : ''}`}
                                    onClick={() => toggleStaffRole(staffRole.id)}
                                    role="checkbox"
                                    aria-checked={isChecked}
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === ' ' && toggleStaffRole(staffRole.id)}
                                >
                                    <div className={`check-box ${isChecked ? 'checked' : ''}`}>
                                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                            <path d="M1 4.5L4 7.5L10 1.5" stroke="#051510" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className={`staff-icon ${isChecked ? 'active' : ''}`}>
                                        {staffRole.icon}
                                    </div>
                                    <div className="staff-role-text">
                                        <span className="staff-role-label">{staffRole.label}</span>
                                        <span className="staff-role-sublabel">{staffRole.sublabel}</span>
                                    </div>
                                    {isChecked && <span className="role-badge" style={{ marginLeft: 'auto' }}>Enabled</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ══ CONFIG SUMMARY ══ */}
                <div style={{ marginTop: '24px' }}>
                    <div className="form-label" style={{ marginBottom: '10px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                        </svg>
                        Configuration Summary
                    </div>
                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <span className="summary-label">ID Validity Duration</span>
                        <span className="summary-value">{summaryMap[formData?.validity || '4y']}</span>
                    </div>
                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                            </svg>
                        </div>
                        <span className="summary-label">Active roles</span>
                        <span className="summary-value">{activeRolesCount} Role{activeRolesCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="summary-row">
                        <div className="summary-icon em">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" />
                            </svg>
                        </div>
                        <span className="summary-label">Verifier staff roles</span>
                        <span className="summary-value">{selectedStaffRoles.length} Role{selectedStaffRoles.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* ── FOOTER ── */}
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
                        <div className="pdot active"></div>
                        <div className="pdot inactive"></div>
                    </div>
                    <span className="step-count">3 of 4</span>
                </div>
                <button className="next-btn" onClick={onNext} disabled={isSubmitting}>
                    Next Step
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default Step3Security;