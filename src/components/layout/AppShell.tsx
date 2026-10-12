import { useEffect, useState } from "react";
import { navigate, useRoute } from "../../state/route";
import { useStore } from "../../state/store";
import { PatientForm } from "../form/PatientForm";
import { ShapPage } from "../shap/ShapPage";
import { Workspace } from "../results/Workspace";
import { BrandStrip } from "./BrandStrip";
import { DisclaimerBanner } from "./DisclaimerBanner";
export function AppShell() {
  const [tab, setTab] = useState<"input" | "results">("input"); const status = useStore((s) => s.status); const loadMeta = useStore((s) => s.loadMeta);
  useEffect(() => { void loadMeta(); }, [loadMeta]);
  useEffect(() => { if (status === "loading") setTab("results"); }, [status]);
  const route = useRoute();
  const back = () => { setTab("results"); navigate("results"); };
  const goSafety = () => { if (route === "results") setTab("results"); requestAnimationFrame(() => document.getElementById("safety-next-steps")?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  return (
    <div className="app" data-tab={tab} data-route={route}>
      <DisclaimerBanner onSafety={goSafety} />
      <BrandStrip />
      {route === "explain" ? <main className="shap-main" aria-label="SHAP analysis"><ShapPage onBack={back} /></main> : (<>
        <nav className="tabs" aria-label="Sections"><button className={tab === "input" ? "on" : ""} onClick={() => setTab("input")}>Patient input</button><button className={tab === "results" ? "on" : ""} onClick={() => setTab("results")}>Results &amp; 3D</button></nav>
        <main className="layout"><aside className="pane input"><PatientForm /></aside><section className="pane results" aria-label="Results"><Workspace /></section></main>
      </>)}
    </div>
  );
}
