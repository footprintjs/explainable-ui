import type { GapCode } from "foottrace/cause";

/** Private canonical wording. Admission and all presentation sites share this owner. */
export const gapMessages = Object.freeze({
  "not-collected": "Some evidence was not collected.",
  "untracked-input": "An input's earlier origin is unknown.",
  redacted: "Some evidence is hidden.",
  conservative: "The recorded relationship is uncertain.",
  "scope-boundary": "Evidence stops at an execution boundary.",
  "invalid-data": "Some recorded evidence could not be read.",
  unavailable: "Some evidence is unavailable.",
  timeout: "The evidence search reached its time allowance.",
  cancelled: "The evidence search was cancelled.",
  cycle: "A repeated dependency could not be resolved.",
  "node-limit": "The evidence search reached its item allowance.",
  "depth-limit": "The evidence search reached its depth allowance.",
  "edge-limit": "The evidence search reached its relationship allowance.",
  "call-limit": "The evidence search reached its request allowance.",
  truncated: "The recorded evidence is incomplete.",
  "strategy-failed": "Candidate ordering is unavailable.",
  "not-checked": "Some evidence has not been checked.",
  "no-match": "No matching evidence was found.",
  ambiguous: "More than one explanation remains possible.",
  stale: "Some evidence belongs to an earlier recording.",
  incompatible: "Some evidence uses an unsupported format.",
  unsupported: "Some evidence is unsupported.",
  "not-permitted": "Some evidence is unavailable for this view.",
} satisfies Record<GapCode, string>);

export const attentionNames = Object.freeze({
  error: "Recorded error",
  "unknown-effect": "Outcome unknown",
  "gave-up": "Stopped retrying",
  timeout: "Timed out",
  retried: "Retried",
  "quality-drop": "Quality changed",
  "not-collected": "Evidence unavailable",
  outlier: "Unusual result",
});
