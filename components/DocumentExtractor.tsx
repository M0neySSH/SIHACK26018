"use client";

import { useState } from "react";
import { UploadCloud, Camera, FileText, Loader2 } from "lucide-react";
import { convertFileToImages } from "../utils/pdfToImage";
import { parseDocumentImages } from "../utils/llmParser";
import ResultDisplay from "./ResultDisplay";

export default function DocumentExtractor({ type }: { type: "invoice" | "challan" }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      setStatus("Converting document to images...");
      const images = await convertFileToImages(file);
      
      setStatus(`Extracting data from ${images.length} page(s) using AI...`);
      const extractedData = await parseDocumentImages(images, type);
      
      setResult(extractedData);
      setStatus("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "40px 20px" }}>
      <div className="glass-card" style={{ padding: "30px", marginBottom: "30px" }}>
        <h1 style={{ textTransform: "capitalize", marginBottom: "8px" }} className="text-gradient">
          {type} Extractor
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
          Upload a PDF or an Image of a {type} to instantly extract structured information.
        </p>

        <div className="stack" style={{ gap: "20px" }}>
          <label className="upload-area">
            <UploadCloud size={48} style={{ color: "var(--primary-color)", marginBottom: "16px" }} />
            <h3>Click to Upload PDF / Image</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "0.9rem" }}>
              or use the camera button below on mobile
            </p>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileSelect} />
          </label>
          
          <label className="btn btn-secondary" style={{ alignSelf: "center" }}>
            <Camera size={18} /> Take Photo
            <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: "none" }} />
          </label>
        </div>

        {file && (
          <div className="fade-in" style={{ marginTop: "24px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <FileText size={24} style={{ color: "var(--secondary-color)" }} />
              <div>
                <div style={{ fontWeight: 500 }}>{file.name}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={handleProcess} disabled={loading}>
              {loading ? <><Loader2 size={18} className="spin" /> Processing...</> : "Extract Data"}
            </button>
          </div>
        )}

        {loading && (
          <div className="fade-in flex-center" style={{ marginTop: "24px", padding: "20px", color: "var(--primary-color)", gap: "12px" }}>
            <Loader2 className="spin" size={24} />
            <span style={{ fontWeight: 500 }}>{status}</span>
          </div>
        )}

        {error && (
          <div className="fade-in" style={{ marginTop: "24px", padding: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", color: "var(--danger-color)" }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {result && <ResultDisplay data={result} type={type} filename={file?.name || "document"} />}
    </div>
  );
}
