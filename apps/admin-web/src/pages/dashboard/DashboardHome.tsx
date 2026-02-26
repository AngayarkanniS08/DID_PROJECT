/**
 * SecureVerify Admin Dashboard
 * File: DashboardHome.tsx
 * 
 * Refactored: Child components extracted to src/components/dashboard/
 */

import React, { useState } from "react";
import "./DashboardHome.css";

// Child Components
import { Sidebar } from "../../components/dashboard/Sidebar";
import { Header } from "../../components/dashboard/Header";
import { StatCard, MiniCard } from "../../components/dashboard/Stats";
import { ActivityTable } from "../../components/dashboard/ActivityTable";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { CredentialPreviewModal } from "../../components/dashboard/CredentialModal";
import { DepartmentSplit } from "../../components/dashboard/Charts";
import { SystemLogs } from "../../components/dashboard/Logs";
import { Icon } from "../../components/dashboard/DashboardIcons";
import { studentService } from "../../services/Student.service";

export function Dashboard() {
    /* ── Active nav ── */
    const [activeNav, setActiveNav] = useState("overview");

    /* ── State for Real Data ── */
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isIssuing, setIsIssuing] = useState(false);
    const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

    /* ── Data Fetching ── */
    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            const data = await studentService.getAllStudents();
            setStudents(Array.isArray(data) ? data : []);
            setSelectedIds([]); // Clear selection on refresh
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBatchIssue = async () => {
        if (selectedIds.length === 0) return;

        try {
            setIsIssuing(true);
            const report = await studentService.batchIssue(selectedIds);
            alert(`Succesfully issued ${report.success} credentials!`);
            loadDashboardData(); // Refresh to show new status
        } catch (error) {
            console.error("Batch issue failed", error);
            alert("Failed to issue credentials. Check console for details.");
        } finally {
            setIsIssuing(false);
        }
    };

    React.useEffect(() => {
        loadDashboardData();
    }, []);

    /* ── Metrics Logic ── */
    const totalStudentsCount = students.length || 0;

    // Map stats dynamically
    const statsData = [
        {
            id: "active-ids",
            title: "Total Identities",
            value: totalStudentsCount.toLocaleString(),
            colorClass: "em",
            trendText: "Database sync active",
            trendDir: "up" as const,
            sparkHeights: [40, 55, 70, 50, 85, 65, 100],
            IconComponent: Icon.IdCard,
        },
        {
            id: "pending",
            title: "Pending Issuance",
            value: students.filter(s => s.status === 'UNISSUED' || !s.status).length.toString(),
            colorClass: "amber",
            trendText: "Waiting in queue",
            trendDir: "warn" as const,
            sparkHeights: [70, 90, 55, 80, 45, 60, 100],
            IconComponent: Icon.Clock,
        },
        {
            id: "revoked",
            title: "Revoked IDs",
            value: "0",
            colorClass: "rose",
            trendText: "0% loss rate",
            trendDir: "down" as const,
            sparkHeights: [80, 60, 45, 75, 30, 50, 40],
            IconComponent: Icon.XCircle,
        },
        {
            id: "scans",
            title: "Recent Identifiers",
            value: students.length > 0 ? students[0].rollNumber : "None",
            colorClass: "blue",
            trendText: "Latest Entry",
            trendDir: "neu" as const,
            sparkHeights: [30, 55, 75, 60, 85, 70, 100],
            IconComponent: Icon.Activity,
        },
    ];

    // Prepare Activity Table Data (Show latest 5)
    // Map backend keys (rollNumber) to frontend keys (rollNo) for ActivityTable compatibility
    const activityData = students.slice(0, 5).map(s => ({
        ...s,
        rollNo: s.rollNumber,
        status: s.status || "UNISSUED", // Use real backend status
        time: "Just now"
    }));

    const deptData = [
        { name: "Computer Science", pct: 45, color: "#34D399", gradFrom: "#34D399", gradTo: "#10B981" },
        { name: "Mechanical", pct: 30, color: "#FBBF24", gradFrom: "#FBBF24", gradTo: "#F59E0B" },
        { name: "Commerce", pct: 25, color: "#60A5FA", gradFrom: "#60A5FA", gradTo: "#3B82F6" },
    ];

    const logsData = students.slice(0, 3).map(s => ({
        type: "issued" as const,
        bold: "Record Sync",
        message: `${s.name} (${s.rollNumber})`,
        time: "Now"
    }));

    const amberBars = [
        { h: "60%", op: "0.3" }, { h: "80%", op: "0.4" },
        { h: "40%", op: "0.3" }, { h: "100%", op: "0.6" },
        { h: "55%", op: "0.3" }, { h: "70%", op: "0.4" },
    ];

    return (
        <div className="dashboard-root">
            <Sidebar activeNav={activeNav} onNavChange={setActiveNav} userCount={totalStudentsCount.toString()} />

            <div className="main">
                <Header searchValue={searchValue} onSearchChange={setSearchValue} />

                {activeNav === "overview" ? (
                    <div className="content">
                        <div className="stats-grid">
                            {statsData.map((stat) => (
                                <StatCard key={stat.id} {...stat} />
                            ))}
                        </div>

                        <div className="middle-grid">
                            <ActivityTable
                                rows={activityData}
                                onViewClick={(row) => setPreviewStudentId(row.id)}
                                onViewAllClick={() => setActiveNav("users")}
                            />

                            <div className="right-col">
                                <QuickActions
                                    onIssue={() => console.log("Issue New ID")}
                                    onImport={loadDashboardData} // Automatically refresh on success
                                    onVerify={() => console.log("Verify Credential")}
                                />
                                <DepartmentSplit departments={deptData} totalIds={totalStudentsCount.toString()} />
                            </div>
                        </div>

                        <div className="bottom-grid">
                            <MiniCard
                                title="Verification Rate"
                                value="100%"
                                valueColor="em-light"
                                sub="Systems optimal"
                                TitleIcon={Icon.Check}
                            >
                                <div className="mini-progress-track">
                                    <div className="mini-progress-fill" style={{ width: "100%" }} />
                                </div>
                            </MiniCard>
                            <MiniCard
                                title="Avg. Issuance Time"
                                value="0.8s"
                                valueColor="amber"
                                sub="Real-time indexing"
                                TitleIcon={Icon.ClockAmber}
                            >
                                <div className="mini-bar-chart">
                                    {amberBars.map((bar, i) => (
                                        <div
                                            key={i}
                                            className="mini-bar"
                                            style={{ height: bar.h, background: `rgba(245,158,11,${bar.op})` }}
                                        />
                                    ))}
                                </div>
                            </MiniCard>
                            <MiniCard title="Latest Students" value={null} TitleIcon={Icon.LockBlue}>
                                <SystemLogs logs={logsData} />
                            </MiniCard>
                        </div>
                    </div>
                ) : activeNav === "users" ? (
                    <div className="content full-page">
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">
                                    <Icon.Users />
                                    User Directory ({students.length} Total)
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    {selectedIds.length > 0 && (
                                        <button
                                            className="btn-batch"
                                            onClick={handleBatchIssue}
                                            disabled={isIssuing}
                                        >
                                            <Icon.Plus />
                                            {isIssuing ? "Issuing..." : `Issue Credentials to ${selectedIds.length}`}
                                        </button>
                                    )}
                                    <button className="card-action" onClick={loadDashboardData}>↻ Refresh</button>
                                </div>
                            </div>
                            <div className="table-wrap">
                                <ActivityTable
                                    rows={students.map(s => ({ ...s, rollNo: s.rollNumber, status: s.status || "UNISSUED", time: "Imported" }))}
                                    selectable={true}
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                    onViewClick={(row) => setPreviewStudentId(row.id)}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="content">
                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">{activeNav.toUpperCase()}</div>
                            </div>
                            <p style={{ padding: 20 }}>This section is currently under construction.</p>
                        </div>
                    </div>
                )}
            </div>

            {previewStudentId && (
                <CredentialPreviewModal
                    studentId={previewStudentId}
                    onClose={() => setPreviewStudentId(null)}
                />
            )}
        </div>
    );
}
