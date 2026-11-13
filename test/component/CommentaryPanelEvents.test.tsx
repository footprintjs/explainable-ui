/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";

import { CommentaryPanel } from "../../src/components/ExplainableView/CommentaryPanel";
import {
  ExplainableProvider,
  type ExplainableRecording,
} from "../../src/components/ExplainableView/ExplainableContext";

const MESSAGE = "Validation complete.";
const RECORDING: ExplainableRecording = {
  snapshot: {
    sharedState: { visits: 3 },
    executionTree: {
      id: "validate", name: "Validate", runtimeStageId: "validate#0",
      next: {
        id: "validate", name: "Validate", runtimeStageId: "validate#1",
        next: { id: "validate", name: "Validate", runtimeStageId: "validate#2" },
      },
    },
    commitLog: [0, 1, 2].map(index => ({
      idx: index,
      stage: "Validate",
      stageId: "validate",
      runtimeStageId: `validate#${index}`,
      overwrite: { visits: index + 1 },
      updates: {},
      trace: [{ path: "visits", verb: "set" }],
    })),
  },
  narrativeEntries: [0, 1, 2].map(index => ({
    type: "stage",
    text: MESSAGE,
    depth: 0,
    stageId: "validate",
    runtimeStageId: `validate#${index}`,
  })),
};

describe("CommentaryPanel recorded event identity", () => {
  it.each([false, true])("keeps identical messages from separate visits as the cursor moves (unstyled=%s)", unstyled => {
    const panel = (selectedIndex: number) => (
      <ExplainableProvider recording={RECORDING} selectedIndex={selectedIndex}>
        <CommentaryPanel unstyled={unstyled} />
      </ExplainableProvider>
    );
    const view = render(panel(0));
    expect(view.getAllByText(MESSAGE)).toHaveLength(1);

    view.rerender(panel(1));
    expect(view.getAllByText(MESSAGE)).toHaveLength(2);

    view.rerender(panel(2));
    expect(view.getAllByText(MESSAGE)).toHaveLength(3);

    view.rerender(panel(0));
    expect(view.getAllByText(MESSAGE)).toHaveLength(1);
  });

  it("limits recorded events without collapsing repeated text and restores earlier visits on rewind", () => {
    const panel = (selectedIndex: number) => (
      <ExplainableProvider recording={RECORDING} selectedIndex={selectedIndex}>
        <CommentaryPanel
          maxLines={2}
          renderEntry={entry => `${entry.runtimeStageId}: ${entry.text}`}
        />
      </ExplainableProvider>
    );
    const view = render(panel(2));
    expect(view.queryByText(`validate#0: ${MESSAGE}`)).toBeNull();
    expect(view.getByText(`validate#1: ${MESSAGE}`)).toBeTruthy();
    expect(view.getByText(`validate#2: ${MESSAGE}`)).toBeTruthy();
    expect(view.getByText(/1 earlier lines hidden/)).toBeTruthy();

    view.rerender(panel(1));
    expect(view.getByText(`validate#0: ${MESSAGE}`)).toBeTruthy();
    expect(view.getByText(`validate#1: ${MESSAGE}`)).toBeTruthy();
    expect(view.queryByText(`validate#2: ${MESSAGE}`)).toBeNull();
    expect(view.queryByText(/earlier lines hidden/)).toBeNull();
  });
});
