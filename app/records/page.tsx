"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface RecordSummary {
  record_id: string;
  document_type: string;
  status: string;
  language: string;
  district: string | null;
  village: string | null;
  khasra_number: string | null;
  survey_number: string | null;
  area: string | null;
  area_unit: string | null;
  primary_owner: string;
  confidence: number;
  validation_errors: number;
  validation_warnings: number;
  requires_verification: boolean;
  processed_at: string;
}

function getStatusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    verified: { cls: "badge-verified", label: "✓ Verified" },
    validated: { cls: "badge-verified", label: "✓ Validated" },
    pending_verification: { cls: "badge-review", label: "⏳ Pending Review" },
    extracted: { cls: "badge-processing", label: "⚡ Extracted" },
    processing: { cls: "badge-processing", label: "⟳ Processing" },
    error: { cls: "badge-error", label: "✕ Error" },
  };
  const s = map[status] || { cls: "badge-info", label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const res = await fetch(`/api/records?${params.toString()}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Failed to load records:", err);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1 style={{ color: "#0b192c", fontSize: "1.8rem", fontWeight: 700 }}>
              भू-अभिलेख निर्देशिका | Land Records Directory
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: 4 }}>
              Browse and search official digitized land records across state, district & tehsil jurisdictions
            </p>
          </div>
          <Link href="/upload" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">
            📤 Upload New
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card fade-in" style={{ padding: "16px 20px", marginBottom: 24 }}>
        <input
          className="ux4g-input ux4g-input-md"
          placeholder="Search by Khasra, Survey, Village, Owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}>
          <div className="spin" style={{ fontSize: "2rem" }}>⟳</div>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-card flex-center fade-in" style={{ padding: 60, flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: "3rem" }}>📄</span>
          <h3>No Records Yet</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Upload a land document to get started
          </p>
          <Link href="/upload" className="btn btn-primary">
            📤 Upload Document
          </Link>
        </div>
      ) : (
        <div className="result-table-wrapper fade-in">
          <table className="result-table">
            <thead>
              <tr>
                <th>Khasra / Survey</th>
                <th>Village / District</th>
                <th>Owner</th>
                <th>Area</th>
                <th>Type</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Issues</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.record_id}>
                  <td style={{ fontWeight: 500 }}>
                    {r.khasra_number || r.survey_number || "—"}
                  </td>
                  <td>
                    <div>{r.village || "—"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {r.district || ""}
                    </div>
                  </td>
                  <td>{r.primary_owner}</td>
                  <td>
                    {r.area ? `${r.area} ${r.area_unit || ""}` : "—"}
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {r.document_type?.replace(/_/g, " ") || "unknown"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        r.confidence >= 85
                          ? "confidence-high"
                          : r.confidence >= 70
                          ? "confidence-medium"
                          : "confidence-low"
                      }
                      style={{ fontWeight: 600 }}
                    >
                      {r.confidence}%
                    </span>
                  </td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    {r.validation_errors > 0 && (
                      <span className="badge badge-error" style={{ marginRight: 4 }}>
                        {r.validation_errors} ❌
                      </span>
                    )}
                    {r.validation_warnings > 0 && (
                      <span className="badge badge-pending">
                        {r.validation_warnings} ⚠️
                      </span>
                    )}
                    {r.validation_errors === 0 && r.validation_warnings === 0 && (
                      <span className="badge badge-verified">✓ Clean</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/records/${encodeURIComponent(r.record_id)}`}
                      className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
