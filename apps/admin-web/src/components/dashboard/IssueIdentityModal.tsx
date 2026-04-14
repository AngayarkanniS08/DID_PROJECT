import React, { useState } from "react";
import { studentService } from "../../services/Student.service";
import { Icon } from "./DashboardIcons";
import "./ImportModal.css";

interface IssueIdentityModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const IssueIdentityModal: React.FC<IssueIdentityModalProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ name: "", rollNumber: "", email: "", department: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            // Organization ID is hardcoded for now or fetched from context
            await studentService.createStudent({ ...formData, organizationId: "demo-organization-id" });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create identity.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="import-modal-overlay">
            <div className="import-modal-card">
                <h2>Issue New Identity</h2>
                <p>Fill in the details to generate a new Decentralized ID.</p>
                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label style={{ color: 'var(--text-sub)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Full Name</label>
                        <input type="text" className="card-action" style={{ width: '100%', textAlign: 'left', background: 'hsl(0 0% 12%)' }}
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ color: 'var(--text-sub)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Roll Number</label>
                            <input type="text" className="card-action" style={{ width: '100%', textAlign: 'left', background: 'hsl(0 0% 12%)' }}
                                value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-sub)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Department</label>
                            <input type="text" className="card-action" style={{ width: '100%', textAlign: 'left', background: 'hsl(0 0% 12%)' }}
                                value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label style={{ color: 'var(--text-sub)', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Email Address</label>
                        <input type="email" className="card-action" style={{ width: '100%', textAlign: 'left', background: 'hsl(0 0% 12%)' }}
                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>

                    <div className="modal-actions" style={{ marginTop: '12px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" className="em-bg" disabled={isSubmitting}>
                            {isSubmitting ? "Generating..." : "Issue Identity"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
