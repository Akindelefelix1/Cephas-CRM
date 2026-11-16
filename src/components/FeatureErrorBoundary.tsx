import { Component, type ErrorInfo, type ReactNode } from "react";

type FeatureErrorBoundaryProps = { children: ReactNode };
type FeatureErrorBoundaryState = { failed: boolean };

/** Keeps route-level lazy import/render failures inside the app shell. */
export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  state: FeatureErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): FeatureErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error("A workspace section failed to load", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="empty-state" role="alert">
          <b>This section could not be opened</b>
          <span>Reload the app to retry loading the latest version.</span>
          <button
            className="btn secondary"
            onClick={() => window.location.reload()}
          >
            Reload app
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
