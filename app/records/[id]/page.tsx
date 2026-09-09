"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { CanonicalLandRecord } from "../../../utils/schemas/landRecord";
import OwnershipTimeline from "../../../components/records/OwnershipTimeline";
import { useRole } from "@/lib/context/roleContext";

interface RecordDetail {
  record: CanonicalLandRecord;
  health_score: {
    overall: number;
    data_completeness: number;
    extraction_confidence: number;
    validation_consistency: number;
    duplicate_risk: number;
    source_quality: number;
  };
}

function HealthRing({
  score,
  label,
  size = 80,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 85
      ? "var(--accent-color)"
      : score >= 70
      ? "var(--warning-color)"
      : "var(--danger-color)";

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div
        style={{
          marginTop: -size / 2 - 12,
          fontSize: "1.2rem",
          fontWeight: 700,
          color,
          position: "relative",
        }}
      >
        {score}
      </div>
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--text-muted)",
          marginTop: size / 2 - 16,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function RecordDetailPage() {
  const { role, roleName, roleId } = useRole();
  const params = useParams();
  const rawId = params.id as string;
  const id = rawId ? decodeURIComponent(rawId) : "";
  const [data, setData] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fields" | "validation" | "timeline">("fields");

  // Verification & Decision State
  const [officerName, setOfficerName] = useState("Tehsildar R.K. Sharma");
  const [officerNotes, setOfficerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Field inline edit state
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, "approved" | "rejected">>({});

  useEffect(() => {
    if (!id) return;
    fetch(`/api/records/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleVerificationAction = async (action: "verify" | "reject") => {
    if (role === "admin") {
      setActionFeedback({
        type: "error",
        text: "⚠️ Admin mode is supervisory only. Switch to Officer/Auditor mode to execute verification actions.",
      });
      return;
    }

    setIsSubmitting(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/records/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          role: "officer",
          notes: officerNotes,
          officer_name: officerName,
        }),
      });
      const updatedData = await res.json();
      if (res.ok) {
        setData(updatedData);
        setActionFeedback({
          type: "success",
          text:
            action === "verify"
              ? "✅ Record successfully verified and approved!"
              : "✕ Record marked as REJECTED and sent for re-scanning.",
        });
        setOfficerNotes("");
      } else {
        setActionFeedback({
          type: "error",
          text: updatedData.error || "Failed to update record",
        });
      }
    } catch (err) {
      console.error(err);
      setActionFeedback({ type: "error", text: "Network error occurred" });
    }
    setIsSubmitting(false);
  };

  const handleFieldStatusToggle = async (key: string, status: "approved" | "rejected") => {
    setFieldStatuses((prev) => ({ ...prev, [key]: status }));
    try {
      await fetch(`/api/records/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_field",
          fieldKey: key,
          fieldStatus: status,
          notes: `Field '${key}' set to ${status.toUpperCase()} by ${officerName}`,
          officer_name: officerName,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFieldEdit = async (key: string) => {
    if (!editingValue.trim()) return;
    try {
      const res = await fetch(`/api/records/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_field",
          fieldKey: key,
          fieldValue: editingValue,
          fieldStatus: "approved",
          notes: `Field '${key}' value manually edited to '${editingValue}' by ${officerName}`,
          officer_name: officerName,
        }),
      });
      const updatedData = await res.json();
      if (res.ok) {
        setData(updatedData);
        setEditingFieldKey(null);
        setFieldStatuses((prev) => ({ ...prev, [key]: "approved" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: "60vh" }}>
        <div className="spin" style={{ fontSize: "2rem" }}>⟳</div>
      </div>
    );
  }

  if (!data?.record) {
    return (
      <div className="page-container flex-center" style={{ minHeight: "60vh", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: "3rem" }}>🔍</span>
        <h3>Record Not Found</h3>
      </div>
    );
  }

  const { record, health_score } = data;

  const renderFieldCard = (key: string, label: string, val: string | number, confidence?: number) => {
    const fKey = key;
    const currentStatus = fieldStatuses[fKey];
    const isEditing = editingFieldKey === fKey;

    return (
      <div
        className="field-card"
        key={key}
        style={{
          border:
            currentStatus === "approved"
              ? "1px solid #bbf7d0"
              : currentStatus === "rejected"
              ? "1px solid #fecaca"
              : "1px solid #e2e8f0",
          backgroundColor:
            currentStatus === "approved"
              ? "#f0fdf4"
              : currentStatus === "rejected"
              ? "#fef2f2"
              : "#ffffff",
          padding: "12px 16px",
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <div className="flex-between" style={{ marginBottom: 4 }}>
          <div className="field-label" style={{ fontWeight: 600, color: "#475569" }}>
            {label}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {confidence !== undefined && (
              <span
                className={`badge ${
                  confidence >= 0.85
                    ? "badge-verified"
                    : confidence >= 0.7
                    ? "badge-pending"
                    : "badge-error"
                }`}
                style={{ fontSize: "0.65rem", padding: "2px 8px" }}
              >
                {Math.round(confidence * 100)}% AI Conf
              </span>
            )}
            {/* Field Action Verification Buttons */}
            <button
              title="Approve field"
              className={`ux4g-btn ux4g-btn-sm ${currentStatus === "approved" ? "ux4g-btn-success" : "ux4g-btn-secondary"}`}
              style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: 4 }}
              onClick={() => handleFieldStatusToggle(fKey, "approved")}
            >
              ✓
            </button>
            <button
              title="Reject field"
              className={`ux4g-btn ux4g-btn-sm ${currentStatus === "rejected" ? "ux4g-btn-danger" : "ux4g-btn-secondary"}`}
              style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: 4 }}
              onClick={() => handleFieldStatusToggle(fKey, "rejected")}
            >
              ✕
            </button>
            <button
              title="Edit field value"
              className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm"
              style={{ padding: "2px 8px", fontSize: "0.75rem", borderRadius: 4 }}
              onClick={() => {
                setEditingFieldKey(isEditing ? null : fKey);
                setEditingValue(String(val));
              }}
            >
              ✏️
            </button>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="ux4g-input ux4g-input-sm"
              style={{ padding: "4px 8px", fontSize: "0.9rem" }}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
            />
            <button
              className="ux4g-btn ux4g-btn-primary ux4g-btn-sm"
              style={{ padding: "4px 12px" }}
              onClick={() => handleSaveFieldEdit(fKey)}
            >
              Save
            </button>
            <button
              className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm"
              style={{ padding: "4px 12px" }}
              onClick={() => setEditingFieldKey(null)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="field-value" style={{ fontSize: "1.05rem", fontWeight: 500, color: "#0f172a" }}>
            {val}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1>
              {record.parcel.khasra_number.value
                ? `Khasra ${record.parcel.khasra_number.value}`
                : record.parcel.survey_number.value
                ? `Survey ${record.parcel.survey_number.value}`
                : "Land Record"}{" "}
              — {record.location.village.value || "Unknown Village"}
            </h1>
            <p>
              {record.location.district.value || ""} •{" "}
              {record.metadata.document_type.replace(/_/g, " ")} •{" "}
              Processed {new Date(record.metadata.processing_timestamp).toLocaleString()}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span
              className={`ux4g-badge ${
                record.metadata.status === "verified"
                  ? "ux4g-badge-success"
                  : record.metadata.status === "rejected"
                  ? "ux4g-badge-danger"
                  : "ux4g-badge-warning"
              }`}
              style={{ fontSize: "0.85rem", padding: "8px 18px" }}
            >
              {record.metadata.status === "verified"
                ? "✓ VERIFIED RECORD"
                : record.metadata.status === "rejected"
                ? "✕ REJECTED RECORD"
                : "⏳ PENDING VERIFICATION"}
            </span>
          </div>
        </div>
      </div>

      {/* Official Officer Decision Panel */}
      <div
        className="ux4g-card fade-in"
        style={{
          marginBottom: 24,
          borderLeft: `6px solid ${record.metadata.status === "verified" ? "#16a34a" : record.metadata.status === "rejected" ? "#dc2626" : "#4A2BC2"}`,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        {/* Panel Header with Role Context */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h3 style={{ color: "#0f172a", fontSize: "1.2rem", fontWeight: 700 }}>
              {role === "admin"
                ? "🏛️ अधिकारी सत्यापन पर्यवेक्षण | Officer Verification Supervision (Admin)"
                : "🏛️ राजस्व अधिकारी सत्यापन प्रणाली | Verification Control Panel"}
            </h3>
            <p style={{ color: "#475569", fontSize: "0.85rem", marginTop: 2 }}>
              {role === "admin"
                ? "Supervisory review mode — inspect decision log and officer remarks below."
                : "Actions are logged to the permanent audit trail with officer name, timestamp and remarks."}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div
              style={{
                width: 28,
                height: 28,
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
                fontSize: "0.65rem",
              }}
            >
              {roleId}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "#0f172a" }}>
                {role === "admin" ? "Admin (DRO)" : "Officer (RO)"}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#64748b" }}>
                {role === "admin" ? "Supervisory Review" : "Field Auditor"}
              </div>
            </div>
          </div>
        </div>

        {actionFeedback && (
          <div
            className={`ux4g-alert ${
              actionFeedback.type === "success" ? "ux4g-alert-success" : "ux4g-alert-danger"
            }`}
            style={{ padding: "10px 16px", marginBottom: 16, fontSize: "0.9rem" }}
          >
            {actionFeedback.text}
          </div>
        )}

        {/* Status Banners */}
        {record.metadata.status === "verified" && (
          <div className="ux4g-alert ux4g-alert-success" style={{ marginBottom: 16 }}>
            <strong>✓ This record has been VERIFIED</strong> by a Revenue Officer.
            The verification decision and officer remarks are recorded in the Audit Trail below.
          </div>
        )}
        {record.metadata.status === "rejected" && (
          <div className="ux4g-alert ux4g-alert-danger" style={{ marginBottom: 16 }}>
            <strong>✕ This record has been REJECTED.</strong> The rejection reason and officer remarks are recorded in the Audit Trail.
            The document has been flagged for re-scanning / field correction.
          </div>
        )}

        {/* Role-Specific Panel Body */}
        {role === "admin" ? (
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              📋 Latest Officer Audit Remarks & Decision Log
            </div>
            {record.audit && record.audit.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {record.audit.slice(-3).reverse().map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "10px 14px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span style={{ fontWeight: 700, color: "#1e293b" }}>{a.user_email || "Revenue Officer"}</span>
                      <span style={{ color: "#64748b" }}>{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: "0.83rem", color: "#334155", marginTop: 4 }}>
                      <strong>Action:</strong> <span className="badge badge-info">{a.action}</span> — {a.notes || "No notes provided."}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>No audit log remarks yet.</div>
            )}
            <div style={{ marginTop: 12, fontSize: "0.78rem", color: "#64748b" }}>
              💡 <em>To execute approval/rejection or modify fields, switch to <strong>Officer / Auditor mode</strong> in the sidebar.</em>
            </div>
          </div>
        ) : (
          <>
            {/* Officer Identity & Notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" }}>
                  👤 Verifying Officer Name / Employee ID
                </label>
                <input
                  className="ux4g-input ux4g-input-sm"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Tehsildar R.K. Sharma"
                />
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>
                  This name will appear in the official audit trail log entry.
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" }}>
                  📝 Official Remarks (Recorded in Audit Trail)
                </label>
                <textarea
                  className="ux4g-input"
                  style={{ minHeight: 60, resize: "vertical", fontSize: "0.9rem" }}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder={
                    record.metadata.status === "verified"
                      ? "e.g. Re-verification required due to boundary discrepancy..."
                      : record.metadata.status === "rejected"
                      ? "e.g. Issue resolved after document re-scan, now approving..."
                      : "e.g. Cross-checked with manual register, boundaries match. Approved as per Revenue Code §12(3)..."
                  }
                />
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>
                  These remarks are permanently saved in the record&apos;s audit trail and attached to your action.
                </div>
              </div>
            </div>

            {/* Action Buttons for Officer */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
              {record.metadata.status === "verified" ? (
                <>
                  <button
                    disabled={isSubmitting}
                    className="ux4g-btn ux4g-btn-danger ux4g-btn-md"
                    onClick={() => handleVerificationAction("reject")}
                    style={{ fontWeight: 600 }}
                  >
                    {isSubmitting ? "Processing..." : "✕ Revoke Approval & Reject"}
                  </button>
                  <span className="ux4g-badge ux4g-badge-success" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
                    ✓ Currently: VERIFIED
                  </span>
                </>
              ) : record.metadata.status === "rejected" ? (
                <>
                  <span className="ux4g-badge ux4g-badge-danger" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
                    ✕ Currently: REJECTED
                  </span>
                  <button
                    disabled={isSubmitting}
                    className="ux4g-btn ux4g-btn-success ux4g-btn-md"
                    onClick={() => handleVerificationAction("verify")}
                    style={{ fontWeight: 600 }}
                  >
                    {isSubmitting ? "Processing..." : "✓ Override: Approve & Verify"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={isSubmitting}
                    className="ux4g-btn ux4g-btn-danger ux4g-btn-md"
                    onClick={() => handleVerificationAction("reject")}
                    style={{ fontWeight: 600 }}
                  >
                    {isSubmitting ? "Processing..." : "✕ Reject Record"}
                  </button>
                  <button
                    disabled={isSubmitting}
                    className="ux4g-btn ux4g-btn-success ux4g-btn-md"
                    onClick={() => handleVerificationAction("verify")}
                    style={{ fontWeight: 600 }}
                  >
                    {isSubmitting ? "Processing..." : "✓ Approve & Verify Record"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Health Score Strip */}
      <div
        className="glass-card fade-in"
        style={{
          padding: "24px 32px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          animationDelay: "0.1s",
        }}
      >
        <HealthRing score={health_score.overall} label="Overall" size={100} />
        <HealthRing score={health_score.data_completeness} label="Completeness" />
        <HealthRing score={health_score.extraction_confidence} label="Confidence" />
        <HealthRing score={health_score.validation_consistency} label="Validation" />
        <HealthRing score={health_score.duplicate_risk} label="Uniqueness" />
        <HealthRing score={health_score.source_quality} label="Quality" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["fields", "validation", "timeline"] as const).map((tab) => (
          <button
            key={tab}
            className={`ux4g-btn ${activeTab === tab ? "ux4g-btn-primary" : "ux4g-btn-secondary"} ux4g-btn-sm`}
            style={{ padding: "8px 20px" }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "fields" ? "📋 Verification Fields & Actions" : tab === "validation" ? "⚠️ Validation Checks" : "⏱️ Audit & Timeline"}
          </button>
        ))}
      </div>

      {/* Fields Tab */}
      {activeTab === "fields" && (
        <div
          className="fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: 20,
          }}
        >
          {/* Location */}
          <div className="ux4g-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              📍 Location Details
            </h4>
            <div className="stack" style={{ gap: 0 }}>
              {Object.entries(record.location).map(([key, field]) => {
                if (!field || !field.value) return null;
                return renderFieldCard(`location.${key}`, key.replace(/_/g, " "), field.value, field.confidence);
              })}
            </div>
          </div>

          {/* Parcel */}
          <div className="ux4g-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              📐 Parcel Details
            </h4>
            <div className="stack" style={{ gap: 0 }}>
              {Object.entries(record.parcel).map(([key, field]) => {
                if (!field || typeof field !== "object" || !("value" in field) || !field.value)
                  return null;
                return renderFieldCard(
                  `parcel.${key}`,
                  key.replace(/_/g, " "),
                  String(field.value),
                  typeof field.confidence === "number" ? field.confidence : undefined
                );
              })}
            </div>
          </div>

          {/* Owners */}
          <div className="ux4g-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              👤 Owners ({record.owners.length})
            </h4>
            <div className="stack" style={{ gap: 0 }}>
              {record.owners.map((owner, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  {renderFieldCard(
                    `owners.${i}.name`,
                    `Owner ${i + 1} Name`,
                    owner.name.value?.romanized || owner.name.value?.original || "Unknown",
                    owner.name.confidence
                  )}
                  {owner.relationship?.value &&
                    renderFieldCard(`owners.${i}.relationship`, "Relationship", owner.relationship.value, owner.relationship.confidence)}
                  {owner.ownership_share?.value &&
                    renderFieldCard(`owners.${i}.share`, "Share Fraction", owner.ownership_share.value, owner.ownership_share.confidence)}
                </div>
              ))}
            </div>
          </div>

          {/* Land Classification */}
          <div className="ux4g-card" style={{ padding: 24 }}>
            <h4 style={{ marginBottom: 16, color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
              🌾 Land Classification
            </h4>
            <div className="stack" style={{ gap: 0 }}>
              {Object.entries(record.land).map(([key, field]) => {
                if (!field || !field.value) return null;
                return renderFieldCard(`land.${key}`, key.replace(/_/g, " "), field.value, field.confidence);
              })}
            </div>
          </div>

          {/* Boundaries */}
          {record.boundaries && (
            <div className="ux4g-card" style={{ padding: 24 }}>
              <h4 style={{ marginBottom: 16, color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
                🧭 Parcel Boundaries
              </h4>
              <div className="stack" style={{ gap: 0 }}>
                {Object.entries(record.boundaries).map(([dir, field]) => {
                  if (!field?.value) return null;
                  return renderFieldCard(`boundaries.${dir}`, `${dir} Boundary`, field.value, field.confidence);
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === "validation" && (
        <div className="fade-in">
          {record.validation.length === 0 ? (
            <div className="ux4g-card flex-center" style={{ padding: 48, flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: "2.5rem" }}>✅</span>
              <h3>All Validations Passed</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                No issues or discrepancy flags detected for this record.
              </p>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {record.validation.map((v, i) => (
                <div
                  className={`validation-item ${
                    v.status === "ERROR"
                      ? "validation-error"
                      : v.status === "WARNING"
                      ? "validation-warning"
                      : "validation-info"
                  }`}
                  key={i}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderLeft: `5px solid ${v.status === "ERROR" ? "#ef4444" : v.status === "WARNING" ? "#d97706" : "#0284c7"}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{v.message}</div>
                    <span
                      className={`ux4g-badge ${
                        v.severity === "HIGH"
                          ? "ux4g-badge-danger"
                          : v.severity === "MEDIUM"
                          ? "ux4g-badge-warning"
                          : "ux4g-badge-info"
                      }`}
                    >
                      {v.severity} SEVERITY
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 8 }}>
                    <strong>Validation Explanation:</strong> {v.explanation}
                  </div>
                  {v.suggestion && (
                    <div style={{ color: "var(--primary-color)", fontSize: "0.85rem", fontWeight: 500 }}>
                      💡 Recommended Action: {v.suggestion}
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                    Rule ID: {v.rule_id} • Field: {v.field}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="fade-in">
          {/* Ownership History */}
          <div className="ux4g-card" style={{ padding: 32, marginBottom: 24 }}>
            <OwnershipTimeline
              khasra={record.parcel.khasra_number.value || record.parcel.survey_number.value || "—"}
              village={record.location.village.value || "Unknown"}
            />
          </div>

          {/* Audit Trail */}
          <div className="ux4g-card" style={{ padding: 32 }}>
            <h4 style={{ marginBottom: 24, color: "#0f172a" }}>🔍 Audit Trail & Action Logs</h4>
            <div className="timeline">
              {record.audit.map((entry, i) => (
                <div className="timeline-event" key={i}>
                  <div className="timeline-date">{new Date(entry.timestamp).toLocaleString()}</div>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{entry.action}</div>
                  {entry.notes && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>
                      {entry.notes}
                    </div>
                  )}
                  {entry.user_email && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                      by {entry.user_email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
