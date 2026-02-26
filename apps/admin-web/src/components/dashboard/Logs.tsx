import React from "react";

const LOG_DOT_COLORS = { issued: "var(--em-light)", pending: "var(--amber)", revoked: "var(--rose)" };

interface LogEntry {
    type: "issued" | "pending" | "revoked";
    bold: string;
    message: string;
    time: string;
}

interface SystemLogsProps {
    logs: LogEntry[];
}

export function SystemLogs({ logs }: SystemLogsProps) {
    return (
        <>
            {logs.map((log, i) => (
                <div className="log-row" key={i}>
                    <div className="log-dot" style={{ background: (LOG_DOT_COLORS as any)[log.type] || "var(--text-muted)" }} />
                    <div className="log-msg">
                        <strong>{log.bold}</strong> — {log.message}
                    </div>
                    <div className="log-time">{log.time}</div>
                </div>
            ))}
        </>
    );
}
