"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { convertFileToImages } from "../../utils/pdfToImage";
import { useRole } from "@/lib/context/roleContext";

type ProcessingStage =
  | "idle"
  | "converting"
  | "uploading"
  | "classifying"
  | "extracting"
  | "validating"
  | "complete"
  | "error";

const STAGES = [
  { key: "converting", label: "PDF → Images", icon: "📄" },
  { key: "uploading", label: "Uploading", icon: "📤" },
  { key: "classifying", label: "Classifying", icon: "🏷️" },
  { key: "extracting", label: "AI Extraction", icon: "🤖" },
  { key: "validating", label: "Validation", icon: "✅" },
  { key: "complete", label: "Complete", icon: "🎉" },
];

function getStageClass(
  currentStage: ProcessingStage,
  stageKey: string
): string {
  const order = STAGES.map((s) => s.key);
  const currentIdx = order.indexOf(currentStage);
  const thisIdx = order.indexOf(stageKey);
  if (thisIdx < currentIdx) return "completed";
  if (thisIdx === currentIdx) return "active";
  return "";
}

export default function UploadPage() {
  const { role, roleName } = useRole();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setStage("converting");
      setErrorMsg("");
      setResult(null);

      try {
        // Step 1: Convert PDF to images (or use image directly)
        let base64Images: string[] = [];
        base64Images = await convertFileToImages(file);

        setPreviewImages(base64Images.slice(0, 3)); // Show first 3 pages

        // Step 2: Send to API
        setStage("uploading");
        await new Promise((r) => setTimeout(r, 300)); // UX breath

        setStage("classifying");
        await new Promise((r) => setTimeout(r, 200));

        setStage("extracting");

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Images,
            filename: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Extraction failed");
        }

        const data = await response.json();

        setStage("validating");
        await new Promise((r) => setTimeout(r, 300));

        setStage("complete");
        setResult(data);
      } catch (err) {
        setStage("error");
        setErrorMsg(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="page-container">
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1 style={{ color: "#0b192c", fontSize: "1.8rem", fontWeight: 700 }}>
              दस्तावेज़ अपलोड एवं प्रसंस्करण | Upload & Digitization
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", marginTop: 4 }}>
              Upload scanned land records (PDF, JPG, PNG) — Khasra, Khatauni, Jamabandi, Sale Deeds, Mutation Register
            </p>
          </div>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: role === "admin" ? "#e0e7ff" : "#fef3c7",
              color: role === "admin" ? "#3730a3" : "#b45309",
              border: role === "admin" ? "1px solid #c7d2fe" : "1px solid #fde68a",
            }}
          >
            {role === "admin" ? "🏛️ ADMIN UPLOAD MODE" : "🔒 OFFICER (READ-ONLY)"}
          </span>
        </div>
      </div>

      {role === "officer" && (
        <div
          style={{
            padding: "16px 20px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            color: "#92400e",
            fontSize: "0.9rem",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🔒</span>
          <div>
            <strong>Document Upload Restricted:</strong> Ingesting and processing new scanned land records is restricted to <strong>District Admin</strong> mode. As a Revenue Officer / Auditor, your role is field verification, audit remarks, and record inspection. Switch to Admin mode in the sidebar to upload new documents.
          </div>
        </div>
      )}

      {/* Upload Area */}
      {stage === "idle" && (
        <div
          className={`upload-area fade-in ${dragActive ? "drag-active" : ""}`}
          style={{
            opacity: role === "officer" ? 0.6 : 1,
            cursor: role === "officer" ? "not-allowed" : "pointer",
          }}
          onDragOver={(e) => {
            if (role === "officer") return;
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            if (role === "officer") return;
            handleDrop(e);
          }}
          onClick={() => {
            if (role === "officer") return;
            fileInputRef.current?.click();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            disabled={role === "officer"}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: 16 }}>
              {role === "officer" ? "🔒" : "📤"}
            </span>
            <h3 style={{ marginBottom: 8 }}>
              {role === "officer"
                ? "Upload Restricted in Officer Mode"
                : "Drop your land record here, or click to browse"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {role === "officer"
                ? "Switch to District Admin mode in the left sidebar to upload and process scanned documents."
                : "Supports PDF, JPG, PNG — Scanned documents, Khasra, Khatauni, Jamabandi, Sale Deeds, Mutation Records"}
            </p>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
                alignItems: "center"
              }}
            >
              {["Hindi", "English", "Marathi", "Bengali", "Tamil", "Telugu"].map(
                (lang) => (
                  <span className="ux4g-badge ux4g-badge-info" key={lang}>
                    {lang}
                  </span>
                )
              )}
            </div>

            <div style={{ marginTop: 24 }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="ux4g-btn ux4g-btn-secondary ux4g-btn-sm"
                style={{
                  background: "rgba(74, 43, 194, 0.15)",
                  border: "1px dashed #4A2BC2",
                  color: "#a78bfa"
                }}
                onClick={() => {
                  // Create a sample land record canvas document
                  const canvas = document.createElement("canvas");
                  canvas.width = 800;
                  canvas.height = 1050;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    // Document background
                    ctx.fillStyle = "#faf6ed";
                    ctx.fillRect(0, 0, 800, 1050);

                    // Border
                    ctx.strokeStyle = "#854d0e";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(20, 20, 760, 1010);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(26, 26, 748, 998);

                    // Header
                    ctx.fillStyle = "#1e293b";
                    ctx.font = "bold 24px serif";
                    ctx.textAlign = "center";
                    ctx.fillText("उत्तरप्रदेश सरकार — राजस्व अभिलेख (खतौनी / अधिकार अभिलेख)", 400, 70);
                    ctx.font = "bold 18px serif";
                    ctx.fillText("ग्राम: रायपुर | परगना: देहरादून | तहसील: देहरादून | जिला: देहरादून", 400, 105);
                    ctx.fillText("फसली वर्ष: 1428-1433 | खाता संख्या: 00142", 400, 135);

                    // Divider line
                    ctx.beginPath();
                    ctx.moveTo(40, 155);
                    ctx.lineTo(760, 155);
                    ctx.stroke();

                    // Table headers
                    ctx.font = "bold 14px sans-serif";
                    ctx.textAlign = "left";
                    ctx.fillText("1. खातेदार का नाम / पिता का नाम", 50, 185);
                    ctx.fillText("2. खसरा सं.", 320, 185);
                    ctx.fillText("3. क्षेत्रफल (हे.)", 450, 185);
                    ctx.fillText("4. आदेश / नामांतरण", 600, 185);

                    ctx.beginPath();
                    ctx.moveTo(40, 200);
                    ctx.lineTo(760, 200);
                    ctx.stroke();

                    // Row 1 (Printed)
                    ctx.font = "14px serif";
                    ctx.fillText("राम प्रसाद शर्मा / शिव कुमार शर्मा", 50, 240);
                    ctx.fillText("निवास: रायपुर", 50, 260);
                    ctx.fillText("खसरा 402/1", 320, 240);
                    ctx.fillText("1.2450", 450, 240);
                    ctx.fillText("मूल खातेदार (संक्रमणीय अधिकार)", 600, 240);

                    // Row 2 (Handwritten note simulation)
                    ctx.fillStyle = "#1e3a8a"; // ink blue
                    ctx.font = "italic 13px cursive, sans-serif";
                    ctx.fillText("[हस्तलिखित नामांतरण आदेश]", 50, 310);
                    ctx.fillText("बैनामा सं. 4521/2023 के तहत 0.5000 हे. भू-भाग", 50, 335);
                    ctx.fillText("विक्रम सिंह पुत्र राम प्रसाद शर्मा के नाम दर्ज।", 50, 360);
                    ctx.fillText("दिनांक: 14/08/2023 | तहसीलदार आदेशानुसार", 50, 385);

                    // Stamp / Seal
                    ctx.strokeStyle = "#dc2626";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(650, 340, 45, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = "#dc2626";
                    ctx.font = "bold 10px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("तहसीलदार कार्यालय", 650, 335);
                    ctx.fillText("★ देहरादून ★", 650, 350);

                    const dataUrl = canvas.toDataURL("image/png");
                    // Convert dataUrl to blob/file
                    fetch(dataUrl)
                      .then(res => res.blob())
                      .then(blob => {
                        const file = new File([blob], "Demo_Khatauni_Dehradun_402.png", { type: "image/png" });
                        processFile(file);
                      });
                  }
                }}
              >
                ⚡ Try Demo Document (Khasra 402/1 Hindi Khatauni)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Stages */}
      {stage !== "idle" && (
        <div className="fade-in" style={{ marginBottom: 32 }}>
          <div
            className="glass-card"
            style={{ padding: "24px 32px", marginBottom: 24 }}
          >
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "1.2rem" }}>📄</span>
              <span style={{ fontWeight: 500 }}>{fileName}</span>
              {stage === "error" && (
                <span className="badge badge-error">Error</span>
              )}
              {stage === "complete" && (
                <span className="badge badge-verified">✓ Complete</span>
              )}
            </div>

            <div className="processing-stages">
              {STAGES.map((s, i) => (
                <div className={`stage ${getStageClass(stage, s.key)}`} key={s.key}>
                  <div className="stage-dot">{s.icon}</div>
                  <span className="stage-label">{s.label}</span>
                  {i < STAGES.length - 1 && <div className="stage-connector" />}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {stage === "error" && (
            <div className="glass-card" style={{ padding: 24, borderLeft: "3px solid var(--danger-color)" }}>
              <h4 style={{ color: "var(--danger-color)", marginBottom: 8 }}>
                ⚠️ Processing Error
              </h4>
              <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>
                {errorMsg}
              </p>
              <button className="btn btn-primary" onClick={() => { setStage("idle"); setResult(null); }}>
                Try Again
              </button>
            </div>
          )}

          {/* Results */}
          {stage === "complete" && result && (
            <div className="fade-in">
              {/* Quick Summary */}
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{ color: "var(--primary-color)" }}>
                    {result.record?.metadata?.document_type
                      ?.replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase()) || "Unknown"}
                  </div>
                  <div className="stat-label">Document Type</div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{ color: "var(--info-color)" }}>
                    {result.record?.metadata?.language?.toUpperCase() || "—"}
                  </div>
                  <div className="stat-label">Language</div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{
                    color: (result.quality?.overall_score ?? 0) >= 70
                      ? "var(--accent-color)"
                      : "var(--warning-color)",
                  }}>
                    {result.quality?.overall_score ?? 0}/100
                  </div>
                  <div className="stat-label">Quality Score</div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{
                    color: result.record?.confidence?.document_confidence >= 85
                      ? "var(--accent-color)"
                      : result.record?.confidence?.document_confidence >= 70
                      ? "var(--warning-color)"
                      : "var(--danger-color)",
                  }}>
                    {result.record?.confidence?.document_confidence ?? 0}%
                  </div>
                  <div className="stat-label">Confidence</div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{ color: "var(--accent-color)" }}>
                    {result.health_score?.overall ?? 0}/100
                  </div>
                  <div className="stat-label">Health Score</div>
                </div>
                <div className="glass-card stat-card">
                  <div className="stat-value" style={{ color: "var(--text-secondary)" }}>
                    {result.stats?.total_time_ms
                      ? `${(result.stats.total_time_ms / 1000).toFixed(1)}s`
                      : "—"}
                  </div>
                  <div className="stat-label">Processing Time</div>
                </div>
              </div>

              {/* Split View: Document + Fields */}
              <div className="split-view">
                {/* Document Preview */}
                <div className="glass-card split-view-document" style={{ padding: 0 }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--glass-border)" }}>
                    <h4 style={{ fontSize: "0.95rem" }}>📄 Source Document</h4>
                  </div>
                  <div style={{ padding: 16, maxHeight: "70vh", overflow: "auto" }}>
                    {previewImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Page ${i + 1}`}
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          marginBottom: i < previewImages.length - 1 ? 12 : 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="split-view-fields">
                  <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 16 }}>
                    <h4 style={{ fontSize: "0.95rem", marginBottom: 16 }}>📋 Extracted Fields</h4>

                    {/* Location */}
                    <div style={{ marginBottom: 20 }}>
                      <div className="sidebar-section-label" style={{ padding: "0 0 8px" }}>
                        📍 Location
                      </div>
                      <div className="stack" style={{ gap: 8 }}>
                        {["state", "district", "tehsil", "village"].map((f) => {
                          const field = result.record?.location?.[f];
                          if (!field?.value) return null;
                          return (
                            <div className="field-card" key={f}>
                              <div className="field-label">{f}</div>
                              <div className="field-value">
                                {field.value}
                                <span
                                  className={`badge ${
                                    field.confidence >= 0.85
                                      ? "badge-verified"
                                      : field.confidence >= 0.7
                                      ? "badge-pending"
                                      : "badge-error"
                                  }`}
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  {Math.round(field.confidence * 100)}%
                                </span>
                              </div>
                              <div className="field-meta">
                                {field.text_type && <span>{field.text_type}</span>}
                                {field.region && <span>• {field.region}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Parcel */}
                    <div style={{ marginBottom: 20 }}>
                      <div className="sidebar-section-label" style={{ padding: "0 0 8px" }}>
                        📐 Parcel Details
                      </div>
                      <div className="stack" style={{ gap: 8 }}>
                        {[
                          "survey_number",
                          "khasra_number",
                          "khata_number",
                          "area",
                          "area_unit",
                        ].map((f) => {
                          const field = result.record?.parcel?.[f];
                          if (!field?.value) return null;
                          return (
                            <div className="field-card" key={f}>
                              <div className="field-label">
                                {f.replace(/_/g, " ")}
                              </div>
                              <div className="field-value">
                                {field.value}
                                <span
                                  className={`badge ${
                                    field.confidence >= 0.85
                                      ? "badge-verified"
                                      : field.confidence >= 0.7
                                      ? "badge-pending"
                                      : "badge-error"
                                  }`}
                                  style={{ fontSize: "0.65rem" }}
                                >
                                  {Math.round(field.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Owners */}
                    {result.record?.owners?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div className="sidebar-section-label" style={{ padding: "0 0 8px" }}>
                          👤 Owners
                        </div>
                        <div className="stack" style={{ gap: 8 }}>
                          {result.record.owners.map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (owner: any, i: number) => (
                              <div className="field-card" key={i}>
                                <div className="field-label">Owner {i + 1}</div>
                                <div className="field-value">
                                  {owner.name?.value?.original || owner.name?.value?.romanized || "Unknown"}
                                  <span
                                    className={`badge ${
                                      (owner.name?.confidence ?? 0) >= 0.85
                                        ? "badge-verified"
                                        : (owner.name?.confidence ?? 0) >= 0.7
                                        ? "badge-pending"
                                        : "badge-error"
                                    }`}
                                    style={{ fontSize: "0.65rem" }}
                                  >
                                    {Math.round((owner.name?.confidence ?? 0) * 100)}%
                                  </span>
                                </div>
                                {owner.name?.value?.romanized && (
                                  <div className="field-meta">
                                    <span>Romanized: {owner.name.value.romanized}</span>
                                  </div>
                                )}
                                {owner.name?.text_type === "handwritten" && (
                                  <div className="field-meta">
                                    <span className="badge badge-pending" style={{ fontSize: "0.6rem" }}>
                                      ✍️ Handwritten — Verify
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Validation Results */}
                  {result.validation?.length > 0 && (
                    <div className="glass-card" style={{ padding: "16px 20px" }}>
                      <h4 style={{ fontSize: "0.95rem", marginBottom: 16 }}>
                        ⚠️ Validation Results
                      </h4>
                      {result.validation.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (v: any, i: number) => (
                          <div
                            className={`validation-item ${
                              v.status === "ERROR"
                                ? "validation-error"
                                : v.status === "WARNING"
                                ? "validation-warning"
                                : v.status === "NEEDS_REVIEW"
                                ? "validation-review"
                                : "validation-info"
                            }`}
                            key={i}
                          >
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>
                              {v.status === "ERROR" ? "❌" : v.status === "WARNING" ? "⚠️" : "ℹ️"}{" "}
                              {v.message}
                            </div>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {v.explanation}
                            </div>
                            {v.suggestion && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--primary-color)",
                                  marginTop: 6,
                                }}
                              >
                                💡 {v.suggestion}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button
                      className="ux4g-btn ux4g-btn-primary ux4g-btn-md"
                      onClick={() =>
                        router.push(`/records`)
                      }
                    >
                      📋 View Record
                    </button>
                    <button
                      className="ux4g-btn ux4g-btn-secondary ux4g-btn-md"
                      onClick={() => {
                        setStage("idle");
                        setResult(null);
                        setPreviewImages([]);
                      }}
                    >
                      📤 Upload Another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
