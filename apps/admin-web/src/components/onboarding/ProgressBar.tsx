import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps = 4 }) => {
    return (
        <div className="steps-bar">
            {/* Step 1: Identity */}
            <div className={`step ${currentStep >= 1 ? 'active' : 'inactive'}`}>
                <div className="step-circle">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                </div>
                <div className="step-meta">
                    <span className="step-index">Step 01</span>
                    <span className="step-name">Identity</span>
                </div>
            </div>

            <div className="step-connector"></div>

            {/* Step 2: Structure */}
            <div className={`step ${currentStep >= 2 ? 'active' : 'inactive'}`}>
                <div className="step-circle">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                </div>
                <div className="step-meta">
                    <span className="step-index">Step 02</span>
                    <span className="step-name">Structure</span>
                </div>
            </div>

            <div className="step-connector"></div>

            {/* Step 3: Security */}
            <div className={`step ${currentStep >= 3 ? 'active' : 'inactive'}`}>
                <div className="step-circle">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
                <div className="step-meta">
                    <span className="step-index">Step 03</span>
                    <span className="step-name">Security</span>
                </div>
            </div>

            <div className="step-connector"></div>

            {/* Step 4: Students */}
            <div className={`step ${currentStep >= 4 ? 'active' : 'inactive'}`}>
                <div className="step-circle">
                    <svg viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                </div>
                <div className="step-meta">
                    <span className="step-index">Step 04</span>
                    <span className="step-name">Students</span>
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;
