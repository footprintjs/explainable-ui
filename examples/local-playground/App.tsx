import { useMemo, useState } from "react";
import {
  ExplainableShell,
  type ExplainableShellProps,
  type RuntimeOverlay,
  type LensTheme,
  type LensLayoutDefinition,
} from "footprint-explainable-ui";
import recordings from "./recordings.json";
import { createPlaygroundRenderer } from "./PlaygroundChart";
import { applyExampleNodeIcons, ExampleStageIcon, type NodeIconMode } from "../node-icons/NodeIcons";
import "./style.css";

interface RecordedScenario {
  id: string;
  title: string;
  description: string;
  category?: string;
  groupedSubflows?: string[];
  outcome: string;
  guide: string[];
  runtimeSnapshot: NonNullable<ExplainableShellProps["runtimeSnapshot"]>;
  narrativeEntries: NonNullable<ExplainableShellProps["narrativeEntries"]>;
  traceGraph: NonNullable<ExplainableShellProps["traceGraph"]>;
  runtimeOverlay: Omit<RuntimeOverlay, "errors" | "retryAttempts"> & {
    errors: [string, string][];
    retryAttempts?: [string, number][];
  };
}

const data = recordings as unknown as {
  generatedAt: string;
  engineVersion: string;
  scenarios: RecordedScenario[];
};

// The record generator serializes maps as entries. Restore them once, keeping
// the recording cohort stable across theme changes and other page renders.
const scenarios = data.scenarios.map((scenario) => ({
  ...scenario,
  runtimeOverlay: {
    ...scenario.runtimeOverlay,
    errors: new Map(scenario.runtimeOverlay.errors),
    ...(scenario.runtimeOverlay.retryAttempts !== undefined
      ? { retryAttempts: new Map(scenario.runtimeOverlay.retryAttempts) }
      : {}),
  } as RuntimeOverlay,
}));

