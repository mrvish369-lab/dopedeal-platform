import { createRoot } from "react-dom/client";
import { Component, ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

// ── Environment variable validation ─────────────────────────────────────────
// Fail fast with a clear message rather than cryptic runtime errors.
const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

const missingVars = REQUIRED_ENV_VARS.filter(
  (key) => !import.meta.env[key]
);

if (missingVars.length > 0) {
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      color: #fff;
      font-family: system-ui, sans-serif;
      padding: 2rem;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #ef4444;">
          ⚠️ Configuration Error
        </h1>
        <p style="color: #a1a1aa; margin-bottom: 0.5rem;">
          The following required environment variables are missing:
        </p>
        <pre style="
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          color: #f87171;
          text-align: left;
        ">${missingVars.join("\n")}</pre>
        <p style="color: #a1a1aa; font-size: 0.875rem;">
          Copy <code style="color: #60a5fa;">.env.example</code> to <code style="color: #60a5fa;">.env</code> and fill in the values.
        </p>
      </div>
    </div>
  `;
  throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
}

// ── Root Error Boundary ──────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console in dev; in production you'd send to an error tracking service
    console.error("[DopeDeal] Unhandled error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#fff",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                color: "#ef4444",
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Mount ────────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
