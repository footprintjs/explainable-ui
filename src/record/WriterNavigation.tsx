import { useEffect, useRef, useState } from "react";
import { normaliseStateKey, pathSegments } from "foottrace/paths";
import type { StateKey } from "foottrace";
import type { CSSProperties } from "react";
import type { RecordLensReader, RecordWriterStop } from "./types";
import { previewValue } from "./preview";

interface Props {
  reader?: RecordLensReader;
  step: number;
  currentKey?: string;
  segmentedKey: boolean;
  writers?: readonly RecordWriterStop[];
  onStepChange?: (step: number) => void;
  onKeyChange?: (key: StateKey) => void;
  style: CSSProperties;
}

interface Position {
  step: number;
  key: StateKey;
}

interface Question extends Position {
  reader: RecordLensReader;
  linkId: string;
}

interface Visit {
  origin: Question;
  from: Position;
  destination: RecordWriterStop;
}

// Controlled hosts may publish the step and key changes in separate renders.
function between(from: Position, to: Position, step: number, key: string | undefined) {
  return (step === from.step || step === to.step)
    && (key === normaliseStateKey(from.key) || key === normaliseStateKey(to.key));
}

const linkId = (writer: RecordWriterStop) => JSON.stringify([writer.step, writer.key]);

/** Only the return address is local. Step, key and source remain host-controlled. */
export function WriterNavigation({ reader, step, currentKey, segmentedKey, writers, onStepChange, onKeyChange, style }: Props) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const acknowledged = useRef<Visit | null>(null);
  const pendingReturnFocus = useRef<Visit | null>(null);
  const controls = useRef(new Map<string, HTMLButtonElement>());
  const returnButton = useRef<HTMLButtonElement>(null);
  const active = visit && reader === visit.origin.reader && step === visit.destination.step &&
    currentKey === normaliseStateKey(visit.destination.key);

  useEffect(() => {
    if (active) {
      if (acknowledged.current !== visit) returnButton.current?.focus();
      acknowledged.current = visit;
    } else if (visit && (reader !== visit.origin.reader || acknowledged.current === visit ||
        !between(visit.from, visit.destination, step, currentKey))) {
      setVisit(null);
      acknowledged.current = null;
    }
  }, [visit, active, reader, step, currentKey]);

  useEffect(() => {
    const pending = pendingReturnFocus.current;
    if (!pending) return;
    const { origin, destination } = pending;
    if (reader !== origin.reader || !between(destination, origin, step, currentKey)) {
      pendingReturnFocus.current = null;
    } else if (step === origin.step && currentKey === normaliseStateKey(origin.key)) {
      controls.current.get(origin.linkId)?.focus();
      pendingReturnFocus.current = null;
    }
  }, [reader, step, currentKey]);

  if (!reader || currentKey === undefined || !onStepChange || !onKeyChange) return null;
  const go = (nextStep: number, key: StateKey) => {
    onStepChange(nextStep);
    onKeyChange(key);
  };
  return <>
    {active && <button type="button" ref={returnButton} style={style} onClick={() => {
      pendingReturnFocus.current = visit;
      acknowledged.current = null;
      setVisit(null);
      go(visit.origin.step, visit.origin.key);
    }}>Return to recorded question</button>}
    {!!writers?.length && <ul aria-label="Recorded ingredient writers">
      {writers.map(writer => <li key={linkId(writer)}>
        <button type="button" style={style} ref={node => {
          if (node) controls.current.set(linkId(writer), node);
          else controls.current.delete(linkId(writer));
        }} onClick={() => {
          const selectedKey = segmentedKey ? pathSegments(currentKey) : currentKey;
          const origin = active ? visit.origin : { reader, step, key: selectedKey, linkId: linkId(writer) };
          setVisit({ origin, from: { step, key: selectedKey }, destination: writer });
          go(writer.step, writer.key);
        }}>Follow {writer.stageName} · {writer.key.join(" › ")} = {previewValue(writer.value)}</button>
      </li>)}
    </ul>}
  </>;
}