const scenarioKinds: Record<string, string> = {
  linear: "Simple sequence",
  parallel: "Parallel branches",
  loop: "Repeated execution",
  subflows: "Nested workflows",
  pricing: "Values & dependencies",
  shipping: "Decisions & branches",
  retry: "Retries & recovery",
};
const NO_GROUPS: string[] = [];

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [skin, setSkin] = useState<"standard" | "forest" | "graphite">("standard");
  const [lensView, setLensView] = useState<"story" | "developer">("story");
  const [iconMode, setIconMode] = useState<NodeIconMode>("custom");
  const [replayControls, setReplayControls] = useState({ previousNext: true, playPause: true, slider: true });
  const [arrangement, setArrangement] = useState("default");
  const lensLayout = useMemo<LensLayoutDefinition | undefined>(() => {
    if (arrangement === "beside") return { columns: "minmax(0, 1.3fr) minmax(280px, 1fr)", rows: "auto minmax(0, 1fr)",
      areas: [["timeTravel", "timeTravel"], ["flowchart", "commentary"]] };
    if (arrangement === "below") return { columns: "minmax(0, 1fr)", rows: "auto minmax(220px, 1fr) minmax(160px, 0.65fr)",
      areas: [["timeTravel"], ["flowchart"], ["commentary"]] };
    if (arrangement === "minimal") return { columns: "minmax(0, 1fr)", rows: "auto minmax(0, 1fr)", areas: [["timeTravel"], ["flowchart"]] };
    if (arrangement === "all") return { columns: "minmax(0, 1.3fr) minmax(280px, 1fr)", rows: "auto minmax(0, 1fr) minmax(120px, 0.6fr)",
      areas: [["timeTravel", "timeTravel"], ["flowchart", "developer"], ["commentary", "timeline"]] };
    return undefined;
  }, [arrangement]);
  const lensTheme: LensTheme = {
    mode,
    components: iconMode === "custom" ? { Icon: ExampleStageIcon } : undefined,
    tokens: skin === "forest" ? {
      colors: { primary: mode === "dark" ? "#b9dbc7" : "#21634a", accent: mode === "dark" ? "#b9dbc7" : "#21634a", accentBg: "rgba(33,99,74,0.12)",
        nodeCursor: mode === "dark" ? "#b9dbc7" : "#153f35", onNodeCursor: mode === "dark" ? "#10271a" : "#ffffff", nodeVisited: mode === "dark" ? "#153f35" : "#b9dbc7", onNodeVisited: mode === "dark" ? "#ffffff" : "#10271a",
        nodeMain: "#245c45", onNodeMain: "#ffffff", tracing: mode === "dark" ? "#b9dbc7" : "#21634a", onTracing: mode === "dark" ? "#10271a" : "#ffffff" },
      fontFamily: { sans: "Georgia, serif", mono: "ui-monospace, monospace" },
      typography: { body: "13px", label: "12px", small: "11px" },
      spacing: { md: "14px", lg: "18px" }, radii: { control: "2px", panel: "3px", badge: "3px" },
      controls: { height: "32px" }, elevation: { panel: "none", popover: "none" },
    } : skin === "graphite" ? {
      colors: { primary: mode === "dark" ? "#9bb2dd" : "#455c91", accent: mode === "dark" ? "#9bb2dd" : "#455c91", accentBg: "rgba(69,92,145,0.14)",
        nodeCursor: mode === "dark" ? "#d2d9e5" : "#263859", onNodeCursor: mode === "dark" ? "#17243d" : "#ffffff", nodeVisited: mode === "dark" ? "#263859" : "#d2d9e5", onNodeVisited: mode === "dark" ? "#ffffff" : "#17243d",
        nodeMain: "#455c91", onNodeMain: "#ffffff", tracing: mode === "dark" ? "#9bb2dd" : "#455c91", onTracing: mode === "dark" ? "#17243d" : "#ffffff" },
      fontFamily: { sans: "ui-monospace, monospace", mono: "ui-monospace, monospace" },
      typography: { body: "12px", label: "11px", small: "10px" },
      spacing: { md: "10px", lg: "14px" }, radii: { control: "0px", panel: "0px", badge: "0px" },
      borders: { width: "1px" }, controls: { height: "26px" }, elevation: { panel: "none", popover: "none" },
    } : undefined,
  };
  const [layout, setLayout] = useState<"default" | "straight">("default");
  const [outerBox, setOuterBox] = useState(false);
  const [groupsByScenario, setGroupsByScenario] = useState<Record<string, string[]>>({});
  const [selection, setSelection] = useState({
    id: scenarios[0]?.id ?? "pricing",
    replay: 0,
    autoPlay: false,
  });
  const active = scenarios.find((scenario) => scenario.id === selection.id) ?? scenarios[0];
  const displayScenario = useMemo(() => active ? {
    ...active,
    traceGraph: applyExampleNodeIcons(active.traceGraph, iconMode),
  } : undefined, [active, iconMode]);
  const availableGroupIds = active?.groupedSubflows ?? NO_GROUPS;
  const groupedSubflows = groupsByScenario[active?.id ?? ""] ?? NO_GROUPS;
  const nativeGroups = useMemo(() => {
    const groups = availableGroupIds.map((id) => {
      const node = active?.traceGraph.nodes.find((candidate) => candidate.id === id || candidate.data?.subflowId === id);
      const label = node?.data?.label;
      return { id, label: typeof label === "string" ? label : id };
    });
    const counts = new Map<string, number>();
    for (const group of groups) counts.set(group.label, (counts.get(group.label) ?? 0) + 1);
    return groups.map((group) => ({ ...group, duplicateLabel: (counts.get(group.label) ?? 0) > 1 }));
  }, [active, availableGroupIds]);
  const renderFlowchart = useMemo(() => displayScenario ? createPlaygroundRenderer(displayScenario, {
    layout, groupedSubflows, outerBox, mode, iconMode,
  }) : undefined, [displayScenario, layout, groupedSubflows, outerBox, mode, iconMode]);

  if (!active) return <main className="empty-preview">No recordings are available. Regenerate the local examples to continue.</main>;

  const selectScenario = (id: string) => setSelection((current) =>
    current.id === id ? current : { id, replay: 0, autoPlay: false });
  const replay = () => setSelection((current) => ({
    ...current, replay: current.replay + 1, autoPlay: true,
  }));
  const setScenarioGroups = (ids: string[]) => setGroupsByScenario((current) => ({
    ...current, [active.id]: ids,
  }));
  const toggleGroup = (id: string) => setScenarioGroups(groupedSubflows.includes(id)
    ? groupedSubflows.filter((groupId) => groupId !== id)
    : [...groupedSubflows, id]);

  return <div className="playground" data-theme={mode}>
    <div className="page-wrap">
      <header className="page-header">
        <a className="brand" href="#workflow-preview" aria-label="Flow Lens local preview">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Flow Lens <span className="brand-divider">/</span> <span className="brand-secondary">Local preview</span></span>
        </a>
        <span className="header-caption">Read the run. Follow the evidence.</span>
        <span className="engine-badge" title={`Generated ${new Date(data.generatedAt).toLocaleString()}`}><span className="status-dot" /> FootprintJS {data.engineVersion}</span>
        <button className="button button-quiet theme-toggle" type="button"
          aria-label={`Switch to ${mode === "light" ? "dark" : "light"} theme`}
          onClick={() => setMode((current) => current === "light" ? "dark" : "light")}>
          <span aria-hidden="true">{mode === "light" ? "◐" : "☀"}</span>
          {mode === "light" ? "Dark" : "Light"} theme
        </button>
      </header>

      <div className="workspace-body">
        <aside className="scenario-sidebar" aria-labelledby="page-title">
          <div className="sidebar-heading">
            <h1 id="page-title">Recorded workflows <span>{scenarios.length}</span></h1>
            <p>Chart, values, and story.<br />One shared execution cursor.</p>
          </div>
      <nav className="scenario-list" aria-label="Recorded workflow scenarios">
        {scenarios.map((scenario, index) => <button
          className={`scenario-button${scenario.id === active.id ? " is-active" : ""}`}
          type="button" key={scenario.id} aria-pressed={scenario.id === active.id}
          onClick={() => selectScenario(scenario.id)}>
          <span className="scenario-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="scenario-label"><strong>{scenario.title}</strong><span>{scenarioKinds[scenario.id] ?? scenario.category ?? "Recorded workflow"}</span></span>
          <span className="scenario-arrow" aria-hidden="true">↗</span>
        </button>)}
      </nav>
          <p className="sidebar-footer">Real FootprintJS executions.<br />Current ExplainableShell source.</p>
        </aside>

        <main className="run-section" id="workflow-preview" aria-labelledby="run-title">
          <div className="run-heading">
            <div><p className="eyebrow">Selected recording</p><h2 id="run-title">{active.title}</h2><p className="run-description">{active.description}</p></div>
            <button className="button button-primary" type="button" onClick={replay}><span aria-hidden="true">↻</span> Replay from start</button>
          </div>

          <details className="run-guide" key={active.id}>
            <summary><span>Outcome &amp; instructions</span><span className="disclosure-caption">{active.guide.length} things to explore</span></summary>
            <div className="run-context">
              <div className="run-outcome"><span className="context-label">Recorded outcome</span><strong>{active.outcome}</strong></div>
              <div className="guide"><span className="context-label">Try this</span><ol>{active.guide.map((step, index) => <li key={index}>{step}</li>)}</ol></div>
            </div>
          </details>

          <div className="shell-frame">
            <details className="display-options">
              <summary><span>Display options</span><span className="disclosure-caption">{layout === "default" ? "Default layout" : "Straight trunk"} · {iconMode === "custom" ? "Custom SVG icons" : iconMode === "builtin" ? "Built-in icons" : "Recorded icons"} · {groupedSubflows.length} groups{outerBox ? " · outer box" : ""}</span></summary>
          <div className="chart-options" role="group" aria-label="Chart display options">
            <label className="layout-control"><span className="context-label">Lens arrangement</span>
              <select aria-label="Lens arrangement" value={arrangement} onChange={event => setArrangement(event.target.value)}>
                <option value="default">Details toggle (default)</option><option value="beside">Commentary beside chart</option>
                <option value="below">Commentary under chart</option><option value="minimal">Flowchart only</option><option value="all">All five surfaces</option>
              </select>
            </label>
            <label className="layout-control"><span className="context-label">Lens theme</span>
              <select aria-label="Lens theme" value={skin} onChange={event => setSkin(event.target.value as typeof skin)}>
                <option value="standard">Standard</option><option value="forest">Forest / serif</option><option value="graphite">Graphite / compact</option>
              </select>
            </label>
            <label className="layout-control"><span className="context-label">Chart layout</span>
              <select value={layout} onChange={(event) => setLayout(event.target.value as "default" | "straight")}>
                <option value="default">Default</option>
                <option value="straight">Straight trunk</option>
              </select>
            </label>
            <label className="layout-control"><span className="context-label">Node icons</span>
              <select aria-label="Node icons" value={iconMode} onChange={event => setIconMode(event.target.value as NodeIconMode)}>
                <option value="recorded">Recorded icons</option>
                <option value="builtin">Built-in icons</option>
                <option value="custom">Custom SVG icons</option>
              </select>
            </label>
            <fieldset className="group-controls">
              <legend className="context-label">Replay controls</legend>
              {([['previousNext', 'Previous / Next'], ['playPause', 'Play / Pause'], ['slider', 'Time slider']] as const).map(([key, label]) =>
                <label className="checkbox-control" key={key}><input type="checkbox" checked={replayControls[key]}
                  onChange={event => setReplayControls(current => ({ ...current, [key]: event.target.checked }))} /><span>{label}</span></label>)}
            </fieldset>
            <fieldset className="group-controls">
              <legend className="context-label">Flow containers</legend>
              <label className="checkbox-control"><input type="checkbox" checked={outerBox} onChange={(event) => setOuterBox(event.target.checked)} /><span>Outer workflow box</span></label>
              {nativeGroups.length > 0 ? <>
                <div className="native-group-options">
                  {nativeGroups.map((group) => <label className="checkbox-control" key={group.id}>
                    <input type="checkbox" aria-label={`Group ${group.label} (${group.id})`} checked={groupedSubflows.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                    <span className="group-name"><span>{group.label}</span>{group.duplicateLabel && <small>{group.id}</small>}</span>
                  </label>)}
                  <div className="group-actions"><button type="button" onClick={() => setScenarioGroups([...availableGroupIds])}>All groups</button><span aria-hidden="true">·</span><button type="button" onClick={() => setScenarioGroups([])}>Clear groups</button></div>
                </div>
                <p className="group-note">Checked subflows use group boxes; unchecked subflows use drill cards. Group boxes expand subflows at the current level. Drill into a nested subflow to explore deeper levels.</p>
              </> : <p className="group-note">No native subflows in this workflow. You can still show its outer box.</p>}
            </fieldset>
          </div>

            </details>
            <div className="shell-frame-heading"><span><span className="status-dot" /> Execution workbench</span><span>{active.runtimeOverlay.executionOrder.length} recorded steps</span></div>
            <div className="shell-surface">
            <ExplainableShell
              key={`${active.id}:${selection.replay}`}
              runtimeSnapshot={active.runtimeSnapshot}
              narrativeEntries={active.narrativeEntries}
              traceGraph={displayScenario?.traceGraph ?? active.traceGraph}
              runtimeOverlay={active.runtimeOverlay}
              renderFlowchart={renderFlowchart}
              title={active.title}
              defaultExpanded={{ topology: availableGroupIds.length > 0, details: true, timeline: false }}
              theme={lensTheme}
              view={lensView}
              onViewChange={setLensView}
              layout={lensLayout}
              replayControls={replayControls}
              autoPlay={selection.autoPlay}
              style={{ height: "100%", minHeight: 0 }}
            />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>;
}
