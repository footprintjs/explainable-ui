/** @vitest-environment jsdom */
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  ExplainableShell,
  buildTraceWalk,
  formatTraceWalk,
  projectTraceInvocation,
} from "../../src/index";
import { createTraceStructureRecorder } from "../../src/flowchart";

type Props = React.ComponentProps<typeof ExplainableShell>;
const nested = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/recordings.json", "utf8")
).nested;
const resumeBytes = readFileSync(
  "test/fixtures/subflow-tracing/resume-recordings.json",
  "utf8"
);
const resumes = JSON.parse(resumeBytes);
const provenance = JSON.parse(
  readFileSync("test/fixtures/subflow-tracing/resume-provenance.json", "utf8")
);

describe("public tool text equals the shell Copy story artifact", () => {
  it("pins actual offline 10.3.0 resume evidence", () => {
    expect(provenance.producer.footprintjs).toBe("10.3.0");
    expect(createHash("sha256").update(resumeBytes).digest("hex")).toBe(
      provenance.sha256
    );
    for (const run of [resumes.sameExecutor, resumes.freshExecutor]) {
      const first =
        run.runtimeSnapshot.subflowResults["prepare#4"].treeContext.history[0];
      expect(Object.keys(first.overwrite)).toEqual(["base", "items", "asked"]);
      expect(first.runtimeStageId).toBe("prepare#4");
    }
  });
  it("matches Copy story at the root without supplying UI-only mount labels", () => {
    const writeText=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
    render(React.createElement(ExplainableShell,{runtimeSnapshot:nested.runtimeSnapshot} as Props));
    for(let i=1;i<nested.runtimeSnapshot.commitLog.length;i++) fireEvent.click(screen.getByLabelText("Next stage"));
    fireEvent.click(screen.getByText("Inspector"));
    fireEvent.click(screen.getByText("Data Trace"));
    const chip=[...document.querySelectorAll('[data-fp="trace-any-chip"]')].find(node=>node.textContent==="total");
    fireEvent.click(chip!);
    fireEvent.click(screen.getByText("Copy story"));
    const log=nested.runtimeSnapshot.commitLog;
    const expected=formatTraceWalk(buildTraceWalk(log,nested.runtimeSnapshot.executionTree,"total"),id=>{
      const index=log.findIndex((row:any)=>row.runtimeStageId===id);return index<0?null:index+1;
    });
    expect(expected).toContain("computed inside");
    expect(writeText.mock.calls[0][0]).toBe(expected);
  });
  it.each([
    [
      "nested",
      nested,
      "pipeline/prepare#8",
      ["pipeline#6", "pipeline/prepare#8"],
    ],
    ["same executor resume", resumes.sameExecutor, "prepare#4", ["prepare#4"]],
    [
      "fresh executor resume",
      resumes.freshExecutor,
      "prepare#4",
      ["prepare#4"],
    ],
  ] as const)(
    "matches the public projector, builder and formatter: %s",
    (_name, run, invocation, chain) => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
      });
      const structure = createTraceStructureRecorder();
      for (const { method, event } of run.structureEvents ?? []) {
        const handler = (
          structure.recorder as unknown as Record<string, unknown>
        )[method];
        if (typeof handler === "function")
          handler.call(structure.recorder, event);
      }
      let click: ((key: string | number) => void) | undefined;
      render(
        React.createElement(ExplainableShell, {
          runtimeSnapshot: run.runtimeSnapshot,
          narrativeEntries: run.narrativeEntries,
          traceGraph: run.structureEvents ? structure.getGraph() : undefined,
          renderFlowchart: (props) => {
            click = props.onNodeClick;
            return React.createElement("div");
          },
        } as Props)
      );
      act(() => click?.(invocation));
      const projected = projectTraceInvocation(
        run.runtimeSnapshot,
        invocation,
        { invocationPath: chain }
      );
      expect(projected.availability).toEqual({ ok: true });
      for (let index = 1; index < projected.commitLog.length; index++)
        fireEvent.click(screen.getByLabelText("Next stage"));
      fireEvent.click(screen.getByText("Inspector"));
      fireEvent.click(screen.getByText("Data Trace"));
      const chip = [
        ...document.querySelectorAll('[data-fp="trace-any-chip"]'),
      ].find((node) => node.textContent === "total");
      expect(chip).toBeTruthy();
      fireEvent.click(chip!);
      fireEvent.click(screen.getByText("Copy story"));
      const stepNumberOf = (id: string) => {
        const index = projected.commitLog.findIndex(
          (row) => (row as { runtimeStageId: string }).runtimeStageId === id
        );
        return index < 0 ? null : index + 1;
      };
      const walk = buildTraceWalk(
        projected.commitLog,
        projected.executionTree,
        "total",
        { scope: projected.scope }
      );
      const expected = formatTraceWalk(walk, stepNumberOf);
      expect(writeText.mock.calls[0]?.[0]).toBe(expected);
      expect(expected).toContain("recorded at invocation start; earlier origin unknown");
      expect(expected).not.toContain("never written");
      expect(expected).not.toContain("reads nothing — origin");
    }
  );
});
