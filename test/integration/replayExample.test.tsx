/** @vitest-environment jsdom */
/**
 * The replay example, mounted.
 *
 * `examples/replay-a-recording/` is the answer to "I have a run — show it",
 * and its `run.json` came out of a REAL footprintjs run (`record.mjs`). This
 * test mounts the example's own component against that file, so the example
 * cannot drift into being a snippet that no longer works — which is exactly
 * what the README snippet it replaces had become (it omitted `traceGraph`,
 * the one prop without which nothing draws).
 *
 * OLD BEHAVIOUR: there is no example to mount, and the composition it shows
 * (`graphFromStructure` + a snapshot-derived overlay) does not exist.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";

import { Replay } from "../../examples/replay-a-recording/Replay";
import recording from "../../examples/replay-a-recording/run.json";
import { graphFromStructure } from "../../src/adapters/graphFromStructure";
import { toVisualizationSnapshots } from "../../src/adapters/fromRuntimeSnapshot";

afterEach(cleanup);

describe("examples/replay-a-recording", () => {
  it("saved all three pieces of a recording", () => {
    expect(recording.snapshot).toBeTruthy();
    expect(recording.structure).toBeTruthy();
    // The commit log is what the chart's colouring is rebuilt from.
    expect(recording.snapshot.commitLog.length).toBeGreaterThan(0);
  });

  it("draws the chart from the saved structure", async () => {
    const { container } = render(React.createElement(Replay));
    await waitFor(() =>
      expect(container.querySelectorAll(".react-flow__node").length).toBeGreaterThan(0),
    );
    expect(container.querySelector('[data-fp="shell-missing-chart"]')).toBeNull();
  });

  it("lights the executed path without anyone passing an overlay", async () => {
    const { container } = render(React.createElement(Replay));
    await waitFor(() =>
      expect(container.querySelectorAll(".react-flow__node").length).toBeGreaterThan(0),
    );
    // At the first cursor position the later stages have not run yet.
    const dimmed = [...container.querySelectorAll<HTMLElement>(".react-flow__node")].filter(
      (n) => n.style.opacity === "0.35",
    );
    expect(dimmed.length).toBeGreaterThan(0);
  });

  it("gives the loop's three passes three different rows", () => {
    const snaps = toVisualizationSnapshots(recording.snapshot as never);
    const quotes = snaps.filter((s) => s.stageName === "Quote");
    expect(quotes.length).toBeGreaterThan(1);
    // Distinct executions, distinct rows — not one summed number repeated.
    expect(new Set(quotes.map((q) => q.runtimeStageId)).size).toBe(quotes.length);
  });

  it("the chart's node ids match the run's stage ids, so the overlay can find them", () => {
    const graph = graphFromStructure(recording.structure);
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const bundle of recording.snapshot.commitLog as Array<{ runtimeStageId: string }>) {
      expect(ids, `chart has a node for ${bundle.runtimeStageId}`).toContain(
        bundle.runtimeStageId.split("#")[0],
      );
    }
  });

  it("tells the story the run recorded, not a generic one", async () => {
    const { container } = render(React.createElement(Replay));
    await waitFor(() =>
      expect(container.querySelector('[data-fp="story-narrative"]')).toBeTruthy(),
    );
    const story = container.querySelector('[data-fp="story-narrative"]')!.textContent ?? "";
    expect(story).not.toContain("executed. Wrote:");
    expect(story.length).toBeGreaterThan(20);
  });
});
