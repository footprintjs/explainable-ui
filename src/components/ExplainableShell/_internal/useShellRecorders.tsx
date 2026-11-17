import { useMemo, useCallback, type ReactNode } from 'react';
import type { StageSnapshot, NarrativeEntry, BaseComponentProps } from '../../../types';
import type { ExplainableShellProps } from '../ShellProps';
import { ResultPanel } from '../../ResultPanel';
import { MemoryPanel } from '../../MemoryPanel';
import { NarrativePanel } from '../../NarrativePanel';
import { KeyedRecorderView } from './KeyedRecorderView';
import { StoryUnavailableNote } from './TraceUnavailableNote';
const EXPLAINABLE_TAB_ID = 'explainable';
const isExplainableTab = (id: string) => id === EXPLAINABLE_TAB_ID || id === 'ai-compatible';
interface RecorderPresentationOptions extends Pick<ExplainableShellProps,
  'runtimeSnapshot' | 'resultData' | 'logs' | 'hideConsole' | 'recorderViews' | 'defaultTab'>, Pick<BaseComponentProps,'size'|'unstyled'> {
  snapshotNarrativeId?: string;
  hasNarrative: boolean;
  hideTabsProp?: string[];
  activeSnapshots: StageSnapshot[];
  safeIdx: number;
  activeNarrativeEntries?: NarrativeEntry[];
  companionNarrativeMissing: boolean;
  narrativeScopeSubflowId?: string;
  invocationPath: readonly string[];
  isInSubflow: boolean;
}
/** Only recorder tab metadata and presentation. No selection or trace owner. */
export function useShellRecorders({runtimeSnapshot,resultData,logs=[],hideConsole=false,recorderViews,defaultTab,
  size='default',unstyled=false,snapshotNarrativeId,hasNarrative,hideTabsProp,activeSnapshots,safeIdx,
  activeNarrativeEntries,companionNarrativeMissing,narrativeScopeSubflowId,invocationPath,isInSubflow}:RecorderPresentationOptions) {
  const autoRecorderViews = useMemo(() => {
    const recorders = (runtimeSnapshot as any)?.recorders as Array<{ id: string; name: string; description?: string; preferredOperation?: string; data: unknown }> | undefined;
    if (!recorders?.length) return [];
    // Don't auto-generate for IDs that have explicit recorderViews
    const explicitIds = new Set((recorderViews ?? []).map((v) => v.id));
    // ...nor for the recorder already rendered AS the Story tab — otherwise
    // the narrative shows twice: once as the story, once as raw entry JSON.
    if (snapshotNarrativeId) explicitIds.add(snapshotNarrativeId);
    return recorders
      .filter((r) => !explicitIds.has(r.id))
      .map((r) => ({ id: r.id, name: r.name, description: r.description, preferredOperation: r.preferredOperation, data: r.data }));
  }, [runtimeSnapshot, recorderViews, snapshotNarrativeId]);

  // Build tab list: Result + Memory (always), Narrative (when data exists),
  // explicit recorder views, auto-detected recorder views
  const allTabs = useMemo(() => {
    const tabs: Array<{ id: string; name: string; description?: string }> = [
      { id: "result", name: "Result", description: "Final output and console logs" },
      { id: "memory", name: "State", description: "Recorded state at the selected visit" },
    ];
    if (hasNarrative) {
      tabs.push({ id: "narrative", name: "Run log", description: "Recorded events through the selected visit" });
    }
    for (const v of recorderViews ?? []) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    for (const v of autoRecorderViews) {
      tabs.push({ id: v.id, name: v.name, description: v.description });
    }
    // Filter hidden tabs
    const hideSet = new Set(hideTabsProp ?? []);
    return hideSet.size > 0 ? tabs.filter((t) => !hideSet.has(t.id)) : tabs;
  }, [hasNarrative, recorderViews, autoRecorderViews, hideTabsProp]);

  // Unstyled mode shows the SAME tabs as styled mode, plus the whole-surface
  // view. It used to render that surface from a tab id that appeared in no
  // list at all, so Result was the only button that did anything and Memory,
  // Narrative and every recorder view were dead.
  const unstyledTabs = useMemo(
    () => [
      ...allTabs,
      {
        id: EXPLAINABLE_TAB_ID,
        name: "Explainable",
        description: "Chart, memory, narrative and timeline in one scroll",
      },
    ],
    [allTabs],
  );

  const validTabIds = new Set(allTabs.map((t) => t.id));
  const hasExplicitDefault = defaultTab !== undefined && (validTabIds.has(defaultTab) || (unstyled && isExplainableTab(defaultTab)));
  const resolvedDefault = hasExplicitDefault ? defaultTab! : unstyled ? EXPLAINABLE_TAB_ID : allTabs[0]?.id ?? "result";
  const renderTabBody = useCallback(
    (tabId: string, plain: boolean): ReactNode => {
      if (tabId === "result") {
        return (
          <ResultPanel
            data={resultData ?? null}
            logs={logs}
            hideConsole={hideConsole}
            size={size}
            unstyled={plain}
          />
        );
      }
      if (tabId === "memory") {
        return (
          <MemoryPanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      if (tabId === "narrative") {
        if (companionNarrativeMissing) return <StoryUnavailableNote />;
        return (
          <NarrativePanel
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
            narrativeEntries={activeNarrativeEntries}
            scopeSubflowId={narrativeScopeSubflowId}
            presentation="visits"
            runtimeSnapshot={runtimeSnapshot}
            size={size}
            unstyled={plain}
            style={plain ? undefined : { height: "100%" }}
          />
        );
      }
      const customView = recorderViews?.find((v) => v.id === tabId);
      if (customView?.render) {
        return customView.render({ snapshots: activeSnapshots, selectedIndex: safeIdx });
      }
      // Auto-detected recorder view — time-travel aware for keyed recorders,
      // JSON fallback otherwise.
      const autoView = autoRecorderViews.find((v) => v.id === tabId);
      if (autoView) {
        return (
          <KeyedRecorderView
            data={autoView.data}
            presentation={autoView.name === "Metrics" ? "metrics" : "generic"}
            scopeLabel={isInSubflow ? `Invocation ${invocationPath.join(" / ")}` : "Root flow"}
            unstyled={plain}
            size={size}
            description={autoView.description}
            preferredOperation={
              autoView.preferredOperation as "translate" | "accumulate" | "aggregate" | undefined
            }
            snapshots={activeSnapshots}
            selectedIndex={safeIdx}
          />
        );
      }
      return null;
    },
    [
      resultData,
      logs,
      hideConsole,
      size,
      activeSnapshots,
      safeIdx,
      activeNarrativeEntries,
      companionNarrativeMissing,
      narrativeScopeSubflowId,
      invocationPath,
      isInSubflow,
      runtimeSnapshot,
      recorderViews,
      autoRecorderViews,
    ],
  );

  return { allTabs, unstyledTabs, hasExplicitDefault, resolvedDefault, renderTabBody };
}
