"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/lib/context/roleContext";

const NAVIGATION = [
  {
    section: "Intelligence",
    items: [
      { href: "/", icon: "📊", label: "Dashboard" },
      { href: "/upload", icon: "📤", label: "Upload & Process" },
      { href: "/records", icon: "📋", label: "Land Records" },
    ],
  },
  {
    section: "Verification",
    items: [
      { href: "/verify", icon: "✅", label: "Verification Queue" },
      { href: "/documents", icon: "📄", label: "Documents" },
    ],
  },
  {
    section: "GIS / Spatial",
    items: [
      { href: "/gis", icon: "🗺️", label: "Land Twin Map" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/audit", icon: "🔍", label: "Audit Trail" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, roleName, roleId, switchRole } = useRole();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <span style={{ fontSize: "1.8rem" }}>🏛️</span>
        <div>
          <h1 className="text-gradient" style={{ fontSize: "1.3rem", marginBottom: 0 }}>
            BhumiDrishti
          </h1>
          <span
            style={{
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Land Record AI
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAVIGATION.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              // Relabel Verification Queue based on role
              let label = item.label;
              if (item.href === "/verify" && role === "admin") {
                label = "Verification Log";
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Role Switcher & User Profile Card */}
      <div
        style={{
          marginTop: "auto",
          padding: "14px",
          borderTop: "1px solid #e2e8f0",
          background: role === "admin" ? "#f8fafc" : "#f0fdf4",
          borderRadius: "10px",
          border: role === "admin" ? "1px solid #e2e8f0" : "1px solid #bbf7d0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: 10 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background:
                role === "admin"
                  ? "linear-gradient(135deg, #4A2BC2, #6366f1)"
                  : "linear-gradient(135deg, #059669, #10b981)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {roleId}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {role === "admin" ? "Admin User" : "Revenue Officer"}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: role === "admin" ? "#64748b" : "#047857",
                fontWeight: 500,
              }}
            >
              {role === "admin" ? "District Officer (DRO)" : "Auditor / Tehsildar"}
            </div>
          </div>
        </div>

        {/* Role Select Dropdown */}
        <div style={{ marginBottom: 8 }}>
          <label
            htmlFor="role-select"
            style={{
              display: "block",
              fontSize: "0.65rem",
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Active User Role:
          </label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => switchRole(e.target.value as "admin" | "officer")}
            style={{
              width: "100%",
              padding: "6px 8px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: role === "admin" ? "1px solid #cbd5e1" : "1px solid #86efac",
              background: "#ffffff",
              color: "#0f172a",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="admin">🏛️ District Admin (DRO)</option>
            <option value="officer">🔍 Officer / Auditor (RO)</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {role === "admin" ? (
            <>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  background: "#dcfce7",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                ADMIN
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  border: "1px solid #c7d2fe",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                SUPERVISORY
              </span>
            </>
          ) : (
            <>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  background: "#fef3c7",
                  color: "#b45309",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                OFFICER
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "2px 8px",
                  background: "#dbeafe",
                  color: "#1e40af",
                  border: "1px solid #bfdbfe",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                AUDITOR / VERIFIER
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <span
          className="ux4g-badge ux4g-badge-info"
          style={{
            fontSize: "0.65rem",
            padding: "4px 10px",
            background: "#f1f5f9",
            color: "#475569",
            border: "1px solid #cbd5e1",
          }}
        >
          🇮🇳 UX4G 3.2.0 Gov System
        </span>
      </div>
    </aside>
  );
}

