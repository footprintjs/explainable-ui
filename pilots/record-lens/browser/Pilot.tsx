import { useState } from "react";
import type { StateKey } from "foottrace";
import { RecordLens } from "../../../src/record";
import { flowFixture, flowChildFixture, hciFixture } from "../fixtures/records";

const sources = [flowFixture, flowChildFixture, hciFixture];
const titles = [
  "Flow · calculation",
  "Flow · nested review",
  "HCI · storefront actions",
];

export function Pilot() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [selectedKey, setSelectedKey] = useState<StateKey>();
  const selected = sources[sourceIndex];
  return (
    <main
      style={{
        maxWidth: 1050,
        margin: "0 auto",
        padding: "32px 16px",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <p style={{ color: "#a5b4fc", letterSpacing: 2, fontSize: 12 }}>
        RECORD LENS · SOURCE PILOT
      </p>
      <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", marginBottom: 12 }}>
        One viewer. Different kinds of records.
      </h1>
      <p style={{ color: "#94a3b8" }}>
        Saved records from real producer runs. No agent calls or flowchart
        runtime are loaded by this viewer.
      </p>
      <label style={{ display: "block", marginBlock: 24 }}>
        Recorded source{" "}
        <select
          aria-label="Recorded source"
          value={sourceIndex}
          onChange={(event) => {
            setSourceIndex(Number(event.target.value));
            setStep(0);
            setSelectedKey(undefined);
          }}
          style={{
            background: "#1e293b",
            color: "inherit",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #475569",
            maxWidth: "100%",
          }}
        >
          {titles.map((title, index) => (
            <option key={title} value={index}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <RecordLens
        sourceId={selected.sourceId}
        source={selected.source}
        reads={selected.reads}
        step={step}
        selectedKey={selectedKey}
        onStepChange={setStep}
        onKeyChange={setSelectedKey}
      />
      <p style={{ color: "#94a3b8", fontSize: 13 }}>
        Experimental, source-only. This is not a published package entry point.
      </p>
    </main>
  );
}
