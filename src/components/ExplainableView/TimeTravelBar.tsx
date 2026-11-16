import * as React from "react";

import type { BaseComponentProps } from "../../types";
import { TimeTravelControls, type ReplayControlsOptions } from "../TimeTravelControls";
import { useExplainableRun } from "./ExplainableContext";

export interface TimeTravelBarProps extends BaseComponentProps {
  readonly autoPlayable?: boolean;
  readonly replayControls?: ReplayControlsOptions;
}

export function TimeTravelBar({
  autoPlayable = true,
  replayControls,
  size,
  unstyled = false,
  className,
  style,
}: TimeTravelBarProps) {
  const { snapshots, selectedIndex, selectIndex } = useExplainableRun();

  return (
    <TimeTravelControls
      snapshots={snapshots}
      selectedIndex={selectedIndex}
      onIndexChange={selectIndex}
      autoPlayable={autoPlayable}
      replayControls={replayControls}
      size={size}
      unstyled={unstyled}
      className={className}
      style={{
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        ...style,
      }}
    />
  );
}
