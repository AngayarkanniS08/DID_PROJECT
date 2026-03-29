import React from "react";
import { Icon } from "./DashboardIcons";

interface HeaderProps {
    searchValue: string;
    onSearchChange: (val: string) => void;
}

export function Header({ searchValue, onSearchChange }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-greeting">
                <h2>Welcome back, Admin 👋</h2>
                <p>
                    Here is what is happening today.{" "}
                    <span className="live-dot" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "hsl(var(--primary-foreground))" }}>
                        Live
                    </span>
                </p>
            </div>
            <div className="header-right">
                <div className="search-bar">
                    <Icon.Search />
                    <input
                        type="text"
                        placeholder="Search students or IDs…"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
                <button className="icon-btn" aria-label="Notifications">
                    <Icon.Bell />
                    <span className="notif-dot" />
                </button>
                <button className="icon-btn" aria-label="Calendar">
                    <Icon.Calendar />
                </button>
                <div className="user-avatar" title="Admin User">AD</div>
            </div>
        </header>
    );
}
