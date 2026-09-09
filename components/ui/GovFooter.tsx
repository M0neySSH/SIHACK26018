"use client";

export default function GovFooter() {
  return (
    <footer className="gov-footer-wrapper">
      <div className="gov-footer-container">
        <div className="gov-footer-links">
          <a href="#" onClick={(e) => e.preventDefault()}>Website Policies</a>
          <span>|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Help & Support</a>
          <span>|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact Us</a>
          <span>|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Feedback</a>
          <span>|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <span>|</span>
          <a href="#" onClick={(e) => e.preventDefault()}>RTI Portal</a>
        </div>

        <div className="gov-footer-meta">
          <p>
            Portal Content Owned & Managed by <strong>Department of Land Resources (DoLR)</strong>, Ministry of Rural Development, Government of India.
          </p>
          <p style={{ marginTop: 4 }}>
            Designed, Developed and Hosted by <strong>National Informatics Centre (NIC)</strong> / <strong>MeitY</strong>.
          </p>
        </div>

        <div className="gov-footer-sub">
          <span>Last Updated: 09 Sep 2026</span>
          <span>•</span>
          <span>DILRMP Portal Version 3.2.0</span>
          <span>•</span>
          <span>UX4G Design System (MeitY)</span>
        </div>
      </div>
    </footer>
  );
}
