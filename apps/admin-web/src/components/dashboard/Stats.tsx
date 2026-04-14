import React from "react";
import { Icon } from "./DashboardIcons";

interface StatCardProps {
    title: string;
    value: string;
    colorClass: string;
    trendText: string;
    trendDir: "up" | "down" | "warn" | "neu";
    sparkHeights: number[];
    IconComponent: React.ComponentType;
}

export function StatCard({ title, value, colorClass, trendText, trendDir, sparkHeights, IconComponent }: StatCardProps) {
    const trendClass = ({ up: "trend-up", down: "trend-down", warn: "trend-warn", neu: "trend-neu" } as any)[trendDir] || "trend-up";
    const pillClass = ({ up: "up", down: "down", warn: "warn", neu: "neu" } as any)[trendDir] || "up";

    return (
        <div className={`stat-card ${colorClass}`}>
            <div className="stat-header">
                <span className="stat-label">{title}</span>
                <div className={`stat-icon ${colorClass}`}>
                    <IconComponent />
                </div>
            </div>

            <div className={`stat-value ${colorClass !== "em" ? colorClass : ""}`}>{value}</div>

            <div className={`stat-trend ${trendClass}`}>
                {trendDir === "down" || trendDir === "warn"
                    ? <Icon.TrendDown />
                    : <Icon.TrendUp />
                }
                <span className={`trend-pill ${pillClass}`}>{trendText}</span>
            </div>

            <div className="sparkline">
                {sparkHeights.map((h: number, i: number) => (
                    <div
                        key={i}
                        className={`spark-bar ${colorClass} ${i === sparkHeights.length - 1 || i === Math.floor(sparkHeights.length / 2) ? "active" : ""}`}
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

interface MiniCardProps {
    title: string;
    value: string | null;
    valueColor?: string;
    sub?: string;
    TitleIcon?: React.ComponentType;
    children?: React.ReactNode;
}

export function MiniCard({ title, value, valueColor, sub, TitleIcon, children }: MiniCardProps) {
    return (
        <div className="mini-card">
            <div className="mini-title">
                {TitleIcon && <TitleIcon />}
                {title}
            </div>
            <div className="mini-value" style={valueColor ? { color: `hsl(var(--${valueColor}))` } : {}}>
                {value}
            </div>
            {sub && <div className="mini-sub">{sub}</div>}
            {children}
        </div>
    );
}
