import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/onboarding/wizard.css';
import '../../components/onboarding/theme.css';
import ProgressBar from '../../components/onboarding/ProgressBar';
import Step1Identity from '../../components/onboarding/Step1Identity';
import Step2Structure from '../../components/onboarding/Step2Structure';
import Step3Security from '../../components/onboarding/Step3Security';
import Step4StudentData from '../../components/onboarding/Step4Studentdata';


const SetupWizardPage: React.FC = () => {
    console.log('SetupWizardPage Rendering...');

    const [currentStep, setCurrentStep] = useState(1);
    const theme = 'secureverify';


    const [formData, setFormData] = useState({
        // ── Step 1: Identity ──
        institutionName: '',
        shortCode: '',
        website: '',

        // ── Step 2: Structure ──
        departments: ['Computer Science', 'Mechanical', 'Commerce'],
        roles: ['Student'],
        accessZones: [] as string[],

        // ── Step 3: Security ──
        validity: '4y',
        autoRevoke: true,
        qrWatermark: true,
        expiryNotify: true,
        staffVerifierRoles: [] as string[],

        // ── Step 4: Student Data ──
        importMethod: 'csv',
        csvFile: '',
    });

    const handleNext = () => setCurrentStep((prev) => prev + 1);
    const handleBack = () => setCurrentStep((prev) => prev - 1);

    return (
        <div className={`wizard-layout ${theme}`}>
            {/* Aurora Background Layers */}
            <div className="aurora-canvas">
                <div className="aurora-blob one" />
                <div className="aurora-blob two" />
                <div className="aurora-blob three" />
            </div>


            {/* ── NAV ── */}
            <nav>
                <div className="logo">
                    <div className="logo-mark">
                        <svg viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 1.5L2 4v4c0 3.2 2.5 5.7 6 6.5 3.5-.8 6-3.3 6-6.5V4L8 1.5z"
                                fill="white"
                                opacity=".95"
                            />
                        </svg>
                    </div>
                    SecureVerify
                    <span className="nav-badge">Beta</span>
                </div>
                <button className="logout-btn">
                    <svg
                        width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                </button>

            </nav>

            {/* ── MAIN CARD ── */}
            <main>
                <div className="card">

                    <ProgressBar currentStep={currentStep} totalSteps={4} />

                    {/* ── Step 1: Identity ── */}
                    {currentStep === 1 && (
                        <Step1Identity
                            onNext={handleNext}
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {/* ── Step 2: Academic Structure + Campus Access Zones ── */}
                    {currentStep === 2 && (
                        <Step2Structure
                            onNext={handleNext}
                            onBack={handleBack}
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {/* ── Step 3: Security & Staff Role Config ── */}
                    {currentStep === 3 && (
                        <Step3Security
                            onNext={handleNext}
                            onBack={handleBack}
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {/* ── Step 4: Student Data Setup ── */}
                    {currentStep === 4 && (
                        <Step4StudentData
                            onBack={handleBack}
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                </div>
            </main>
        </div>
    );
};

export default SetupWizardPage;