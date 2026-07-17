import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message ?? "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Unable to preload CSS") ||
      error?.name === "ChunkLoadError";
    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        window.location.reload();
        return null;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#FAF7F4",
            fontFamily: "Lato, sans-serif",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: "20px" }}>
            <circle cx="24" cy="24" r="22" stroke="#9B0F5F" strokeWidth="2" />
            <path d="M24 14v14" stroke="#9B0F5F" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="34" r="1.5" fill="#9B0F5F" />
          </svg>
          <h2
            style={{
              color: "#1a0a0f",
              fontSize: "22px",
              fontWeight: "700",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "#6b5248",
              fontSize: "15px",
              marginBottom: "28px",
              textAlign: "center",
              maxWidth: "340px",
              lineHeight: "1.6",
            }}
          >
            We hit an unexpected error. Your cart and orders are safe — please refresh to continue shopping.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#9B0F5F",
              color: "white",
              padding: "13px 32px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: "700",
              fontFamily: "Lato, sans-serif",
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
