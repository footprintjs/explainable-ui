import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { InvestigationPanel } from "../../src/components/InvestigationPanel/InvestigationPanel";
import type { InvestigationPort } from "../../src/components/InvestigationPanel/types";

it("server-renders a collapsed panel without lifecycle warnings or host queries", () => {
  const explain = vi.fn<InvestigationPort["explain"]>(() => {
    throw new Error("server must not query");
  });
  const port: InvestigationPort = {
    binding: {},
    attention: {
      nodes: [{ nodeId: "visit:SSR", attention: [] }],
      confidence: "complete",
      gaps: [],
    },
    explain,
  };
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const html = renderToString(<InvestigationPanel port={port} />);
    expect(html).toContain("Needs attention");
    expect(html).toContain("Investigate");
    expect(html).not.toContain("Loading explanation");
    expect(explain).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  } finally {
    errors.mockRestore();
  }
});
