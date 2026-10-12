import { navigate } from "../../state/route";
import { useStore } from "../../state/store";
import { HeartViewer } from "../viewer/HeartViewer";
import { ViewerBoundary } from "../viewer/ViewerBoundary";
import { AboutResults } from "./AboutResults";
import { FatalError, StaleBanner } from "./Banners";
import { ConsistencyWarning } from "./ConsistencyWarning";
import { InputChecksPanel } from "./InputChecksPanel";
import { OverallCadCard } from "./OverallCadCard";
import { SafetyNextSteps } from "./SafetyNextSteps";
import { TechnicalModelDetails } from "./TechnicalModelDetails";
import { VesselCard } from "./VesselCard";
import { VesselDetailPanel } from "./VesselDetailPanel";
export function Workspace() {
  const assessed = useStore((s) => s.assessment !== null); const selected = useStore((s) => s.selected); const setShapTarget = useStore((s) => s.setShapTarget);
  const openShap = () => { setShapTarget(selected ?? "CAD"); navigate("explain"); };   // the selected vessel (if any) opens the SHAP page on that target; otherwise CAD
  return (
    <div className="workspace">
      <div className="results-head"><h2>Model-estimated results</h2><p className="hint">{assessed ? "Estimates from a machine-learning model – not a diagnosis." : "Enter the patient data and press Assess. Results are model estimates, not a diagnosis."}</p></div>
      <StaleBanner /><FatalError /><ConsistencyWarning />
      <div className="hero">
        <ViewerBoundary><HeartViewer /></ViewerBoundary>
        <div className="cards"><OverallCadCard /><VesselCard id="LAD" /><VesselCard id="LCX" /><VesselCard id="RCA" /></div>
      </div>
      <div className="shap-cta" data-testid="shap-cta">
        <button type="button" className="btn primary" disabled={!assessed} onClick={openShap} data-testid="view-shap">View SHAP Analysis</button>
        <span className="hint">{assessed ? "See which inputs influenced each model estimate (CAD, LAD, LCX, RCA)." : "Available after an assessment."}</span>
      </div>
      <VesselDetailPanel />
      <InputChecksPanel />
      <SafetyNextSteps />
      <AboutResults />
      <TechnicalModelDetails />
    </div>
  );
}
