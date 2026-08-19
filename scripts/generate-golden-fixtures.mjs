/**
 * generate-golden-fixtures.mjs — U2 golden-trace fixture generator.
 *
 * Runs 5 small but representative flowcharts through the REAL footprintjs
 * engine (exact devDependency, see package.json) and serializes the exact
 * consumer-facing artifacts explainable-ui's pipeline consumes:
 *
 *   - structureEvents  — StructureRecorder events (build-time), in fire order.
 *                        Fed to `createTraceStructureRecorder` in golden tests.
 *   - runtimeEvents    — ONE interleaved stream of FlowRecorder + ScopeRecorder
 *                        events (channel-tagged), preserving the engine's real
 *                        ordering invariant (Scope.onCommit fires BEFORE
 *                        Flow.onStageExecuted — the L8.0 invariant the
 *                        translators depend on). Fed to `createTraceRuntimeOverlay`,
 *                        `createNodeViewRecorder`, `createCommitFlowRecorder`.
 *   - narrativeEntries — `executor.getNarrativeEntries()` (CombinedNarrativeEntry[]).
 *                        Fed to `toVisualizationSnapshots` + `narrativeSync` utils.
 *   - snapshot         — `executor.getSnapshot()` (sharedState, executionTree,
 *                        commitLog, subflowResults, recorders).
 *                        Fed to `toVisualizationSnapshots`.
 *
 * Determinism
 * ───────────
 *   1. Chart code uses NO wall-clock / random values.
 *   2. `normalize()` rewrites the engine's volatile fields:
 *        - runId / pipelineId strings (`${Date.now()}-${counter}`) → `run-N`
 *          (stable per-distinct-value mapping, preserving run boundaries).
 *        - numbers under known wall-clock keys (timestamp, startTime, …) → 0.
 *   3. Every chart is generated TWICE and the two normalized artifacts are
 *      deep-compared — the script FAILS if any nondeterminism slips through.
 *
 * Output:  test/fixtures/golden/<name>.json  +  manifest.json
 * Regen:   npm run fixtures:regen
 *          (then `npx vitest run test/golden -u` if golden OUTPUTS changed
 *           intentionally — review the snapshot diff before committing.)
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flowChart, FlowChartExecutor, decide, select } from "footprintjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "test", "fixtures", "golden");

// ─────────────────────────────────────────────────────────────────────────────
// Capture — recorders that record the raw event streams eui consumes
// ─────────────────────────────────────────────────────────────────────────────

/** JSON round-trip clone. Strips functions; THROWS on circular refs so we
 *  notice (none of the captured payloads should be cyclic). */
function safeClone(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      typeof val === "function" ? undefined : val,
    ),
  );
}

