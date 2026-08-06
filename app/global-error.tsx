"use client";
import { useEffect } from "react";

/** Catches errors in the root layout itself (theme provider, fonts, etc.) —
 *  a rarer case than app/error.tsx, but if it happens the normal error
 *  boundary can't render either, since it lives inside the broken layout.
 *  Kept dependency-free (no CSS vars, no icons) since even globals.css
 *  might not be safely available here. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global error]");
  }, []);

  return (
    <html>
      <body style={{ background: "#0b0f0d", color: "#e8ede9", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>The app failed to load</h1>
          <p style={{ maxWidth: 420, fontSize: 13, lineHeight: 1.6, color: "#9aa89f" }}>
            Something broke before the page could render. Your data is unaffected — try reloading.
          </p>
          <button onClick={reset}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #2a332c", background: "#141a16", color: "#e8ede9", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
