import React, { useState } from 'react';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

// ── Campus Access Zone definitions ──
const ACCESS_ZONES = [
  {
    id: 'mainGate',
    label: 'Main Campus Gate',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'hostelEntry',
    label: 'Hostel Entry / Exit',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20M4 20V10l8-6 8 6v10" />
        <rect x="9" y="14" width="6" height="6" />
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Library Entry',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    id: 'examHall',
    label: 'Exam Hall',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'computerLabs',
    label: 'Computer Labs',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    id: 'mess',
    label: 'Mess / Cafeteria',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: 'sports',
    label: 'Sports Complex',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
      </svg>
    ),
  },
];

const Step2Structure: React.FC<Step2Props> = ({ onNext, onBack, formData, setFormData }) => {
  const [inputValue, setInputValue] = useState('');

  // ── Department handlers ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !formData.departments.includes(val)) {
        setFormData({ ...formData, departments: [...formData.departments, val] });
        setInputValue('');
      }
    }
  };

  const removeTag = (deptToRemove: string) => {
    setFormData({
      ...formData,
      departments: formData.departments.filter((d: string) => d !== deptToRemove),
    });
  };

  // ── Role handlers ──
  const toggleRole = (role: string) => {
    const hasRole = formData.roles.includes(role);
    const newRoles = hasRole
      ? formData.roles.filter((r: string) => r !== role)
      : [...formData.roles, role];
    setFormData({ ...formData, roles: newRoles });
  };

  // ── Access Zone handlers ──
  const toggleZone = (zoneId: string) => {
    const current: string[] = formData.accessZones || [];
    const updated = current.includes(zoneId)
      ? current.filter((z) => z !== zoneId)
      : [...current, zoneId];
    setFormData({ ...formData, accessZones: updated });
  };

  const selectedZones: string[] = formData.accessZones || [];
  const availableRoles = ['Student', 'Teaching Staff', 'Non-Teaching Staff'];

  return (
    <>
      <div className="card-body">
        {/* ── Eyebrow ── */}
        <div className="eyebrow">
          <span className="eyebrow-dot"></span>
          Academic Configuration
        </div>
        <h1>Academic Structure</h1>
        <p className="sub">
          Define the departments, roles, and campus access zones for your institution. This
          helps in categorizing and issuing scoped digital IDs.
        </p>

        {/* ══ DEPARTMENTS ══ */}
        <div className="form-group">
          <div className="form-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Departments
            <span className="hint">Press Enter to add</span>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g., Civil Engineering"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {inputValue.trim() && (
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'DM Mono', monospace", fontSize: '9.5px', color: '#34D399', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', padding: '2px 7px', borderRadius: '5px', pointerEvents: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                ↵ Add
              </span>
            )}
          </div>
          <div className="tags-row">
            {formData.departments.map((dept: string) => (
              <span key={dept} className="dept-tag">
                {dept}
                <button type="button" className="tag-remove" onClick={() => removeTag(dept)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="divider"></div>

        {/* ══ CAMPUS ACCESS ZONES ══ */}
        <div className="form-group">
          <div className="form-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Campus Access Zones
            <span className="hint">{selectedZones.length} selected</span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: 300, lineHeight: 1.5 }}>
            Select which campus zones students can access using their digital ID.
          </p>

          <div className="zones-grid">
            {ACCESS_ZONES.map((zone) => {
              const isSelected = selectedZones.includes(zone.id);
              return (
                <div
                  key={zone.id}
                  className={`zone-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleZone(zone.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === ' ' && toggleZone(zone.id)}
                >
                  <div className={`zone-check ${isSelected ? 'checked' : ''}`}>
                    {isSelected && (
                      <svg width="9" height="8" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1.5" stroke="#051510" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className={`zone-icon ${isSelected ? 'active' : ''}`}>
                    {zone.icon}
                  </div>
                  <span className="zone-label">{zone.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="divider"></div>

        {/* ══ DEFAULT ROLES ══ */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            Default Roles
            <span className="hint">{formData.roles.length} selected</span>
          </div>

          <div className="roles-list">
            {availableRoles.map((role) => {
              const isChecked = formData.roles.includes(role);
              return (
                <div
                  key={role}
                  className={`role-row ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  <div className="check-box">
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1.5" stroke="#051510" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="role-label">{role}</span>
                  <span className="role-badge">Active</span>
                </div>
              );
            })}
          </div>

          <p className="helper-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E435C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Roles define which ID templates are available for each member type.
          </p>
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
          <div className="progress-dots">
            <div className="pdot done"></div>
            <div className="pdot active"></div>
            <div className="pdot inactive"></div>
            <div className="pdot inactive"></div>
          </div>
          <span className="step-count">2 of 4</span>
        </div>
        <button className="next-btn" onClick={onNext}>
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

export default Step2Structure;