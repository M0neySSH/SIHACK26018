"use client";

import { useState } from "react";

interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  owner: string;
  ownerHindi?: string;
  type: "original" | "mutation" | "sale" | "inheritance" | "gift" | "court_order" | "current";
  document?: string;
  confidence?: number;
}

interface OwnershipTimelineProps {
  khasra: string;
  village: string;
  entries?: TimelineEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  original: "var(--primary-color)",
  mutation: "var(--secondary-color)",
  sale: "var(--accent-color)",
  inheritance: "var(--warning-color)",
  gift: "var(--info-color)",
  court_order: "var(--danger-color)",
  current: "var(--accent-color)",
};

const TYPE_ICONS: Record<string, string> = {
  original: "📄",
  mutation: "📝",
  sale: "💰",
  inheritance: "👨‍👦",
  gift: "🎁",
  court_order: "⚖️",
  current: "✅",
};

// Demo timeline when no data is provided
const DEMO_TIMELINE: TimelineEntry[] = [
  {
    year: "2005",
    title: "Original Record",
    description: "First entry in Khasra register. Land classified as Agricultural.",
    owner: "Shyam Singh",
    ownerHindi: "श्याम सिंह",
    type: "original",
    document: "Khasra Register 2005",
    confidence: 82,
  },
  {
    year: "2012",
    title: "Inheritance (Dakhil Kharij)",
    description: "Mutation #24891 — Property inherited by son after death of Shyam Singh.",
    owner: "Ram Singh",
    ownerHindi: "राम सिंह",
    type: "inheritance",
    document: "Mutation Register 2012",
    confidence: 89,
  },
  {
    year: "2018",
    title: "Partition Deed",
    description: "Part of larger holding partitioned. Area reduced from 1.50 ha to 0.84 ha.",
    owner: "Ram Singh",
    ownerHindi: "राम सिंह",
    type: "mutation",
    document: "Partition Deed 2018",
    confidence: 76,
  },
  {
    year: "2023",
    title: "Sale Deed Registered",
    description: "Sold to Mohan Singh via registered sale deed. Registration #DDN/2023/4582.",
    owner: "Mohan Singh",
    ownerHindi: "मोहन सिंह",
    type: "sale",
    document: "Sale Deed 2023",
    confidence: 95,
  },
  {
    year: "2026",
    title: "Digital Record Created",
    description: "Digitized by BhumiDrishti AI. Verified by District Officer.",
    owner: "Mohan Singh",
    ownerHindi: "मोहन सिंह",
    type: "current",
    document: "BhumiDrishti Record",
    confidence: 94,
  },
];

export default function OwnershipTimeline({
  khasra,
  village,
  entries,
}: OwnershipTimelineProps) {
  const timeline = entries || DEMO_TIMELINE;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ marginBottom: 4 }}>
          ⏱️ Ownership History — Khasra {khasra}, {village}
        </h4>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          {timeline.length} ownership events tracked across{" "}
          {parseInt(timeline[timeline.length - 1]?.year || "0") -
            parseInt(timeline[0]?.year || "0")}{" "}
          years
        </p>
      </div>

      {/* Owner Chain Summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {timeline.map((entry, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background:
                  i === timeline.length - 1
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  i === timeline.length - 1
                    ? "rgba(16, 185, 129, 0.3)"
                    : "var(--glass-border)"
                }`,
                fontSize: "0.8rem",
                fontWeight: i === timeline.length - 1 ? 600 : 400,
                color:
                  i === timeline.length - 1
                    ? "var(--accent-color)"
                    : "var(--text-secondary)",
              }}
            >
              {entry.owner}
            </div>
            {i < timeline.length - 1 && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Full Timeline */}
      <div className="timeline">
        {timeline.map((entry, i) => (
          <div
            className="timeline-event"
            key={i}
            style={{
              cursor: "pointer",
              borderColor:
                expandedIdx === i ? "var(--primary-color)" : undefined,
            }}
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
          >
            <div
              className="timeline-date"
              style={{ color: TYPE_COLORS[entry.type] || "var(--primary-color)" }}
            >
              {TYPE_ICONS[entry.type] || "📋"} {entry.year} — {entry.title}
            </div>

            <div style={{ fontWeight: 500, marginBottom: 4, fontSize: "1rem" }}>
              {entry.ownerHindi || entry.owner}
              {entry.ownerHindi && (
                <span
                  style={{
                    color: "var(--text-secondary)",
                    fontWeight: 400,
                    marginLeft: 8,
                    fontSize: "0.85rem",
                  }}
                >
                  ({entry.owner})
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {entry.description}
            </div>

            {/* Expanded Details */}
            {expandedIdx === i && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {entry.document && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: "0.8rem", color: "var(--primary-color)" }}>
                      📄 Source: {entry.document}
                    </span>
                  </div>
                )}
                {entry.confidence !== undefined && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Extraction Confidence:
                    </span>
                    <span
                      className={`badge ${
                        entry.confidence >= 85
                          ? "badge-verified"
                          : entry.confidence >= 70
                          ? "badge-pending"
                          : "badge-error"
                      }`}
                      style={{ fontSize: "0.65rem" }}
                    >
                      {entry.confidence}%
                    </span>
                  </div>
                )}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Type: {entry.type.replace(/_/g, " ")} • Event {i + 1} of{" "}
                  {timeline.length}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Anti-hallucination Notice */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 16px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px dashed var(--warning-color)",
          fontSize: "0.75rem",
          color: "var(--warning-color)",
        }}
      >
        ⚠ Timeline is reconstructed from extracted documents. Some events may be
        incomplete if source documents are missing or unreadable.
      </div>
    </div>
  );
}
