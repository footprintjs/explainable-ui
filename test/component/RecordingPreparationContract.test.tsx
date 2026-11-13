/** @vitest-environment jsdom */
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ExplainableShell } from "../../src/components/ExplainableShell";
import {
  ExplainableProvider,
  useExplainableRun,
  type ExplainableRecordingInput,
  type ExplainableRunContextValue,
} from "../../src/components/ExplainableView";
import { TraceViewer, type Recording } from "../../src/components/TraceViewer/TraceViewer";
import type { NarrativeEntry, StageSnapshot } from "../../src/types";

function makeRecording(runId: string, count: number) {
  const narrativeEntries: NarrativeEntry[] = [{
    type: "stage", text: `Recorded count ${count}.`, depth: 0,
    stageId: "seed", stageName: "Seed", runtimeStageId: "seed#0",
  }];
  return {
    snapshot: {
      runId,
      sharedState: { count },
      executionTree: { id: "seed", name: "Seed", runtimeStageId: "seed#0" },
      commitLog: [{
        stage: "Seed", stageId: "seed", runtimeStageId: "seed#0",
        overwrite: { count }, updates: {}, trace: [{ path: "count", verb: "set" }],
      }],
      recorders: [{ id: "story", name: "Narrative", data: { entries: narrativeEntries } }],
    },
  };
}

function ContextProbe({ capture }: { capture: (value: ExplainableRunContextValue) => void }) {
  capture(useExplainableRun());
  return null;
}

function renderProvider(input: unknown) {
  let context!: ExplainableRunContextValue;
  const view = render(
    <ExplainableProvider recording={input as ExplainableRecordingInput}>
      <ContextProbe capture={value => { context = value; }} />
    </ExplainableProvider>,
  );
  return { ...view, context: () => context };
}

const chart = () => <div>Chart</div>;

