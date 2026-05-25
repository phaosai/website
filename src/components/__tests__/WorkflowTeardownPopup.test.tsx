import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import WorkflowTeardownPopup from "../WorkflowTeardownPopup";

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

const setPath = (p: string) => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, pathname: p },
  });
};

describe("WorkflowTeardownPopup auto-open suppression", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  for (const path of ["/pricing", "/auth", "/checkout", "/billing", "/billing/manage"]) {
    it(`does NOT auto-open on ${path}`, () => {
      setPath(path);
      render(<WorkflowTeardownPopup />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByText(/World-Class/i)).not.toBeInTheDocument();
    });
  }

  it("auto-opens on a normal page like /", () => {
    setPath("/");
    render(<WorkflowTeardownPopup />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/World-Class/i)).toBeInTheDocument();
  });
});
