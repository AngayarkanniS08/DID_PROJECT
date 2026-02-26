import React, { useState } from "react";
import Papa from "papaparse";
import { studentService } from "../../services/Student.service";

import { Icon } from "./DashboardIcons";
import "./ImportModal.css";

interface BulkImportProps {
    organizationId: string;
    onClose: () => void;
    onSuccess: (report: any) => void;
}

const BulkImportModal: React.FC<BulkImportProps> = ({ organizationId, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUploadClick = () => {
        if (!file) return;
        setIsUploading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                const h = header.trim().toLowerCase();
                if (h.includes('name')) return 'name';
                if (h.includes('roll') || h.includes('register')) return 'rollNumber';
                if (h.includes('dept') || h.includes('department')) return 'department';
                if (h.includes('email')) return 'email';
                return header.trim();
            },
            complete: async (results) => {
                try {
                    const studentsData = results.data;
                    const response = await studentService.bulkImport(organizationId, studentsData);

                    if (response.success) {
                        setResult(response.data);
                    } else {
                        setError(response.message || "Unknown error occurred on server");
                    }
                } catch (err: any) {
                    console.error("Failed to upload to backend", err);
                    setError(err?.response?.data?.message || "Connection error. Ensure backend is running.");
                } finally {
                    setIsUploading(false);
                }
            },
            error: (parseError) => {
                console.error("PapaParse Error:", parseError);
                setError("CSV Parse Error: " + parseError.message);
                setIsUploading(false);
            }
        });
    };

    if (result) {
        return (
            <div className="import-modal-overlay">
                <div className="import-modal-card success-state">
                    <div className="success-icon">✓</div>
                    <h2>Import Complete!</h2>
                    <div className="result-stats">
                        <div className="stat-item">
                            <span className="label">Successfully Inserted</span>
                            <span className="value">{result.insertedCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Duplicate Roll Numbers</span>
                            <span className="value">{result.duplicateRollNumbers}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Duplicate Emails</span>
                            <span className="value">{result.duplicateEmails}</span>
                        </div>
                        <div className="stat-item highlight">
                            <span className="label">Skipped (Missing Data)</span>
                            <span className="value">{result.incompleteRows}</span>
                        </div>
                    </div>
                    <button className="em-bg" onClick={() => { onSuccess(result); onClose(); }}>Finish</button>
                </div>
            </div>
        );
    }

    return (
        <div className="import-modal-overlay">
            <div className="import-modal-card">
                <h2>Upload Students CSV</h2>
                <p>Required headers: <b>name, rollNumber, email</b>. Optional: department</p>

                {error && <div className="error-banner">{error}</div>}

                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                <div className="modal-actions">
                    <button onClick={onClose} disabled={isUploading}>Cancel</button>
                    <button
                        onClick={handleUploadClick}
                        disabled={!file || isUploading}
                        className="em-bg"
                    >
                        {isUploading ? 'Uploading & Generating Keys...' : 'Upload Data'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface QuickActionsProps {
    onIssue: () => void;
    onImport: () => void;
    onVerify: () => void;
}

export function QuickActions({ onIssue, onImport, onVerify }: QuickActionsProps) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // TODO: Get this from Auth Context or Organization Context
    const organizationId = "demo-organization-id";

    return (
        <>
            <div className="card card-right">
                <div className="card-header">
                    <div className="card-title"><Icon.Bolt />Quick Actions</div>
                </div>
                <div className="quick-actions">
                    <button className="btn-issue" onClick={onIssue}>
                        <Icon.Plus /> Issue New ID
                    </button>
                    <button className="btn-import" onClick={() => setIsImportModalOpen(true)}>
                        <Icon.Upload /> Bulk Import CSV
                    </button>
                    <button className="btn-import" onClick={onVerify}>
                        <Icon.Verify /> Verify a Credential
                    </button>
                </div>
            </div>

            {isImportModalOpen && (
                <BulkImportModal
                    organizationId={organizationId}
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={(report) => {
                        console.log("Import Success:", report);
                        onImport();
                    }}
                />
            )}
        </>
    );
}
