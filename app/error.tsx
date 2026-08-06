"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/** Route-level error boundary — Next.js has no default for this, so an
 *  uncaught render error would otherwise show a blank white screen with
 *  nothing the user can do. This gives them a way back in instead. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: "var(--bg)" }}>
      <span className="flex h-11 w-11 items-center justify-center rounded-[12px]"
            style={{ background: "var(--critical-wash)", color: "var(--critical)" }}>
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>Something went wrong loading this page</h1>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
          This is a display error, not a data problem — the underlying plan data is unaffected.
          Try again, or head back to the dashboard.
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2.5">
        <button className="btn btn-ghost" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
        <a href="/" className="btn btn-ghost">
          <Home className="h-3.5 w-3.5" /> Dashboard
        </a>
      </div>
    </div>
  );
}
