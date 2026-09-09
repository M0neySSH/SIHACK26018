"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("auth_token");
    if (auth === process.env.NEXT_PUBLIC_AUTH_PASSWORD) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_AUTH_PASSWORD) {
      sessionStorage.setItem("auth_token", process.env.NEXT_PUBLIC_AUTH_PASSWORD!);
      setIsAuthenticated(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex-center" style={{ minHeight: "100vh", padding: "20px" }}>
      <div className={`glass-card ${error ? 'shake-animation' : 'fade-in'}`} style={{ padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{ background: "rgba(59, 130, 246, 0.1)", width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-color)" }}>
          <Lock size={32} />
        </div>
        <h2 style={{ marginBottom: "10px" }}>Secure Access</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px", fontSize: "0.95rem" }}>
          Please enter the password to access the extraction dashboard.
        </p>
        
        <form onSubmit={handleSubmit} className="stack">
          <input
            type="password"
            className="input-field"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ borderColor: error ? "var(--danger-color)" : "" }}
          />
          {error && <span style={{ color: "var(--danger-color)", fontSize: "0.85rem", textAlign: "left" }}>Incorrect password.</span>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "10px" }}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
