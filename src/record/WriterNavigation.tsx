import { useEffect, useRef, useState } from "react";
import { normaliseStateKey, pathSegments } from "foottrace/paths";
import type { StateKey } from "foottrace";
import type { CSSProperties } from "react";
import type { RecordBacktrackPosition, RecordWriterStop } from "./types";
import { previewValue } from "./preview";

interface Props {
  owner: object;
  invocationPath: readonly string[];
  onPositionChange?: (position: RecordBacktrackPosition) => void;
  step: number;
  currentKey?: string;
  segmentedKey: boolean;
  writers?: readonly (RecordWriterStop & { readonly invocationPath?: readonly string[] })[];
  onStepChange?: (step: number) => void;
  onKeyChange?: (key: StateKey) => void;
  style: CSSProperties;
}

interface Position {
  step: number;
  key: StateKey;
  invocationPath: readonly string[];
}

interface Question extends Position {
  owner: object;
  linkId: string;
}

interface Visit {
  origin: Question;
  from: Position;
  destination: Position;
}

// Controlled hosts may publish the step and key changes in separate renders.
function sameScope(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function between(from: Position, to: Position, path: readonly string[], step: number, key: string | undefined) {
  return (sameScope(path, from.invocationPath) || sameScope(path, to.invocationPath))
    && (step === from.step || step === to.step)
    && (key === normaliseStateKey(from.key) || key === normaliseStateKey(to.key));
}

const linkId = (writer: Position) => JSON.stringify([writer.invocationPath, writer.step, writer.key]);

/** Only the return address is local. Step, key and source remain host-controlled. */
export function WriterNavigation({ owner, invocationPath, onPositionChange, step, currentKey, segmentedKey, writers, onStepChange, onKeyChange, style }: Props) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const acknowledged = useRef<Visit | null>(null);
  const pendingReturnFocus = useRef<Visit | null>(null);
  const controls = useRef(new Map<string, HTMLButtonElement>());
  const returnButton = useRef<HTMLButtonElement>(null);
  const active = visit && owner === visit.origin.owner && sameScope(invocationPath, visit.destination.invocationPath) && step === visit.destination.step &&
    currentKey === normaliseStateKey(visit.destination.key);

  useEffect(() => {
    if (active) {
      if (acknowledged.current !== visit) returnButton.current?.focus();
      acknowledged.current = visit;
    } else if (visit && (owner !== visit.origin.owner || acknowledged.current === visit ||
        !between(visit.from, visit.destination, invocationPath, step, currentKey))) {
      setVisit(null);
      acknowledged.current = null;
    }
  }, [visit, active, owner, invocationPath, step, currentKey]);

  useEffect(() => {
    const pending = pendingReturnFocus.current;
    if (!pending) return;
    const { origin, destination } = pending;
    if (owner !== origin.owner || !between(destination, origin, invocationPath, step, currentKey)) {
      pendingReturnFocus.current = null;
    } else if (sameScope(invocationPath, origin.invocationPath) && step === origin.step && currentKey === normaliseStateKey(origin.key)) {
      const link = controls.current.get(origin.linkId);
      if (link) {
        link.focus();
        pendingReturnFocus.current = null;
      }
    }
  }, [owner, invocationPath, step, currentKey, writers]);

  if (currentKey === undefined) return null;
  const go = (position: Position) => {
    if (onPositionChange) {
      onPositionChange({ invocationPath: position.invocationPath, step: position.step, key: pathSegments(normaliseStateKey(position.key)) });
    } else if (sameScope(invocationPath, position.invocationPath)) {
      onStepChange?.(position.step);
      onKeyChange?.(position.key);
    }
  };
  return <>
    {active && <button type="button" ref={returnButton} style={style} onClick={() => {
      pendingReturnFocus.current = visit;
      acknowledged.current = null;
      setVisit(null);
      go(visit.origin);
    }}>Return to recorded question</button>}
    {!!writers?.length && <ul aria-label="Recorded ingredient writers">
      {writers.map(writer => {
        const target = { ...writer, invocationPath: writer.invocationPath ?? invocationPath };
        const id = linkId(target);
        const label = `${writer.stageName} · ${writer.key.join(" › ")} = ${previewValue(writer.value)}`;
        if (!onPositionChange && (!onKeyChange || !onStepChange || !sameScope(target.invocationPath, invocationPath))) {
          return <li key={id}>{label}</li>;
        }
        return <li key={id}><button type="button" style={style} ref={node => {
          if (node) controls.current.set(id, node);
          else controls.current.delete(id);
        }} onClick={() => {
          const key = segmentedKey ? pathSegments(currentKey) : currentKey;
          const from = { invocationPath, step, key };
          const origin = active ? visit.origin : { ...from, owner, linkId: id };
          setVisit({ origin, from, destination: target });
          go(target);
        }}>Follow {label}</button></li>;
      })}
    </ul>}
  </>;
}
