"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRole } from "@/lib/context/roleContext";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface RecentAction {
  record_id: string;
  khasra_number?: string;
  village?: string;
  district?: string;
  audit: {
    id: string;
    action: string;
    timestamp: string;
    notes?: string;
    user_email?: string;
  };
}

interface DashboardStats {
  totalDocuments: number;
  processed: number;
  errors: number;
  verified: number;
  rejected?: number;
  pendingVerification: number;
  avgConfidence: number;
  docTypes: Record<string, number>;
  languages: Record<string, number>;
  recentActions?: RecentAction[];
}

const DEMO_STATS: DashboardStats = {
  totalDocuments: 0,
  processed: 0,
  errors: 0,
  verified: 0,
  rejected: 0,
  pendingVerification: 0,
  avgConfidence: 0,
  docTypes: {},
  languages: {},
  recentActions: [],
};

const GIS_STATS = {
  totalParcels: 10,
  withGeometry: 10,
  verified: 4,
  pendingVerification: 3,
  conflictsDetected: 2,
  lowConfidence: 1,
  totalAreaHa: 15.84,
};

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
];

const QUICK_STATS = [
  { key: "totalDocuments", label: "Total Documents", icon: "📄", color: "var(--primary-color)" },
  { key: "processed", label: "Processed", icon: "⚡", color: "var(--accent-color)" },
  { key: "verified", label: "Verified", icon: "✅", color: "var(--status-verified)" },
  { key: "rejected", label: "Rejected", icon: "🚫", color: "#dc2626" },
  { key: "pendingVerification", label: "Pending Review", icon: "⏳", color: "var(--warning-color)" },
  { key: "avgConfidence", label: "Avg. Confidence", icon: "📊", suffix: "%", color: "var(--info-color)" },
];

