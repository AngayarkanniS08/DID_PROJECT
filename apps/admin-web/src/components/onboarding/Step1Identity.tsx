import React from 'react';

interface Step1Props {
    onNext: () => void;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const Step1Identity: React.FC<Step1Props> = ({ onNext, formData, setFormData }) => {
    return (
        <>
            <div className="card-body">
                <div className="eyebrow">
                    <span className="eyebrow-dot"></span>
                    Identity Configuration
                </div>
                <h1>Setup Institutional Identity</h1>
                <p className="sub">Let's configure your university details. This will appear on all issued digital credentials.</p>

                <div className="form-group">
                    <label>Institution Name</label>
                    <input
                        type="text"
                        placeholder="e.g., Anna University"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                    />
                </div>

                <div className="row form-group">
                    <div>
                        <label>Short Code</label>
                        <input
                            type="text"
                            placeholder="AU-CHN"
                            value={formData.shortCode}
                            onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                        />
                    </div>
                    <div>
                        <label>Official Website</label>
                        <input
                            type="url"
                            placeholder="https://university.edu"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Upload Official Logo</label>
                    <div className="dropzone">
                        <div className="cloud-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="16 16 12 12 8 16" />
                                <line x1="12" y1="12" x2="12" y2="21" />
                                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                            </svg>
                        </div>
                        <div className="dropzone-title">Click or drag SVG / PNG here</div>
                        <div className="dropzone-sub">Max 2MB · High-res recommended</div>
                        <div className="dropzone-tags">
                            <span className="tag">SVG</span>
                            <span className="tag">PNG</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-footer">
                <div className="progress-hint">
                    <div className="dots">
                        <div className="dot active"></div>
                        <div className="dot inactive"></div>
                        <div className="dot inactive"></div>
                    </div>
                    1 of 3
                </div>
                <button className="next-btn" onClick={onNext}>
                    Next Step
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </>
    );
};

export default Step1Identity;
