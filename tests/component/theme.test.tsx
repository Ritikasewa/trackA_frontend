import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BrandStrip } from "../../src/components/layout/BrandStrip";
import { setTheme } from "../../src/state/theme";
beforeEach(() => { window.localStorage.clear(); setTheme("light"); window.localStorage.clear(); });
afterEach(cleanup);
describe("theme toggle", () => {
  it("defaults to light and switches the document theme, the label and the saved choice", () => {
    render(<BrandStrip />); const b = screen.getByTestId("theme-toggle");
    expect(document.documentElement.dataset.theme).toBe("light"); expect(b.textContent).toBe("Dark mode"); expect(b.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(b);
    expect(document.documentElement.dataset.theme).toBe("dark"); expect(b.textContent).toBe("Light mode"); expect(b.getAttribute("aria-pressed")).toBe("true"); expect(window.localStorage.getItem("tracka-theme")).toBe("dark");
    fireEvent.click(b);
    expect(document.documentElement.dataset.theme).toBe("light"); expect(window.localStorage.getItem("tracka-theme")).toBe("light");
  });
  it("keeps working when storage is unavailable", () => {
    const orig = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error("blocked"); };
    try { render(<BrandStrip />); fireEvent.click(screen.getByTestId("theme-toggle")); expect(document.documentElement.dataset.theme).toBe("dark"); } finally { Storage.prototype.setItem = orig; }
  });
});
