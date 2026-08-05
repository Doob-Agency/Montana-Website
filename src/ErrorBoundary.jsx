import { Component } from "react";

/**
 * A render error anywhere below here used to unmount the whole tree, leaving a
 * white page with no clue as to what happened — the invoice going blank after a
 * successful payment was exactly that, and it read identically to "still
 * loading" and to "request failed".
 *
 * The page now says something and puts the reason in the console, so a blank
 * screen is never the answer again.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("render failed:", error, info && info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const arabic = window.localStorage.getItem("lang") === "العربية";

    return (
      <div className="container">
        <div
          className="text-center py-5"
          style={{ color: "var(--midgray)", fontWeight: "400" }}
        >
          <span className="d-block h4 text-danger mb-3">
            {arabic ? "تعذّر عرض هذه الصفحة" : "This page could not be shown"}
          </span>
          <span className="d-block">
            {arabic
              ? "إن كنت قد أتممت عملية دفع فهي مسجّلة ولم تتأثر."
              : "If you completed a payment, it went through and is unaffected."}
          </span>
          <a href="/" className="btn mt-4 d-inline-block">
            {arabic ? "العودة للرئيسية" : "Back to home"}
          </a>
        </div>
      </div>
    );
  }
}
