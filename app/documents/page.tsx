"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface DocSummary {
  id: string;
  original_filename: string;
  document_type: string;
  language: string;
  quality_score: number;
  status: string;
  uploaded_at: string;
  record_id: string | null;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => {
        setDocs(d.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1 style={{ color: "#0b192c", fontSize: "1.8rem", fontWeight: 700 }}>
              दस्तावेज़ संग्रह | Document Repository
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: 4 }}>
              Repository of all digitized source documents (RoR, Khasra, Khatauni, Sale Deeds)
            </p>
          </div>
          <Link href="/upload" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">📤 Upload</Link>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}>
          <div className="spin" style={{ fontSize: "2rem" }}>⟳</div>
        </div>
      ) : docs.length === 0 ? (
        <div className="glass-card flex-center fade-in" style={{ padding: 60, flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: "3rem" }}>📄</span>
          <h3>No Documents</h3>
          <p style={{ color: "var(--text-secondary)" }}>Upload land record documents to begin digitization.</p>
          <Link href="/upload" className="ux4g-btn ux4g-btn-primary ux4g-btn-md">📤 Upload Document</Link>
        </div>
      ) : (
        <div className="result-table-wrapper fade-in">
          <table className="result-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>Language</th>
                <th>Quality</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.original_filename}</td>
                  <td><span className="ux4g-badge ux4g-badge-info">{d.document_type?.replace(/_/g, " ") || "—"}</span></td>
                  <td>{d.language?.toUpperCase() || "—"}</td>
                  <td>
                    <span style={{ color: d.quality_score >= 70 ? "var(--accent-color)" : "var(--warning-color)" }}>
                      {d.quality_score}/100
                    </span>
                  </td>
                  <td><span className="ux4g-badge ux4g-badge-info">{d.status}</span></td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {new Date(d.uploaded_at).toLocaleDateString()}
                  </td>
                  <td>
                    {d.record_id && (
                      <Link href={`/records/${d.record_id}`} className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm">View Record</Link>
                    )}
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
