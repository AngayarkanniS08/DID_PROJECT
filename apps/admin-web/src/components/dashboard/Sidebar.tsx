import React from "react";
import { Icon } from "./DashboardIcons";

export const NAV_ITEMS = [
    { id: "overview", label: "Overview", Icon: Icon.Overview, count: null, countClass: "" },
    { id: "users", label: "User Directory", Icon: Icon.Users, count: "1,248", countClass: "" },
    { id: "issuance", label: "Credential Issuance", Icon: Icon.File, count: "42", countClass: "amber" },
    { id: "logs", label: "Verification Logs", Icon: Icon.Lock, count: "840", countClass: "" },
    { id: "settings", label: "Settings", Icon: Icon.Settings, count: null, countClass: "" },
];

interface SidebarProps {
    activeNav: string;
    onNavChange: (id: string) => void;
    userCount?: string;
}

export function Sidebar({ activeNav, onNavChange, userCount }: SidebarProps) {
    const navItems = NAV_ITEMS.map(item =>
        item.id === "users" ? { ...item, count: userCount || item.count } : item
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon"><Icon.Shield /></div>
                <span className="logo-text">SecureVerify</span>
                <span className="logo-badge">v2.1</span>
            </div>

            <div className="nav-section">
                <div className="nav-label">Main Menu</div>
                {navItems.map((item) => (
                    <a
                        key={item.id}
                        className={`nav-item ${activeNav === item.id ? "active" : "inactive"}`}
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavChange(item.id); }}
                    >
                        <div className="nav-icon"><item.Icon /></div>
                        <span className="nav-text">{item.label}</span>
                        {item.count && (
                            <span className={`nav-count ${item.countClass}`}>{item.count}</span>
                        )}
                    </a>
                ))}
            </div>

            <div className="nav-section" style={{ marginTop: 8 }}>
                <div className="nav-label">Support</div>
                <a className="nav-item inactive" href="#" onClick={(e) => e.preventDefault()}>
                    <div className="nav-icon"><Icon.Help /></div>
                    <span className="nav-text">Help &amp; Docs</span>
                </a>
            </div>

            <div className="sidebar-bottom">
                <div className="sidebar-profile">
                    <div className="profile-avatar">AD</div>
                    <div className="profile-info">
                        <div className="profile-name">Admin User</div>
                        <div className="profile-role">Super Admin</div>
                    </div>
                    <Icon.Dots />
                </div>
                <button className="logout-btn">
                    <Icon.Logout />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
