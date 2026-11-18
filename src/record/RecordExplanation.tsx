import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { StateKey } from "foottrace";
import type { RecordBacktrackPosition, RecordLensModel, RecordLensReader, RecordWriterStop } from "./types";
import { WriterNavigation, type ObservedRead } from "./WriterNavigation";
import type { ScopedWriter } from "./scopedRecordGraph";
import { theme } from "../theme/styles";

interface Props {
  model: Extract<RecordLensModel, { status: "ready" | "empty" }>;
  root: RecordLensReader;
  reader: RecordLensReader;
  owner: object;
  path: readonly string[];
  segmentedKey: boolean;
  onPositionChange?: (position: RecordBacktrackPosition) => void;
  onStepChange?: (step: number) => void;
  onKeyChange?: (key: StateKey) => void;
  style: CSSProperties;
  textStyle: CSSProperties;
}

interface Explanation {
  writers: (RecordWriterStop & RecordBacktrackPosition)[];
  candidates?: ObservedRead[];
  handoffs?: ObservedRead[];
  messages: string[];
  writer?: string;
}

type Reply = Explanation & { reader: RecordLensReader; step: number; key: string };

export function RecordExplanation({ model, root, reader, owner, path, segmentedKey, onPositionChange,
  onStepChange, onKeyChange, style, textStyle }: Props) {
  const { step, provenance } = model;
  const key = provenance?.status === "ready" ? provenance.slice.key : undefined;
  const [reply, setReply] = useState<Reply>();
  const current = reply?.reader === reader && reply.step === step && reply.key === key ? reply : undefined;

  useEffect(() => {
    if (!reader.backtrack || key === undefined) return;
    const controller = new AbortController();
    const save = (answer: Explanation) => {
      if (!controller.signal.aborted) setReply({ reader, step, key, ...answer });
    };
    reader.backtrack(step, key, controller.signal).then(answer => {
      if (controller.signal.aborted) return;
      const writers: Explanation["writers"] = [];
      const messages = new Set(answer.gaps.map(gap => gap.message));
      for (const writer of answer.writers) {
        const position = root.positionOf?.(writer);
        if (position) writers.push({ ...position, stageName: writer.stageName });
        else messages.add("The recorded writer has no selectable step in this replay.");
      }
      const observation = (writer: ScopedWriter) => {
        const position = root.positionOf?.(writer);
        return { writer, destination: position && { ...position, stageName: writer.stageName } };
      };
      save({ writers, candidates: answer.candidates?.map(observation), handoffs: answer.handoffs?.map(observation),
        messages: [...messages], writer: answer.writer?.stageName });
    }).catch(() => save({ writers: [], messages: ["The scoped record could not be read. Collection unknown."] }));
    return () => controller.abort();
  }, [reader, root, step, key]);

  // A local slice alone cannot describe a native child handoff. Only present its
  // original explanation for records without the scope-aware reader.
  return <>
    <WriterNavigation owner={owner} invocationPath={path} step={step} currentKey={key} segmentedKey={segmentedKey}
      writers={reader.backtrack ? current?.writers : model.writerStops} candidates={current?.candidates} handoffs={current?.handoffs}
      onPositionChange={onPositionChange} onStepChange={onStepChange} onKeyChange={onKeyChange} style={style} />
    {!provenance ? <p>Select a key to inspect its recorded origin.</p>
      : provenance.status === "unavailable" ? <p role="status">{provenance.message}</p>
      : reader.backtrack ? <div aria-live="polite">
        {!current && <p role="status">Reading recorded sources…</p>}
        {current?.writer && <p>{current.writer} wrote <code>{key}</code>.</p>}
        {current?.messages.map(message => <p key={message}>{message}</p>)}
      </div>
      : <>
        <p role="status" style={{ color: theme.textSecondary }}>{provenance.reads === "unknown"
          ? "Separate read evidence is unavailable. Any write-time reads in the record are still used; unrecorded dependencies remain unknown."
          : "Using the supplied read evidence. Unrecorded reads are not proof of independence."}</p>
        <pre style={textStyle}>{provenance.prose}</pre>
      </>}
  </>;
}