export default function DashboardPage() {
  const { role, roleName } = useRole();
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const docTypeData = Object.entries(stats.docTypes).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const langData = Object.entries(stats.languages).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: role === "admin" ? "#e0e7ff" : "#dcfce7",
                  color: role === "admin" ? "#3730a3" : "#166534",
                  border: role === "admin" ? "1px solid #c7d2fe" : "1px solid #bbf7d0",
                }}
              >
                {role === "admin" ? "🏛️ DISTRICT ADMIN VIEW" : "🔍 FIELD AUDITOR VIEW"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Logged in as: {roleName}</span>
            </div>
            <h1 style={{ color: "#0b192c", fontSize: "1.7rem", fontWeight: 700 }}>
              {role === "admin"
                ? "भू-अभिलेख पर्यवेक्षण डैशबोर्ड | Land Record Supervision Dashboard"
                : "क्षेत्र सत्यापन एवं लेखापरीक्षा डैशबोर्ड | Field Verification & Audit Dashboard"}
            </h1>
            <p style={{ color: "#475569", fontSize: "0.9rem", marginTop: 4 }}>
              डिजिटल इंडिया भूमि अभिलेख आधुनिकीकरण कार्यक्रम (DILRMP) • National Land Administration Platform
            </p>
          </div>
          <span className="ux4g-badge ux4g-badge-success" style={{ fontSize: "0.75rem", padding: "6px 14px" }}>
            ● NIC System Status: Operational
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid fade-in" style={{ animationDelay: "0.05s" }}>
        {QUICK_STATS.map((s) => (
          <div className="glass-card stat-card" key={s.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="stat-value" style={{ color: s.color }}>
                  {(stats as unknown as Record<string, number>)[s.key] ?? 0}
                  {s.suffix || ""}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
              <span style={{ fontSize: "1.8rem", opacity: 0.7 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Officer Actions & Comments (Crucial for Admin & Officer oversight) */}
      <div className="glass-card fade-in" style={{ marginTop: 24, padding: 24, animationDelay: "0.08s" }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1.05rem", color: "#0f172a" }}>
            📝 {role === "admin" ? "Recent Officer Verification Actions & Remarks" : "Your Recent Audit Activity Log"}
          </h4>
          <Link href="/audit" className="btn btn-sm btn-secondary" style={{ fontSize: "0.78rem" }}>
            View Full Audit Trail →
          </Link>
        </div>

        {!stats.recentActions || stats.recentActions.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
            No recent officer verification remarks logged yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.recentActions.map((item) => {
              const isVerified = item.audit.action.includes("VERIFIED");
              const isRejected = item.audit.action.includes("REJECTED");
              const isFieldUpdate = item.audit.action.includes("FIELD");

              const badgeBg = isVerified ? "#dcfce7" : isRejected ? "#fee2e2" : "#e0e7ff";
              const badgeFg = isVerified ? "#15803d" : isRejected ? "#b91c1c" : "#4338ca";
              const badgeBorder = isVerified ? "#bbf7d0" : isRejected ? "#fca5a5" : "#c7d2fe";

              return (
                <div
                  key={item.audit.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        background: badgeBg,
                        color: badgeFg,
                        border: `1px solid ${badgeBorder}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isVerified ? "VERIFIED" : isRejected ? "REJECTED" : "EDITED"}
                    </span>

                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0f172a" }}>
                        Record ID:{" "}
                        <Link href={`/records/${encodeURIComponent(item.record_id)}`} style={{ color: "#2563eb", textDecoration: "underline" }}>
                          {item.record_id}
                        </Link>
                        {item.khasra_number && (
                          <span style={{ fontSize: "0.78rem", color: "#475569", marginLeft: 8 }}>
                            (Khasra #{item.khasra_number}, {item.village || ""})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#334155", marginTop: 2 }}>
                        💬 <strong>Remarks:</strong> {item.audit.notes || "No comments specified."}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", minWidth: "160px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                      👤 {item.audit.user_email || "Revenue Officer"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                      {new Date(item.audit.timestamp).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div
        className="fade-in"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 24,
          animationDelay: "0.1s",
        }}
      >
        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 20 }}>📄 Document Types</h4>
          {docTypeData.length === 0 ? (
            <div className="flex-center" style={{ height: 200, color: "var(--text-muted)", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: "2rem" }}>📊</span>
              <span style={{ fontSize: "0.85rem" }}>Upload documents to see distribution</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={docTypeData}>
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4ff" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 20 }}>🌐 Languages Detected</h4>
          {langData.length === 0 ? (
            <div className="flex-center" style={{ height: 200, color: "var(--text-muted)", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: "2rem" }}>🌐</span>
              <span style={{ fontSize: "0.85rem" }}>Language breakdown appears after processing</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={langData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={(props: { name?: string; percent?: number }) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {langData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(10,15,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f0f4ff" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* GIS Spatial Stats */}
      <div className="glass-card fade-in" style={{ marginTop: 24, padding: 28, animationDelay: "0.15s" }}>
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <h4>
            🗺️ Digital Land Twin — Spatial Statistics{" "}
            <span className="badge badge-demo" style={{ fontSize: "0.65rem", marginLeft: 8 }}>
              LIVE GIS DATA
            </span>
          </h4>
          <Link href="/gis" className="btn btn-sm btn-secondary">Open Map →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Parcels", val: GIS_STATS.totalParcels, color: "var(--primary-color)" },
            { label: "With Geometry", val: GIS_STATS.withGeometry, color: "var(--info-color)" },
            { label: "Verified", val: GIS_STATS.verified, color: "var(--accent-color)" },
            { label: "Pending", val: GIS_STATS.pendingVerification, color: "var(--warning-color)" },
            { label: "Conflicts", val: GIS_STATS.conflictsDetected, color: "var(--danger-color)" },
            { label: "Low Confidence", val: GIS_STATS.lowConfidence, color: "var(--secondary-color)" },
            { label: "Area Digitized", val: `${GIS_STATS.totalAreaHa} ha`, color: "var(--text-primary)" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: item.color }}>{item.val}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Verified", count: GIS_STATS.verified, total: GIS_STATS.totalParcels, color: "var(--accent-color)" },
            { label: "Pending Review", count: GIS_STATS.pendingVerification, total: GIS_STATS.totalParcels, color: "var(--warning-color)" },
            { label: "Conflicts Detected", count: GIS_STATS.conflictsDetected, total: GIS_STATS.totalParcels, color: "var(--danger-color)" },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex-between" style={{ marginBottom: 4, fontSize: "0.8rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{row.label}</span>
                <span style={{ color: row.color, fontWeight: 500 }}>
                  {row.count}/{row.total} ({Math.round((row.count / row.total) * 100)}%)
                </span>
              </div>
              <div className="confidence-bar">
                <div className="confidence-bar-fill" style={{ width: `${(row.count / row.total) * 100}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card fade-in" style={{ marginTop: 24, padding: 28, animationDelay: "0.2s" }}>
        <h4 style={{ marginBottom: 16 }}>Quick Actions ({role === "admin" ? "Admin Mode" : "Auditor Mode"})</h4>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {role === "admin" ? (
            <>
              <Link href="/upload" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">📤 Upload Document</Link>
              <Link href="/records" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">📋 View All Records</Link>
              <Link href="/verify" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">🔍 Review Officer Verification Log</Link>
              <Link href="/gis" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">🗺️ Land Twin Map</Link>
            </>
          ) : (
            <>
              <Link href="/verify" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">✅ Action Pending Verifications</Link>
              <Link href="/records" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">📋 Inspect Land Records</Link>
              <Link href="/gis" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">🗺️ Land Twin Map</Link>
              <Link href="/audit" className="ux4g-btn ux4g-btn-secondary ux4g-btn-md">📜 View Audit Log</Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 24, animationDelay: "0.25s" }}>
        {[
          { icon: "🤖", title: "AI Extraction", desc: "Vision LLM OCR for printed + handwritten text in 12 Indian languages" },
          { icon: "🔍", title: "Smart Validation", desc: "Rule-based validation with explainable 'Why was this flagged?' reasoning" },
          { icon: "📍", title: "Field Provenance", desc: "Click any field to see confidence, region and text type from source document" },
          { icon: "🗺️", title: "Digital Land Twin", desc: "Interactive map — every parcel links to its record, timeline, and documents" },
          { icon: "👥", title: "Dual-Role Workflow", desc: "Officer performs verification and enters notes; Admin supervises and reviews audit trail" },
          { icon: "⚠️", title: "Conflict Detection", desc: "Area mismatch, ownership conflicts, duplicate records — automatically flagged" },
        ].map((f) => (
          <div className="glass-card glass-card-interactive" key={f.title} style={{ padding: 20 }}>
            <span style={{ fontSize: "1.8rem", display: "block", marginBottom: 10 }}>{f.icon}</span>
            <h4 style={{ marginBottom: 6, fontSize: "1rem" }}>{f.title}</h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

