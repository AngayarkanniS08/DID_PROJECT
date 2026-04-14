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
import { IssueIdentityModal } from "../../components/dashboard/IssueIdentityModal";
import { VerifyCredentialModal } from "../../components/dashboard/VerifyCredentialModal";
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
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

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

    const handleBatchEmail = async () => {
        if (selectedIds.length === 0) return;

        try {
            setIsIssuing(true); // Reuse loading state
            const report = await studentService.batchSendEmails(selectedIds);
            alert(`Emails sent! Success: ${report.success}, Failed: ${report.failed}, No Email: ${report.noEmail}, Not Active: ${report.notActive}`);
        } catch (error) {
            console.error("Batch email failed", error);
            alert("Failed to send emails. Check console.");
        } finally {
            setIsIssuing(false);
        }
    };

    const handleBatchRevoke = async () => {
        if (selectedIds.length === 0) return;

        if (window.confirm(`Are you sure you want to revoke ${selectedIds.length} credentials?`)) {
            try {
                setIsIssuing(true);
                for (const id of selectedIds) {
                    await studentService.revokeStudent(id);
                }
                alert(`Succesfully revoked ${selectedIds.length} credentials!`);
                loadDashboardData();
            } catch (error) {
                console.error("Batch revoke failed", error);
                alert("Failed to revoke some credentials.");
            } finally {
                setIsIssuing(false);
            }
        }
    };

    React.useEffect(() => {
        loadDashboardData();
    }, []);

    /* ── Metrics Logic ── */
    const totalStudentsCount = students.length || 0;
    
    /* ── SEARCH FILTER LOGIC ── */
    const filteredStudents = students.filter(s => {
        if (!searchValue) return true;
        const search = searchValue.toLowerCase();
        return (
            s.name?.toLowerCase().includes(search) ||
            s.rollNumber?.toLowerCase().includes(search) ||
            s.department?.toLowerCase().includes(search) ||
            s.status?.toLowerCase().includes(search)
        );
    });

    const displayStudents = activeNav === "users" 
        ? filteredStudents.filter(s => s.status !== 'REVOKED') 
        : activeNav === "revoked"
        ? filteredStudents.filter(s => s.status === 'REVOKED')
        : students.slice(0, 5);

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
            value: students.filter(s => s.status === 'REVOKED').length.toString(),
            colorClass: "rose",
            trendText: `${((students.filter(s => s.status === 'REVOKED').length / (totalStudentsCount || 1)) * 100).toFixed(1)}% loss rate`,
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
    const activityData = displayStudents.map(s => ({
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
                                    onIssue={() => setIsIssueModalOpen(true)}
                                    onImport={loadDashboardData} // Automatically refresh on success
                                    onVerify={() => setIsVerifyModalOpen(true)}
                                />
                                <DepartmentSplit departments={deptData} totalIds={totalStudentsCount.toString()} />
                            </div>
                        </div>

                        <div className="bottom-grid">
                            <MiniCard
                                title="Verification Rate"
                                value="100%"
                                valueColor="primary"
                                sub="Systems optimal"
                                TitleIcon={Icon.CheckOrange}
                            >
                                <div className="mini-progress-track">
                                    <div className="mini-progress-fill" style={{ width: "100%" }} />
                                </div>
                            </MiniCard>
                            <MiniCard
                                title="Avg. Issuance Time"
                                value="0.8s"
                                valueColor="primary"
                                sub="Real-time indexing"
                                TitleIcon={Icon.ClockOrange}
                            >
                                <div className="mini-bar-chart">
                                    {amberBars.map((bar, i) => (
                                        <div
                                            key={i}
                                            className="mini-bar"
                                            style={{ height: bar.h, background: `hsl(var(--primary)/${bar.op})` }}
                                        />
                                    ))}
                                </div>
                            </MiniCard>
                            <MiniCard title="Latest Students" value={null} TitleIcon={Icon.ShieldOrange}>
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
                                    User Directory ({displayStudents.length} {searchValue ? 'Found' : 'Active'})
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    {selectedIds.length > 0 && (
                                        <>
                                            <button
                                                className="btn-batch"
                                                onClick={handleBatchIssue}
                                                disabled={isIssuing}
                                            >
                                                <Icon.Plus />
                                                {isIssuing ? "Issuing..." : `Issue Credentials to ${selectedIds.length}`}
                                            </button>
                                            <button
                                                className="btn-batch"
                                                onClick={handleBatchEmail}
                                                disabled={isIssuing}
                                                style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', borderColor: 'rgba(59, 130, 246, 0.2)' }}
                                            >
                                                <Icon.Mail />
                                                {isIssuing ? "Sending..." : `Send Email to ${selectedIds.length}`}
                                            </button>
                                            <button
                                                className="btn-batch"
                                                onClick={handleBatchRevoke}
                                                disabled={isIssuing}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ff8080', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                            >
                                                <Icon.XCircle />
                                                {isIssuing ? "Revoking..." : `Revoke ${selectedIds.length}`}
                                            </button>
                                        </>
                                    )}
                                    <button className="card-action" onClick={loadDashboardData}>↻ Refresh</button>
                                </div>
                            </div>
                            <div className="table-wrap">
                                <ActivityTable
                                    rows={displayStudents.map(s => ({ ...s, rollNo: s.rollNumber, status: s.status || "UNISSUED", time: "Imported" }))}
                                    selectable={true}
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                    onViewClick={(row) => setPreviewStudentId(row.id)}
                                />
                            </div>
                        </div>
                    </div>
                ) : activeNav === "revoked" ? (
                    <div className="content full-page">
                        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <div className="card-header">
                                <div className="card-title" style={{ color: '#ff8080' }}>
                                    <Icon.XCircle />
                                    Revoked Credential Registry ({displayStudents.length})
                                </div>
                                <button className="card-action" onClick={loadDashboardData}>↻ Refresh</button>
                            </div>
                            <div className="table-wrap">
                                <ActivityTable
                                    rows={displayStudents.map(s => ({ ...s, rollNo: s.rollNumber, status: "REVOKED", time: "Revoked" }))}
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
            {isIssueModalOpen && (
                <IssueIdentityModal
                    onClose={() => setIsIssueModalOpen(false)}
                    onSuccess={() => loadDashboardData()}
                />
            )}


            {isVerifyModalOpen && (
                <VerifyCredentialModal
                    onClose={() => setIsVerifyModalOpen(false)}
                />
            )}

            {previewStudentId && (
                <CredentialPreviewModal
                    studentId={previewStudentId}
                    onClose={() => setPreviewStudentId(null)}
                />
            )}

        </div>
    );
}
