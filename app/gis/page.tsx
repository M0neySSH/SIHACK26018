"use client";

import dynamic from "next/dynamic";

// Leaflet must be loaded client-side only (no SSR)
const LandTwinMap = dynamic(() => import("../../components/gis/LandTwinMap"), {
  ssr: false,
  loading: () => (
    <div className="page-container flex-center" style={{ minHeight: "80vh" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spin" style={{ fontSize: "2rem", marginBottom: 12 }}>🗺️</div>
        <p style={{ color: "var(--text-secondary)" }}>Loading Digital Land Twin...</p>
      </div>
    </div>
  ),
});

export default function GISPage() {
  return <LandTwinMap />;
}
