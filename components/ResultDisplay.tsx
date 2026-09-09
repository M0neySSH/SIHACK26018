"use client";

import { Download } from "lucide-react";
import { exportToExcel } from "../utils/excelExport";

export default function ResultDisplay({ data, type, filename }: { data: any, type: "invoice"|"challan", filename: string }) {
  if (!data) return null;

  const handleDownload = () => {
    exportToExcel(data, type, `${filename.split('.')[0]}_extracted.xlsx`);
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span style={{ color: "var(--text-secondary)" }}>N/A</span>;
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const rootKeys = Object.keys(data).filter(k => typeof data[k] !== "object" || data[k] === null);
  const objectKeys = Object.keys(data).filter(k => typeof data[k] === "object" && data[k] !== null && !Array.isArray(data[k]));
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="stack fade-in" style={{ marginTop: "40px", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "16px" }}>
        <h2>Extraction Results</h2>
        <button className="btn btn-success" onClick={handleDownload}>
          <Download size={18} /> Download Excel
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ marginBottom: "16px", color: "var(--primary-color)" }}>General Details</h3>
          <div className="stack" style={{ gap: "10px" }}>
            {rootKeys.map(key => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{key.replace(/_/g, ' ')}:</span>
                <span style={{ fontWeight: 500, textAlign: "right" }}>{renderValue(data[key])}</span>
              </div>
            ))}
          </div>
        </div>

        {objectKeys.map(objKey => (
          <div key={objKey} className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", color: "var(--secondary-color)", textTransform: "capitalize" }}>{objKey.replace(/_/g, ' ')}</h3>
            <div className="stack" style={{ gap: "10px" }}>
              {Object.keys(data[objKey]).map(k => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>{k.replace(/_/g, ' ')}:</span>
                  <span style={{ fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{renderValue(data[objKey][k])}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ marginBottom: "16px", color: "var(--accent-color)" }}>Line Items ({items.length})</h3>
          <div className="result-table-wrapper">
            <table className="result-table">
              <thead>
                <tr>
                  {Object.keys(items[0]).map(k => (
                    <th key={k}>{k.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={idx}>
                    {Object.keys(items[0]).map(k => (
                      <td key={k}>{renderValue(item[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
