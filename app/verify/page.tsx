"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/lib/context/roleContext";

interface RecordSummary {
  record_id: string;
  document_type: string;
  status: string;
  khasra_number: string | null;
  survey_number: string | null;
  village: string | null;
  district: string | null;
  primary_owner: string;
  confidence: number;
  validation_errors: number;
  validation_warnings: number;
}

export default function VerifyPage() {
  const { role, roleName, roleId } = useRole();
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "pending"
          ? "/api/records?status=pending_verification"
          : statusFilter === "verified"
          ? "/api/records?status=verified"
          : statusFilter === "rejected"
          ? "/api/records?status=rejected"
          : "/api/records";
      const res = await fetch(url);
      const d = await res.json();
      setRecords(d.records || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleQuickAction = async (id: string, action: "verify" | "reject", event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (role === "admin") {
      setActionMessage("⚠️ Admin mode is supervisory only. Switch to Officer/Auditor mode to verify or reject records.");
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/api/records/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          role: "officer",
          notes: action === "verify" ? "Quick verified by Revenue Officer" : "Quick rejected by Revenue Officer",
          officer_name: "Tehsildar R.K. Sharma",
        }),
      });
      if (res.ok) {
        setActionMessage(
          action === "verify" ? "✓ Record verified successfully by Officer!" : "✕ Record rejected by Officer!"
        );
        setTimeout(() => setActionMessage(null), 3000);
        fetchRecords();
      } else {
        const errData = await res.json();
        setActionMessage(`❌ Error: ${errData.error || "Action failed"}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1 style={{ color: "#0b192c", fontSize: "1.8rem", fontWeight: 700 }}>
              {role === "admin"
                ? "सत्यापन लॉग | Officer Verification Audit Review"
                : "सत्यापन कतार | Revenue Officer Verification Queue"}
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: 4 }}>
              Active Mode: <strong>{roleName}</strong> —{" "}
              {role === "admin"
                ? "Supervisory review of field officer approvals and rejections"
                : "Operational audit queue (Approve / Reject land records)"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background:
                  role === "admin"
                    ? "linear-gradient(135deg, #4A2BC2, #6366f1)"
                    : "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {roleId}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                {role === "admin" ? "Admin (DRO)" : "Officer (RO)"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Dehradun Circle</div>
            </div>
          </div>
        </div>
      </div>

      {role === "admin" && (
        <div
          style={{
            padding: "12px 18px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            color: "#1e40af",
            fontSize: "0.88rem",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
          <div>
            <strong>District Admin Mode Active:</strong> You are reviewing officer verification activity in read-only supervisory mode. To perform verification, approve, or reject records, switch to <strong>Officer/Auditor mode</strong> using the sidebar switcher.
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          className={`ux4g-alert ${
            actionMessage.startsWith("✓")
              ? "ux4g-alert-success"
              : actionMessage.startsWith("⚠️")
              ? "ux4g-alert-warning"
              : "ux4g-alert-danger"
          } fade-in`}
          style={{ padding: "12px 20px", marginBottom: 20, fontSize: "0.95rem", fontWeight: 600 }}
        >
          {actionMessage}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className={`ux4g-btn ${statusFilter === "pending" ? "ux4g-btn-primary" : "ux4g-btn-secondary"} ux4g-btn-sm`}
          onClick={() => setStatusFilter("pending")}
        >
          ⏳ Pending Review
        </button>
        <button
          className={`ux4g-btn ${statusFilter === "verified" ? "ux4g-btn-success" : "ux4g-btn-secondary"} ux4g-btn-sm`}
          onClick={() => setStatusFilter("verified")}
        >
          ✓ Approved / Verified
        </button>
        <button
          className={`ux4g-btn ${statusFilter === "rejected" ? "ux4g-btn-danger" : "ux4g-btn-secondary"} ux4g-btn-sm`}
          onClick={() => setStatusFilter("rejected")}
        >
          ✕ Rejected Records
        </button>
        <button
          className={`ux4g-btn ${statusFilter === "all" ? "ux4g-btn-primary" : "ux4g-btn-secondary"} ux4g-btn-sm`}
          onClick={() => setStatusFilter("all")}
        >
          📋 All Records
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}>
          <div className="spin" style={{ fontSize: "2rem" }}>⟳</div>
        </div>
      ) : records.length === 0 ? (
        <div className="ux4g-card flex-center fade-in" style={{ padding: 60, flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: "3rem" }}>✅</span>
          <h3>Queue Empty ({statusFilter.toUpperCase()})</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            No records found matching current filter context.
          </p>
          <Link href="/upload" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">
            📤 Upload New Document
          </Link>
        </div>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {records.map((r) => (
            <div
              className="ux4g-card fade-in"
              key={r.record_id}
              style={{
                padding: "20px 24px",
                borderLeft:
                  r.status === "verified"
                    ? "6px solid #16a34a"
                    : r.status === "rejected"
                    ? "6px solid #dc2626"
                    : "6px solid #d97706",
              }}
            >
              <div className="flex-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
                    {r.khasra_number
                      ? `Khasra ${r.khasra_number}`
                      : r.survey_number
                      ? `Survey ${r.survey_number}`
                      : "Land Parcel"}{" "}
                    — {r.village || "Unknown Village"} ({r.district || "District"})
                  </div>
                  <div style={{ color: "#475569", fontSize: "0.85rem", marginTop: 4 }}>
                    Primary Owner: <strong>{r.primary_owner}</strong> • Document:{" "}
                    <span className="badge badge-info">{r.document_type?.replace(/_/g, " ")}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className={
                        r.confidence >= 85
                          ? "confidence-high"
                          : r.confidence >= 70
                          ? "confidence-medium"
                          : "confidence-low"
                      }
                      style={{ fontWeight: 700, fontSize: "1.1rem" }}
                    >
                      {r.confidence}% AI Score
                    </div>
                    {r.validation_errors > 0 ? (
                      <span className="ux4g-badge ux4g-badge-danger">{r.validation_errors} errors</span>
                    ) : r.validation_warnings > 0 ? (
                      <span className="ux4g-badge ux4g-badge-warning">{r.validation_warnings} warnings</span>
                    ) : (
                      <span className="ux4g-badge ux4g-badge-success">✓ Clean</span>
                    )}
                  </div>

                  {/* Verification Quick Action Buttons — context-sensitive */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {r.status === "verified" && (
                      <span className="ux4g-badge ux4g-badge-success" style={{ padding: "6px 14px" }}>
                        ✓ APPROVED
                      </span>
                    )}
                    {r.status === "rejected" && (
                      <span className="ux4g-badge ux4g-badge-danger" style={{ padding: "6px 14px" }}>
                        ✕ REJECTED
                      </span>
                    )}

                    {/* Verification buttons visible only in Officer mode */}
                    {role === "officer" &&
                      (r.status === "pending_verification" || r.status === "validated" || r.status === "extracted") && (
                        <>
                          <button
                            className="ux4g-btn ux4g-btn-danger ux4g-btn-sm"
                            title="Reject record"
                            onClick={(e) => handleQuickAction(r.record_id, "reject", e)}
                          >
                            ✕ Reject
                          </button>
                          <button
                            className="ux4g-btn ux4g-btn-success ux4g-btn-sm"
                            title="Approve & Verify record"
                            onClick={(e) => handleQuickAction(r.record_id, "verify", e)}
                          >
                            ✓ Approve
                          </button>
                        </>
                      )}

                    <Link
                      href={`/records/${encodeURIComponent(r.record_id)}`}
                      className="ux4g-btn ux4g-btn-primary ux4g-btn-sm"
                    >
                      {role === "admin" ? "👁️ Review Record →" : "🔍 Inspect →"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

