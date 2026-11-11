"use client";

import { useEffect, useRef, useState } from "react";

export default function GovHeader() {
  const [lang, setLang] = useState<"hi" | "en">("en");
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--gov-header-height",
        `${el.getBoundingClientRect().height}px`
      );
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="gov-header-wrapper">
      {/* 1. Indian Tricolor Bar */}
      <div className="gov-tricolor-bar">
        <div className="tricolor-saffron" />
        <div className="tricolor-white" />
        <div className="tricolor-green" />
      </div>

      {/* 2. Top Accessibility & Ministry Bar */}
      <div className="gov-top-bar">
        <div className="gov-top-bar-container">
          <div className="gov-ministry-text">
            <span>🇮🇳 भारत सरकार | GOVERNMENT OF INDIA</span>
            <span className="gov-bar-divider">|</span>
            <span>ग्रामीण विकास मंत्रालय | MINISTRY OF RURAL DEVELOPMENT</span>
            <span className="gov-bar-divider">|</span>
            <span>भूमि संसाधन विभाग | DEPARTMENT OF LAND RESOURCES</span>
          </div>

          <div className="gov-accessibility-tools">
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Font Size:</span>
            <button className="gov-font-btn" title="Decrease font size">A-</button>
            <button className="gov-font-btn" title="Reset font size">A</button>
            <button className="gov-font-btn" title="Increase font size">A+</button>
            <span className="gov-bar-divider">|</span>
            <select
              className="gov-lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as "hi" | "en")}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Official Portal Brand Masthead */}
      <div className="gov-masthead">
        <div className="gov-masthead-container">
          <div className="gov-brand-left">
            <div className="gov-emblem-box">
              <span className="gov-emblem-icon">🏛️</span>
            </div>
            <div className="gov-brand-titles">
              <div className="gov-bilingual-title">
                <span className="gov-title-hindi">भू-दृष्टि</span>
                <span className="gov-title-main">Bhoo-Drishti</span>
              </div>
              <p className="gov-subtitle">
                राष्ट्रीय भूमि अभिलेख डिजिटलीकरण एवं सत्यापन पोर्टल
              </p>
              <p className="gov-sub-caption">
                Digital India Land Records Modernization Programme (DILRMP) • Govt of India
              </p>
            </div>
          </div>

          <div className="gov-brand-right">
            <div className="gov-badge-box">
              <span className="ux4g-badge ux4g-badge-secondary" style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                🛡️ Digital India
              </span>
              <span className="ux4g-badge ux4g-badge-info" style={{ background: "#f5f3ff", color: "#5b21b6", border: "1px solid #ddd6fe" }}>
                🇮🇳 UX4G Standard Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
