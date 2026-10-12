import { setTheme, useTheme } from "../../state/theme";
/** Plain header: heart glyph and title. Purely visual; it carries no data and no claim. */
export function BrandStrip() {
  return (
    <header className="brand" data-testid="brand-strip">
      <svg className="brand-heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.2s-8.4-5.1-8.4-11.3C3.6 6.7 5.9 4.6 8.5 4.6c1.5 0 2.8.7 3.5 1.9.7-1.2 2-1.9 3.5-1.9 2.6 0 4.9 2.1 4.9 5.3 0 6.2-8.4 11.3-8.4 11.3z" /></svg>
      <div><div className="brand-title">Coronary artery assessment</div><div className="brand-sub">Machine-learning decision support · educational use</div></div>
      <ThemeToggle />
    </header>
  );
}
function ThemeToggle() {
  const theme = useTheme(); const dark = theme === "dark";
  return <button type="button" className="btn mini theme-toggle" data-testid="theme-toggle" aria-pressed={dark} onClick={() => setTheme(dark ? "light" : "dark")}>{dark ? "Light mode" : "Dark mode"}</button>;
}
