import { Component, type ReactNode } from "react";
/** A WebGL/3D failure must not take down the dashboard: the cards and panels carry all the information. */
export class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <div className="banner warn" role="alert" data-testid="viewer-failed"><strong>3D view unavailable.</strong> Your browser could not start the 3D viewer. All probabilities are still shown in the cards below.</div> : this.props.children; }
}