function createCapture() {
  const structureEvents = [];
  const runtimeEvents = [];

  const push = (arr, channel, method) => (event) =>
    arr.push({ ...(channel ? { channel } : {}), method, event: safeClone(event) });

  const structureRecorder = {
    id: "golden-capture-structure",
    onStageAdded: push(structureEvents, null, "onStageAdded"),
    onEdgeAdded: push(structureEvents, null, "onEdgeAdded"),
    onLoopEdgeAdded: push(structureEvents, null, "onLoopEdgeAdded"),
    onDeciderComplete: push(structureEvents, null, "onDeciderComplete"),
    onSubflowMounted: push(structureEvents, null, "onSubflowMounted"),
  };

  // Flow + Scope events go into ONE array so the real interleaving
  // (commit-before-stageExecuted) is preserved for replay.
  const flowRecorder = {
    id: "golden-capture-flow",
    onStageExecuted: push(runtimeEvents, "flow", "onStageExecuted"),
    onError: push(runtimeEvents, "flow", "onError"),
    // footprintjs >= 9.15.0 — one event per FAILED attempt at a stage that
    // declares a retry policy, fired DURING the stage (before its own
    // onStageExecuted). Captured so the fixture carries the real interleaving,
    // not a reconstruction of it.
    onStageRetry: push(runtimeEvents, "flow", "onStageRetry"),
    onRunStart: push(runtimeEvents, "flow", "onRunStart"),
    onRunEnd: push(runtimeEvents, "flow", "onRunEnd"),
  };
  const scopeRecorder = {
    id: "golden-capture-scope",
    onCommit: push(runtimeEvents, "scope", "onCommit"),
  };

  return { structureEvents, runtimeEvents, structureRecorder, flowRecorder, scopeRecorder };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization — strip engine wall-clock values
// ─────────────────────────────────────────────────────────────────────────────

/** Engine-generated run ids: `${Date.now()}-${counter}` (also pipelineId). */
const RUN_ID_RE = /^\d{13}-\d+$/;
/** Keys whose NUMBER values are wall-clock (engine-side, not consumer data). */
const VOLATILE_NUMBER_KEYS = new Set([
  "timestamp",
  "timestampMs",
  "startTime",
  "endTime",
  "startedAt",
  "completedAt",
  "elapsedMs",
  "executionTimeMs",
  "duration",
]);

function normalize(value, runIdMap, key) {
  if (typeof value === "string" && RUN_ID_RE.test(value)) {
    if (!runIdMap.has(value)) runIdMap.set(value, `run-${runIdMap.size + 1}`);
    return runIdMap.get(value);
  }
  if (typeof value === "number" && key !== undefined && VOLATILE_NUMBER_KEYS.has(key)) {
    return 0;
  }
  if (Array.isArray(value)) {
    return value.map((v) => normalize(v, runIdMap, undefined));
  }
  if (value !== null && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalize(v, runIdMap, k);
    return out;
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// The 5 representative charts
// ─────────────────────────────────────────────────────────────────────────────
//
// Each scenario is a FACTORY (charts hold per-run state like structure
// recorders, and the determinism check runs each scenario twice).
// Returns { name, description, run(capture) } where run() builds the chart
// with capture.structureRecorder attached, executes it, and returns the
// executor (post-run, post-resume if applicable).

/** 1. Linear chain + decider with decide() evidence + default branch. */
const linearDecider = {
  name: "linear-decider",
  description:
    "3 linear stages into a decider (decide() filter+fn rules, default branch). " +
    "Exercises: typed writes, deep write, $metric timing path, decision evidence, branch routing.",
  async run(capture) {
    const chart = flowChart(
      "Intake",
      async (scope) => {
        scope.application = { id: "APP-1", amount: 25000 };
        scope.creditScore = 712;
        scope.dti = 0.31;
        scope.$metric("durationMs", 12); // deterministic consumer-set timing
      },
      "intake",
      { description: "Receive the loan application", structureRecorders: [capture.structureRecorder] },
    )
      .addFunction(
        "Enrich",
        async (scope) => {
          scope.applicant = { name: "Ada", address: { zip: "90210" } };
          scope.applicant.address.zip = "94016"; // deep write (updateValue path)
        },
        "enrich",
        "Attach applicant profile",
      )
      .addDeciderFunction(
        "ClassifyRisk",
        (scope) =>
          decide(
            scope,
            [
              { when: { creditScore: { gt: 700 }, dti: { lt: 0.43 } }, then: "approve", label: "Good credit" },
              { when: (s) => s.creditScore > 600, then: "review", label: "Marginal credit" },
            ],
            "reject",
          ),
        "classify-risk",
        "Route by computed risk tier",
      )
      .addFunctionBranch("approve", "Approve", async (scope) => {
        scope.decision = "approved";
        scope.apr = 6.49;
      }, "Issue approval")
      .addFunctionBranch("review", "ManualReview", async (scope) => {
        scope.decision = "manual-review";
      }, "Queue for manual review")
      .addFunctionBranch("reject", "Reject", async (scope) => {
        scope.decision = "rejected";
      }, "Issue rejection")
      .setDefault("reject")
      .end()
      .build();

    const executor = new FlowChartExecutor(chart);
    executor.enableNarrative();
    executor.attachFlowRecorder(capture.flowRecorder);
    executor.attachScopeRecorder(capture.scopeRecorder);
    await executor.run({ input: { requestId: "req-1" } });
    return executor;
  },
};

/** 2. Subflow mount + loopTo loop with $break exit. */
const subflowLoop = {
  name: "subflow-loop",
  description:
    "Parent mounts a 2-stage subflow (input/outputMapper), then a Refine→Evaluate " +
    "loop (loopTo) that $break()s on the 2nd iteration. Exercises: onSubflowMounted " +
    "subflowSpec walk, loop edge, repeated runtimeStageIds (executionIndex bump), break narrative.",
  async run(capture) {
    const enrichSubflow = flowChart(
      "Normalize",
      async (scope) => {
        scope.text = String(scope.rawText ?? "").trim().toLowerCase();
      },
      "normalize",
      { description: "Normalize raw input" },
    )
      .addFunction(
        "Score",
        async (scope) => {
          scope.score = scope.text.length * 2;
        },
        "score",
        "Score the normalized text",
      )
      .build();

    const chart = flowChart(
      "Seed",
      async (scope) => {
        scope.rawText = "  Hello GOLDEN Trace  ";
        scope.attempt = 0;
      },
      "seed",
      { description: "Seed raw input", structureRecorders: [capture.structureRecorder] },
    )
      .addSubFlowChartNext("sf-enrich", enrichSubflow, "EnrichText", {
        inputMapper: (parent) => ({ rawText: parent.rawText }),
        outputMapper: (sub) => ({ text: sub.text, score: sub.score }),
      })
      .addFunction(
        "Refine",
        async (scope) => {
          scope.attempt = scope.attempt + 1;
          scope.text = `${scope.text}!`;
        },
        "refine",
        "Refine the text",
      )
      .addFunction(
        "Evaluate",
        async (scope) => {
          if (scope.attempt >= 2) {
            scope.outcome = `refined after ${scope.attempt} attempts`;
            scope.$break("quality met");
          }
        },
        "evaluate",
        "Loop until quality met",
      )
      .loopTo("refine")
      .build();

    const executor = new FlowChartExecutor(chart);
    executor.enableNarrative();
    executor.attachFlowRecorder(capture.flowRecorder);
    executor.attachScopeRecorder(capture.scopeRecorder);
    await executor.run();
    return executor;
  },
};

/** 3. Parallel fan-out — selector picks 2 of 3 branches, then convergence. */
const parallelFork = {
  name: "parallel-fork",
  description:
    "Selector (select() evidence) picks 2 of 3 branches which run in PARALLEL, " +
    "then a convergence stage. Exercises: onDeciderComplete(type selector), " +
    "parallel branch commits, fork-shaped execution tree, selection evidence.",
  async run(capture) {
    const chart = flowChart(
      "LoadPatient",
      async (scope) => {
        scope.vitals = { bmi: 31.2, systolic: 148, glucose: 96 };
        scope.flags = [];
      },
      "load-patient",
      { description: "Load patient vitals", structureRecorders: [capture.structureRecorder] },
    )
      .addSelectorFunction(
        "Screen",
        (scope) =>
          select(scope, [
            { when: (s) => s.vitals.glucose > 100, then: "diabetes", label: "Elevated glucose" },
            { when: (s) => s.vitals.systolic > 140, then: "hypertension", label: "High systolic BP" },
            { when: (s) => s.vitals.bmi > 30, then: "obesity", label: "Elevated BMI" },
          ]),
        "screen",
        "Select screenings from vitals",
      )
      .addFunctionBranch("diabetes", "DiabetesScreening", async (scope) => {
        scope.diabetesRisk = "high";
      }, "Assess diabetes risk")
      .addFunctionBranch("hypertension", "HypertensionCheck", async (scope) => {
        scope.hypertensionRisk = "high";
      }, "Assess blood pressure")
      .addFunctionBranch("obesity", "ObesityAssessment", async (scope) => {
        scope.obesityRisk = "moderate";
      }, "Assess BMI")
      .end()
      .addFunction(
        "Summarize",
        async (scope) => {
          scope.summary = {
            hypertension: scope.hypertensionRisk ?? "n/a",
            obesity: scope.obesityRisk ?? "n/a",
            diabetes: scope.diabetesRisk ?? "n/a",
          };
        },
        "summarize",
        "Converge screening results",
      )
      .build();

    const executor = new FlowChartExecutor(chart);
    executor.enableNarrative();
    executor.attachFlowRecorder(capture.flowRecorder);
    executor.attachScopeRecorder(capture.scopeRecorder);
    await executor.run();
    return executor;
  },
};

/** 4. Pause → checkpoint → same-executor resume. */
const pauseResume = {
  name: "pause-resume",
  description:
    "Linear chain with a pausable approval gate: run pauses, same executor resumes " +
    "with the human's answer. Exercises: isPausable structure flag, pause/resume " +
    "narrative entries, two runIds (resume generates a fresh one), post-resume snapshot.",
  async run(capture) {
    const approvalGate = {
      execute: async (scope) => ({ question: `Approve $${scope.amount} refund for ${scope.orderId}?` }),
      resume: async (scope, input) => {
        scope.approved = input.approved;
        scope.approver = input.approver;
      },
    };

    const chart = flowChart(
      "ReceiveRequest",
      async (scope) => {
        scope.orderId = "ORD-42";
        scope.amount = 299;
      },
      "receive",
      { description: "Receive the refund request", structureRecorders: [capture.structureRecorder] },
    )
      .addPausableFunction("ManagerApproval", approvalGate, "approval")
      .addFunction(
        "ProcessRefund",
        async (scope) => {
          scope.refundId = scope.approved ? "REF-7" : undefined;
          scope.status = scope.approved ? "refunded" : "denied";
        },
        "process",
        "Process the refund",
      )
      .build();

    const executor = new FlowChartExecutor(chart);
    executor.enableNarrative();
    executor.attachFlowRecorder(capture.flowRecorder);
    executor.attachScopeRecorder(capture.scopeRecorder);
    await executor.run();
    if (!executor.isPaused()) {
      throw new Error("pause-resume fixture: expected the run to pause at ManagerApproval");
    }
    const checkpoint = executor.getCheckpoint();
    await executor.resume(checkpoint, { approved: true, approver: "Sarah" });
    return executor;
  },
};

/** 5. Declared retry policy — one stage that fails twice and then succeeds. */
const retryAttempts = {
  name: "retry-attempts",
  description:
    "A flaky fetch with a 3-attempt retry policy fails twice then succeeds, followed by a " +
    "stage whose policy never fires. Exercises: footprintjs >= 9.15.0 onStageRetry events, " +
    "'retry' narrative entries carrying attempt-of-total, ONE runtimeStageId and ONE commit " +
    "bundle across all three attempts, and retryAttempts on the structure event of a stage " +
    "that declared a policy it never needed.",
  async run(capture) {
    // The attempt counter lives in the CLOSURE, not in scope: a failed attempt
    // discards its staged writes, so scope cannot count its own attempts. Fresh
    // per run() call, which is what keeps the double-run determinism check honest.
    let fetchAttempt = 0;

    const chart = flowChart(
      "FetchQuote",
      async (scope) => {
        fetchAttempt += 1;
        // Written on every attempt — only the surviving attempt's write commits,
        // so the fixture also pins "the record shows 3, not 1, 2, 3".
        scope.quoteAttempt = fetchAttempt;
        if (fetchAttempt < 3) {
          throw new Error(`quote service unavailable (503)`);
        }
        scope.quote = { symbol: "ACME", price: 41.5 };
      },
      "fetch-quote",
      {
        description: "Fetch a quote from a flaky upstream",
        structureRecorders: [capture.structureRecorder],
        // No backoffMs: a golden fixture must not spend real seconds waiting,
        // and `delayMs: 0` is a legitimate policy, not a workaround.
        retry: { attempts: 3 },
      },
    )
      .addFunction(
        "Settle",
        async (scope) => {
          scope.settled = { symbol: scope.quote.symbol, total: scope.quote.price * 100 };
        },
        "settle",
        "Settle at the fetched price",
      )
      // A policy that is declared and never fires — the quiet arm. The structure
      // event carries retryAttempts: 2; the runtime stream carries no retry event.
      .retry({ attempts: 2 })
      .build();

    const executor = new FlowChartExecutor(chart);
    executor.enableNarrative();
    executor.attachFlowRecorder(capture.flowRecorder);
    executor.attachScopeRecorder(capture.scopeRecorder);
    await executor.run({ input: { symbol: "ACME" } });
    if (fetchAttempt !== 3) {
      throw new Error(
        `retry-attempts fixture: expected FetchQuote to run 3 times, it ran ${fetchAttempt}`,
      );
    }
    return executor;
  },
};

const SCENARIOS = [linearDecider, subflowLoop, parallelFork, pauseResume, retryAttempts];

// ─────────────────────────────────────────────────────────────────────────────
// Generation + determinism check
// ─────────────────────────────────────────────────────────────────────────────

async function generateOnce(scenario) {
  const capture = createCapture();
  const executor = await scenario.run(capture);

  const artifact = {
    name: scenario.name,
    description: scenario.description,
    structureEvents: capture.structureEvents,
    runtimeEvents: capture.runtimeEvents,
    narrativeEntries: safeClone(executor.getNarrativeEntries()),
    snapshot: safeClone(executor.getSnapshot()),
  };
  return normalize(artifact, new Map(), undefined);
}

async function generate(scenario) {
  const a = await generateOnce(scenario);
  const b = await generateOnce(scenario);
  const ja = JSON.stringify(a, null, 2);
  const jb = JSON.stringify(b, null, 2);
  if (ja !== jb) {
    const linesA = ja.split("\n");
    const linesB = jb.split("\n");
    const firstDiff = linesA.findIndex((l, i) => l !== linesB[i]);
    throw new Error(
      `NONDETERMINISTIC fixture '${scenario.name}' — two normalized runs differ at line ${firstDiff + 1}:\n` +
        `  run A: ${linesA[firstDiff]}\n  run B: ${linesB[firstDiff] ?? "<missing>"}\n` +
        `Add the volatile key to VOLATILE_NUMBER_KEYS / RUN_ID_RE handling or make the chart deterministic.`,
    );
  }
  return a;
}

const footprintjsVersion = JSON.parse(
  readFileSync(join(__dirname, "..", "node_modules", "footprintjs", "package.json"), "utf8"),
).version;

mkdirSync(OUT_DIR, { recursive: true });

const manifest = {
  note:
    "Golden-trace fixtures recorded from the REAL footprintjs engine. " +
    "Do not hand-edit — regenerate with `npm run fixtures:regen`.",
  generator: "scripts/generate-golden-fixtures.mjs",
  footprintjs: footprintjsVersion,
  fixtures: [],
};

for (const scenario of SCENARIOS) {
  const artifact = await generate(scenario);
  const file = `${scenario.name}.json`;
  writeFileSync(join(OUT_DIR, file), JSON.stringify(artifact, null, 2) + "\n");
  manifest.fixtures.push({
    file,
    name: scenario.name,
    description: scenario.description,
    structureEvents: artifact.structureEvents.length,
    runtimeEvents: artifact.runtimeEvents.length,
    narrativeEntries: artifact.narrativeEntries.length,
  });
  console.log(
    `  ✔ ${file} (structure=${artifact.structureEvents.length}, runtime=${artifact.runtimeEvents.length}, narrative=${artifact.narrativeEntries.length})`,
  );
}

writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`  ✔ manifest.json (footprintjs ${footprintjsVersion})`);
console.log(`Golden fixtures written to test/fixtures/golden/ — ${SCENARIOS.length} charts, deterministic (double-run verified).`);
