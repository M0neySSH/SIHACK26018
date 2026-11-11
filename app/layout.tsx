import type { Metadata } from "next";
import "ux4g-web-components/styles.css";
import "./globals.css";
import Sidebar from "../components/ui/Sidebar";
import GovHeader from "../components/ui/GovHeader";
import GovFooter from "../components/ui/GovFooter";
import ClientProviders from "../components/ui/ClientProviders";

export const metadata: Metadata = {
  title: "भू-दृष्टि | Bhoo-Drishti — National Land Records Modernization Portal",
  description:
    "Digital India Land Records Modernization Programme (DILRMP) — AI-powered Land Record Digitization, Validation, and Interactive GIS Twin Portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ClientProviders>
          <div className="app-global-container">
            <GovHeader />
            <div className="app-layout">
              <Sidebar />
              <main className="app-main">
                {children}
                <GovFooter />
              </main>
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}