describe("recording preparation across public views", () => {
  it.each([
    { input: null, provider: "No recording provided.", kind: "invalid-json", viewer: "No recording provided." },
    { input: "", provider: "No recording provided.", kind: "invalid-json", viewer: "Empty input." },
    { input: [], provider: "A recording must be a JSON object.", kind: "not-object", viewer: "A recording must be a JSON object." },
    {
      // Both faults are present: each facade keeps its existing precedence.
      input: { schemaVersion: 2 },
      provider: "The recording is missing its `snapshot`.",
      kind: "unsupported-version",
      viewer: "Unsupported schemaVersion 2. This viewer reads version 1.",
    },
    {
      input: { schemaVersion: 2, snapshot: {} },
      provider: "Unsupported recording schemaVersion 2.",
      kind: "unsupported-version",
      viewer: "Unsupported schemaVersion 2. This viewer reads version 1.",
    },
  ])("keeps facade error wording and precedence for $kind ($provider)", ({ input, provider, kind, viewer }) => {
    const context = renderProvider(input).context();
    expect(context.recording).toBeNull();
    expect(context.error).toBe(provider);
    const onError = vi.fn();
    render(<TraceViewer recording={input as Recording} onError={onError} />);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind, message: viewer }));
  });

  it("keeps the JSON parser detail while each facade formats its own error", () => {
    const input = "{invalid JSON";
    const provider = renderProvider(input).context();
    const onError = vi.fn();
    render(<TraceViewer recording={input} onError={onError} />);
    const error = onError.mock.calls[0][0];
    expect(error.kind).toBe("invalid-json");
    expect(provider.error).toBe(`Could not parse recording JSON: ${error.message}`);
  });

  it("keeps a valid empty run distinct from an unreadable snapshot", () => {
    const recording = { snapshot: { sharedState: {}, commitLog: [], executionTree: null } };
    const provider = renderProvider(recording).context();
    expect(provider.error).toBeNull();
    expect(provider.snapshots).toEqual([]);

    const onError = vi.fn();
    render(<TraceViewer recording={recording} onError={onError} />);
    expect(onError).toHaveBeenCalledWith({
      kind: "no-stages",
      message: "This recording's snapshot has no executed stages — its `executionTree` is empty. Was the snapshot taken before run() finished?",
    });
    const shell = render(<ExplainableShell runtimeSnapshot={recording.snapshot} renderFlowchart={chart} />);
    expect(shell.getByText("That run has no stages to show.")).toBeTruthy();
    expect(shell.queryByText("That snapshot could not be read.")).toBeNull();
  });

  it("reports the same unreadable source through each facade's established error surface", () => {
    const child = { id: "child", name: "Child", runtimeStageId: "child#1" };
    const recording = { snapshot: {
      sharedState: {}, commitLog: [],
      executionTree: { id: "root", runtimeStageId: "root#0", children: [child], next: child },
    } };
    const provider = renderProvider(recording).context();
    expect(provider.error).toBe("Could not read recording snapshot: Recorded stage tree contains shared nodes");
    expect(provider.snapshots).toEqual([]);
    const onError = vi.fn();
    render(<TraceViewer recording={recording} onError={onError} />);
    expect(onError).toHaveBeenCalledWith({
      kind: "unreadable-snapshot",
      message: "Could not read this snapshot: Recorded stage tree contains shared nodes",
    });
    const shell = render(<ExplainableShell runtimeSnapshot={recording.snapshot} renderFlowchart={chart} />);
    expect(shell.getByText("That snapshot could not be read.")).toBeTruthy();
    expect(shell.getByText("Recorded stage tree contains shared nodes")).toBeTruthy();
  });

  it("keeps a throwing recording argument getter inside the viewer's typed error boundary", () => {
    const recording = makeRecording("throwing-argument", 3);
    Object.defineProperty(recording, "narrativeEntries", {
      get() { throw new Error("Narrative source unavailable"); },
    });
    const onError = vi.fn();
    expect(() => render(<TraceViewer recording={recording} onError={onError} />)).not.toThrow();
    expect(onError).toHaveBeenCalledWith({
      kind: "unreadable-snapshot",
      message: "Could not read this snapshot: Narrative source unavailable",
    });
  });

  it("retains the provider's surface-preparation error boundary", () => {
    const recording = makeRecording("surface-error", 3);
    let reads = 0;
    Object.defineProperty(recording, "structure", {
      get() {
        if (reads++ === 0) throw new Error("Structure temporarily unavailable");
        return undefined;
      },
    });
    const provider = renderProvider(recording).context();
    expect(provider.error).toBe("Could not read recording snapshot: Structure temporarily unavailable");
    expect(provider.snapshots).toEqual([]);
  });

  it("prepares the same recorded values and story through all three views and replaces the run", () => {
    const first = makeRecording("first-run", 3);
    const second = makeRecording("second-run", 8);
    let provider!: ExplainableRunContextValue;
    let shellSnapshots: StageSnapshot[] = [];
    let viewerSnapshots: StageSnapshot[] = [];
    const surfaces = (recording: ReturnType<typeof makeRecording>) => <>
      <ExplainableProvider recording={recording}>
        <ContextProbe capture={value => { provider = value; }} />
      </ExplainableProvider>
      <ExplainableShell runtimeSnapshot={recording.snapshot} renderFlowchart={({ snapshots }) => {
        shellSnapshots = snapshots;
        return <div>Shell chart</div>;
      }} />
      <TraceViewer recording={recording} renderFlowchart={({ snapshots }) => {
        viewerSnapshots = snapshots;
        return <div>Viewer chart</div>;
      }} />
    </>;
    const view = render(surfaces(first));
    expect(shellSnapshots).toEqual(provider.snapshots);
    expect(viewerSnapshots).toEqual(provider.snapshots);
    expect(provider.snapshots[0].memory).toEqual({ count: 3 });
    expect(provider.snapshots[0].narrative).toContain("Recorded count 3.");

    view.rerender(surfaces(second));
    expect(shellSnapshots).toEqual(provider.snapshots);
    expect(viewerSnapshots).toEqual(provider.snapshots);
    expect(provider.snapshots[0].memory).toEqual({ count: 8 });
    expect(provider.snapshots[0].narrative).toContain("Recorded count 8.");
  });
});
