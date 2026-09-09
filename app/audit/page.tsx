"use client";

export default function AuditPage() {
  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <h1 style={{ color: "#0b192c", fontSize: "1.8rem", fontWeight: 700 }}>
          अंकेक्षण लॉग | System Audit Trail
        </h1>
        <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: 4 }}>
          Tamper-evident audit log — every extraction, edit, and officer verification timestamped and attributed
        </p>
      </div>

      <div className="glass-card fade-in" style={{ padding: 32 }}>
        <div className="timeline">
          {[
            { time: "Today, 14:02:30", action: "Record Verified", detail: "Khasra 124/2, Rampur — Owner field corrected", user: "verifier@district.gov.in" },
            { time: "Today, 13:58:12", action: "Document Processed", detail: "Hindi Khasra PDF — 3 pages, Confidence 94%", user: "system" },
            { time: "Today, 13:55:00", action: "Document Uploaded", detail: "khasra_rampur_2018.pdf — 1.2 MB", user: "admin@district.gov.in" },
            { time: "Yesterday, 16:30:00", action: "Conflict Flagged", detail: "Area mismatch on Khasra 126/1 — 0.84 vs 0.72 ha", user: "system" },
            { time: "Yesterday, 14:10:00", action: "Batch Upload", detail: "5 documents uploaded for Kalsi tehsil", user: "data_entry@gov.in" },
          ].map((entry, i) => (
            <div className="timeline-event" key={i}>
              <div className="timeline-date">{entry.time}</div>
              <div style={{ fontWeight: 500 }}>{entry.action}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>
                {entry.detail}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                by {entry.user}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
