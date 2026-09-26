"use client";

// Last-resort screen when even the root layout fails (e.g. a missing env var).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#ecebe8", color: "#111" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0 }}>We couldn&apos;t load this page</h1>
            <p style={{ color: "#66665f" }}>Please try again in a moment. Reception can help if it keeps happening.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 12, height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#2d2d2d", color: "#fff", fontSize: 15 }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
