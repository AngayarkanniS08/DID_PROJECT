import React from "react";
import { Icon } from "./DashboardIcons";

const AVATAR_COLORS = [
    "linear-gradient(135deg,#34D399,#10B981)",
    "linear-gradient(135deg,#60A5FA,#3B82F6)",
    "linear-gradient(135deg,#FBBF24,#F59E0B)",
    "linear-gradient(135deg,#F472B6,#EC4899)",
    "linear-gradient(135deg,#A78BFA,#7C3AED)",
    "linear-gradient(135deg,#fb7185,#e11d48)",
];

const getAvatarGradient = (rollNo: string) => {
    if (!rollNo) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < rollNo.length; i++) {
        hash = rollNo.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

interface ActivityTableProps {
    rows: any[];
    onViewClick?: (row: any) => void;
    onViewAllClick?: () => void;
    selectable?: boolean;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

export function ActivityTable({
    rows,
    onViewClick,
    onViewAllClick,
    selectable,
    selectedIds = [],
    onSelectionChange
}: ActivityTableProps) {

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange?.(rows.map(r => r.id));
        } else {
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (e.target.checked) {
            onSelectionChange?.([...selectedIds, id]);
        } else {
            onSelectionChange?.(selectedIds.filter(sid => sid !== id));
        }
    };

    return (
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
                <div className="card-title">
                    <Icon.List />
                    Identity Directory
                </div>
                {onViewAllClick && <button className="card-action" onClick={onViewAllClick}>View All →</button>}
            </div>
            <div className="table-wrap" style={{ flex: 1, overflowY: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            {selectable && (
                                <th style={{ width: '40px', padding: '12px 10px 12px 24px' }}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={rows.length > 0 && selectedIds.length === rows.length}
                                    />
                                </th>
                            )}
                            <th style={selectable ? { paddingLeft: '10px' } : {}}>Student Name</th>
                            <th>Roll No</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={selectable ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    No students found. Use "Bulk Import" to add records.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, idx) => (
                                <tr key={row.id || row.rollNo || idx} className={selectedIds.includes(row.id) ? 'selected-row' : ''}>
                                    {selectable && (
                                        <td style={{ padding: '14px 10px 14px 24px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(row.id)}
                                                onChange={(e) => handleSelectRow(e, row.id)}
                                            />
                                        </td>
                                    )}
                                    <td style={selectable ? { paddingLeft: '10px' } : {}}>
                                        <div className="td-name">
                                            <div
                                                className="td-avatar"
                                                style={{ background: getAvatarGradient(row.rollNo) }}
                                            >
                                                {row.name?.charAt(0) || "?"}
                                            </div>
                                            {row.name}
                                        </div>
                                    </td>
                                    <td><span className="td-mono" style={{ color: "var(--text-sub)" }}>{row.rollNo}</span></td>
                                    <td>{row.department || "N/A"}</td>
                                    <td><span className={`pill ${row.status?.toLowerCase() || 'active'}`}>{row.status || 'Active'}</span></td>
                                    <td>
                                        <button className="view-btn" onClick={() => onViewClick?.(row)}>
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
