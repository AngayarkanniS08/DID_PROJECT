import React from "react";
import { Icon } from "./DashboardIcons";

interface Department {
    name: string;
    pct: number;
    color: string;
    gradFrom: string;
    gradTo: string;
}

interface DepartmentSplitProps {
    departments: Department[];
    totalIds: string;
}

export function DepartmentSplit({ departments, totalIds }: DepartmentSplitProps) {
    return (
        <div className="card card-right">
            <div className="card-header">
                <div className="card-title"><Icon.Pie />Department Split</div>
            </div>

            <div className="donut-wrap">
                <svg className="donut-svg" width="130" height="130" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
                    {/* Simplified segments for the mock — in real world, these would be calculated based on props */}
                    <circle className="donut-segment" cx="65" cy="65" r="48" fill="none"
                        stroke="#34D399" strokeWidth="16"
                        strokeDasharray="135.7 165.9" strokeDashoffset="75.4" strokeLinecap="round" />
                    <circle className="donut-segment" cx="65" cy="65" r="48" fill="none"
                        stroke="#FBBF24" strokeWidth="16"
                        strokeDasharray="90.5 211.1" strokeDashoffset="-60.3" strokeLinecap="round" />
                    <circle className="donut-segment" cx="65" cy="65" r="48" fill="none"
                        stroke="#60A5FA" strokeWidth="16"
                        strokeDasharray="75.4 226.2" strokeDashoffset="-150.8" strokeLinecap="round" />
                    <text className="donut-center-text" x="65" y="61">{totalIds}</text>
                    <text className="donut-center-sub" x="65" y="76">total IDs</text>
                </svg>
            </div>

            <div className="dept-section" style={{ paddingTop: 0 }}>
                {departments.map((dept) => (
                    <div className="dept-row" key={dept.name}>
                        <div className="dept-row-header">
                            <span className="dept-name">
                                <span className="dept-dot" style={{ background: dept.color }} />
                                {dept.name}
                            </span>
                            <span className="dept-pct" style={{ color: dept.color }}>{dept.pct}%</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{ width: `${dept.pct}%`, background: `linear-gradient(90deg,${dept.gradFrom},${dept.gradTo})` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
