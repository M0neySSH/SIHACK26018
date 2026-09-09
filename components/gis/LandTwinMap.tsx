"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { demoParcels, type DemoParcel } from "../../lib/gis/demoData";
import type { FeatureCollection } from "geojson";


// ---- Parcel Status Colors ----
const STATUS_COLORS: Record<string, string> = {
  verified: "#10b981",
  needs_review: "#f59e0b",
  conflict: "#ef4444",
  low_confidence: "#f97316",
  incomplete: "#6b7280",
  pending: "#8b5cf6",
};

const STATUS_ICONS: Record<string, string> = {
  verified: "✓",
  needs_review: "!",
  conflict: "⚠",
  low_confidence: "?",
  incomplete: "░",
  pending: "⏳",
};

// ---- Fit to Bounds Component ----
function FitBounds({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    if (geojson.features.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const L = require("leaflet");
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geojson, map]);
  return null;
}

// ---- Main Map Component ----
export default function LandTwinMap() {
  const router = useRouter();
  const [selectedParcel, setSelectedParcel] = useState<DemoParcel | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [conflictMode, setConflictMode] = useState(false);

  const filteredParcels = useMemo(() => {
    let parcels = demoParcels;
    if (filter !== "all") {
      parcels = parcels.filter((p) => p.status === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      parcels = parcels.filter(
        (p) =>
          p.khasra_number.toLowerCase().includes(q) ||
          p.village.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q)
      );
    }
    return parcels;
  }, [filter, searchQuery]);

  const geojsonData: FeatureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: filteredParcels
        .filter((p) => p.geometry)
        .map((p) => ({
          type: "Feature" as const,
          properties: {
            id: p.id,
            khasra: p.khasra_number,
            village: p.village,
            owner: p.owner,
            status: p.status,
            area: p.area,
            area_unit: p.area_unit,
            confidence: p.confidence,
            health_score: p.health_score,
          },
          geometry: p.geometry!,
        })),
    }),
    [filteredParcels]
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh)", position: "relative" }}>
      {/* Search / Filter Bar */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: selectedParcel ? 380 : 16,
          zIndex: 1000,
          display: "flex",
          gap: 8,
        }}
      >
        <input
          className="ux4g-input ux4g-input-md"
          style={{ flex: 1, background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)" }}
          placeholder="🔍 Search Khasra Number, Owner Name, Village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="ux4g-input ux4g-input-md"
          style={{ width: 180, background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.1)" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Parcels</option>
          <option value="verified">✓ Verified</option>
          <option value="needs_review">! Needs Review</option>
          <option value="conflict">⚠ Conflict</option>
          <option value="low_confidence">? Low Confidence</option>
          <option value="incomplete">░ Incomplete</option>
        </select>
        <button
          className={`ux4g-btn ux4g-btn-sm ${conflictMode ? "ux4g-btn-danger" : "ux4g-btn-secondary"}`}
          style={{ background: conflictMode ? "rgba(239,68,68,0.2)" : undefined, whiteSpace: "nowrap" }}
          onClick={() => {
            setConflictMode(!conflictMode);
            if (!conflictMode) setFilter("conflict");
            else setFilter("all");
          }}
        >
          {conflictMode ? "⚠ Exit Conflict Mode" : "⚠ Conflict Mode"}
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[30.32, 78.03]}
          zoom={13}
          style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            key={JSON.stringify(filteredParcels.map((p) => p.id))}
            data={geojsonData}
            style={(feature) => {
              const status = feature?.properties?.status || "pending";
              const isSelected = selectedParcel?.id === feature?.properties?.id;
              return {
                color: isSelected ? "#60a5fa" : STATUS_COLORS[status] || "#6b7280",
                weight: isSelected ? 4 : 2,
                opacity: 0.9,
                fillColor: STATUS_COLORS[status] || "#6b7280",
                fillOpacity: isSelected ? 0.35 : 0.2,
              };
            }}
            onEachFeature={(feature, layer) => {
              if (feature.properties.status === "conflict") {
                // Add conflict class for CSS animation
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).options.className = "conflict-polygon";
              }
              layer.bindTooltip(
                `<strong>Khasra ${feature.properties.khasra}</strong><br/>${feature.properties.village}<br/>Owner: ${feature.properties.owner}<br/>${STATUS_ICONS[feature.properties.status] || ""} ${feature.properties.status.replace(/_/g, " ")}`,
                { className: "parcel-tooltip", sticky: true }
              );
              layer.on("click", () => {
                const parcel = demoParcels.find((p) => p.id === feature.properties.id);
                if (parcel) {
                  setSelectedParcel(parcel);
                  setShowTimeline(false);
                }
              });
            }}
          />
          <FitBounds geojson={geojsonData} />
        </MapContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 16,
          zIndex: 1000,
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid #cbd5e1",
          padding: "14px 18px",
          fontSize: "0.78rem",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.1)",
          minWidth: 170,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, color: "#0f172a", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Map Legend
        </div>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div
            key={status}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: color,
                border: `2px solid ${color}`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#334155", fontWeight: 500, textTransform: "capitalize" }}>
              {STATUS_ICONS[status]} {status.replace(/_/g, " ")}
            </span>
          </div>
        ))}
        <div style={{ marginTop: 10, color: "#b45309", fontStyle: "italic", fontSize: "0.7rem", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
          ⚠ Demo data — not actual cadastral boundaries
        </div>
      </div>

      {/* DEMO badge */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 16,
          zIndex: 1000,
        }}
      >
        <span className="badge badge-demo" style={{ fontSize: "0.7rem" }}>
          🏷️ DEMO DATA — Not actual cadastral boundaries
        </span>
      </div>

      {/* Parcel Detail Panel */}
      {selectedParcel && (
        <div
          className="slide-in-right"
          style={{
            width: 360,
            background: "#ffffff",
            borderLeft: "1px solid #cbd5e1",
            overflow: "auto",
            padding: 24,
            boxShadow: "-4px 0 20px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "1.1rem" }}>🏛️ Parcel Intelligence</h3>
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => setSelectedParcel(null)}
              style={{ width: 32, height: 32, fontSize: "0.9rem" }}
            >
              ✕
            </button>
          </div>

          {/* Identity */}
          <div style={{ marginBottom: 20 }}>
            <div className="sidebar-section-label" style={{ padding: 0, marginBottom: 8 }}>
              📍 Parcel Identity
            </div>
            {[
              ["Khasra No", selectedParcel.khasra_number],
              ["Village", selectedParcel.village],
              ["Tehsil", selectedParcel.tehsil],
              ["District", selectedParcel.district],
              ["State", selectedParcel.state],
            ].map(([label, val]) => (
              <div key={label} className="field-card" style={{ marginBottom: 6, padding: "8px 12px" }}>
                <div className="field-label">{label}</div>
                <div style={{ fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ marginBottom: 20 }}>
            <div className="sidebar-section-label" style={{ padding: 0, marginBottom: 8 }}>
              📐 Details
            </div>
            <div className="field-card" style={{ marginBottom: 6, padding: "8px 12px" }}>
              <div className="field-label">Area</div>
              <div style={{ fontWeight: 500 }}>{selectedParcel.area} {selectedParcel.area_unit}</div>
            </div>
            <div className="field-card" style={{ marginBottom: 6, padding: "8px 12px" }}>
              <div className="field-label">Classification</div>
              <div style={{ fontWeight: 500 }}>{selectedParcel.classification}</div>
            </div>
          </div>

          {/* Owner */}
          <div style={{ marginBottom: 20 }}>
            <div className="sidebar-section-label" style={{ padding: 0, marginBottom: 8 }}>
              👤 Owner
            </div>
            <div className="field-card" style={{ padding: "8px 12px" }}>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{selectedParcel.owner}</div>
              {selectedParcel.owner_hindi && (
                <div style={{ color: "var(--text-secondary)", marginTop: 2 }}>
                  {selectedParcel.owner_hindi}
                </div>
              )}
            </div>
          </div>

          {/* Health */}
          <div style={{ marginBottom: 20 }}>
            <div className="sidebar-section-label" style={{ padding: 0, marginBottom: 8 }}>
              🏥 Record Health
            </div>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "12px 0" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color:
                      selectedParcel.health_score >= 85
                        ? "var(--accent-color)"
                        : selectedParcel.health_score >= 70
                        ? "var(--warning-color)"
                        : "var(--danger-color)",
                  }}
                >
                  {selectedParcel.health_score}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>/ 100</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    color:
                      selectedParcel.confidence >= 85
                        ? "var(--accent-color)"
                        : "var(--warning-color)",
                  }}
                >
                  {selectedParcel.confidence}%
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Confidence</div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <div className="sidebar-section-label" style={{ padding: 0, marginBottom: 8 }}>
              ✅ Validation
            </div>
            <span
              className={`badge badge-${
                selectedParcel.status === "verified"
                  ? "verified"
                  : selectedParcel.status === "conflict"
                  ? "error"
                  : "pending"
              }`}
              style={{ fontSize: "0.8rem", padding: "6px 16px" }}
            >
              {STATUS_ICONS[selectedParcel.status]}{" "}
              {selectedParcel.status.replace(/_/g, " ").toUpperCase()}
            </span>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-demo">Geometry: DEMO (Type A)</span>
            </div>
          </div>

          {/* Conflict Explanation */}
          {selectedParcel.conflict && (
            <div
              style={{
                background: "var(--danger-glow)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--danger-color)", marginBottom: 8 }}>
                ⚠ Conflict Detected
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>Type:</strong> {selectedParcel.conflict.type}
                <br />
                <strong>Historical:</strong> {selectedParcel.conflict.historical_value}
                <br />
                <strong>Current:</strong> {selectedParcel.conflict.current_value}
                <br />
                <strong>Rule:</strong> {selectedParcel.conflict.rule_id}
              </div>
            </div>
          )}

          {/* Timeline Toggle */}
          <div style={{ marginBottom: 20 }}>
            <button
              className={`btn ${showTimeline ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "100%" }}
              onClick={() => setShowTimeline(!showTimeline)}
            >
              ⏱️ {showTimeline ? "Hide" : "Show"} Timeline
            </button>
          </div>

          {/* Timeline */}
          {showTimeline && selectedParcel.timeline && (
            <div className="timeline" style={{ paddingLeft: 24 }}>
              {selectedParcel.timeline.map((event, i) => (
                <div className="timeline-event" key={i} style={{ padding: 14 }}>
                  <div className="timeline-date">{event.year}</div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{event.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                    {event.description}
                  </div>
                  {event.document && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--primary-color)",
                        marginTop: 6,
                        cursor: "pointer",
                      }}
                    >
                      📄 {event.document} →
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="ux4g-btn ux4g-btn-primary ux4g-btn-md"
              style={{ width: "100%" }}
              onClick={() => router.push("/records")}
            >
              📋 View Full Record
            </button>
            <button
              className="ux4g-btn ux4g-btn-secondary ux4g-btn-md"
              style={{ width: "100%" }}
              onClick={() => router.push("/verify")}
            >
              ✅ Verify Record
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .parcel-tooltip {
          background: rgba(10, 15, 30, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          color: #f0f4ff !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 0.8rem !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        }
        .parcel-tooltip::before {
          border-top-color: rgba(10, 15, 30, 0.95) !important;
        }
        .leaflet-container {
          background: #0a0f1e !important;
        }
      `}</style>
    </div>
  );
}
