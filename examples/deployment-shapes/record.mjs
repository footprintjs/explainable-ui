/** Capture a local deployment SIMULATION. No network/deployment operation runs.
 * Optional DEPLOYMENT_CAPTURE_PACKAGES selects an isolated installed-package root.
 * This example requires published footprintjs13 / foottrace2 / UI1.0.1 APIs. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = process.env.DEPLOYMENT_CAPTURE_PACKAGES;
const require = createRequire(packageRoot ? join(resolve(packageRoot), 'package.json') : import.meta.url);
const { flowChart, FlowChartExecutor, select } = require('footprintjs');
const { findLastWriter } = require('foottrace');
const { narrative, metrics } = require('footprintjs/recorders');
const { createTraceBundle, prepareSubflow, createRecordingSource } = require('footprint-explainable-ui/flowchart');
const SEED = 'deployment-shapes-v1';
const rootIds = ['build-release', 'router', 'switch', 'server-a', 'server-b', 'health', 'complete'];
function packageInfo(name, door = name) {
  let directory = dirname(require.resolve(door));
  for (;;) {
    try { const json = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')); if (json.name === name) return { directory: realpathSync(directory), version: json.version }; } catch {}
    const parent = dirname(directory); if (parent === directory) throw new Error(`Cannot locate ${name} package metadata.`); directory = parent;
  }
}
const installed = Object.fromEntries([['footprintjs', 'footprintjs'], ['foottrace', 'foottrace'], ['footprint-explainable-ui', 'footprint-explainable-ui/flowchart']].map(([name, door]) => [name, packageInfo(name, door)]));
for (const [name, version] of Object.entries({ footprintjs: '13.0.0', foottrace: '2.0.0', 'footprint-explainable-ui': '1.0.1' })) assert.equal(installed[name].version, version, `Install the documented published capture cohort before recording ${name}.`);
assert.equal(realpathSync(createRequire(join(installed.footprintjs.directory, 'package.json')).resolve('foottrace')), realpathSync(require.resolve('foottrace')));
const comment = (scope, message) => scope.$emit('deployment.comment', { message });
const outcome = (scope, message) => scope.$emit('deployment.outcome', { message });
const renderer = {
  renderStage: ({ description, stageName }) => description ?? stageName,
  renderOp: ({ type, key }) => `${type === 'read' ? 'Used' : 'Recorded'} ${key}.`,
  renderDecision: ({ chosen, rationale }) => `Selected ${chosen}.${rationale ? ` ${rationale}` : ''}`,
  renderSubflow: ({ name, direction }) => `${direction === 'entry' ? 'Entered' : 'Returned from'} ${name}.`,
  renderFork: ({ children }) => `Selected recorded branches: ${children.join(', ')}.`,
  renderEmit: ({ name, payload }) => ['deployment.comment', 'deployment.outcome'].includes(name) && typeof payload?.message === 'string' ? payload.message : undefined,
};
function server() {
  return flowChart('DeployArtifact', scope => {
    const artifactId = scope.artifactId, switchReady = scope.switchReady;
    scope.deployedArtifactId = artifactId; scope.deployed = artifactId.length > 0 && switchReady;
    comment(scope, `Simulated copying ${artifactId}; no server was contacted.`);
  }, 'deploy', { description: 'Simulate deploying the recorded artifact' })
    .addFunction('StartService', scope => {
      const deployed = scope.deployed;
      scope.serviceRunning = deployed;
      comment(scope, `Simulated service start: ${deployed ? 'ready' : 'not ready'}.`);
    }, 'start', 'Simulate starting the service')
    .addFunction('HealthResult', scope => {
      const running = scope.serviceRunning, localProbe = scope.simulatedHealth;
      const healthy = running && localProbe; scope.healthy = healthy;
      outcome(scope, `Simulated server health: ${healthy ? 'healthy' : 'unhealthy'}.`);
    }, 'health-result', 'Record the simulated health result')
    .build();
}
async function capture() {
  const bundle = createTraceBundle();
  const input = probe => scope => ({ artifactId: scope.artifactId, switchReady: scope.switchReady, simulatedHealth: scope[probe] });
  const chart = flowChart('BuildRelease', scope => {
    scope.artifactId = 'simulation-build-42'; scope.healthProbeA = true; scope.healthProbeB = true;
    comment(scope, 'Built the deterministic local simulation artifact; no deployment request was sent.');
  }, 'build-release', { description: 'Build the simulation artifact', structureRecorders: [bundle.structure.recorder] })
    .addFunction('ConfigureRouter', scope => {
      const artifact = scope.artifactId; const ready = artifact.length > 0;
      scope.routerReady = ready;
      comment(scope, `Recorded a simulated router route for ${artifact}; no router was changed.`);
    }, 'router', 'Simulate configuring the router')
    .addSelectorFunction('ConfigureSwitch', scope => {
      const routerReady = scope.routerReady; scope.switchReady = routerReady;
      comment(scope, 'Simulated the switch selecting both server branches; no switch was changed.');
      return select(scope, [
        { when: state => state.switchReady, then: 'server-a', label: 'Simulate deployment to Server A' },
        { when: state => state.switchReady, then: 'server-b', label: 'Simulate deployment to Server B' },
      ]);
    }, 'switch', 'Simulate connecting both server branches')
    .addSubFlowChartBranch('server-a', server(), 'Server A', { inputMapper: input('healthProbeA'), outputMapper: child => ({ serverAHealthy: child.healthy }) })
    .addSubFlowChartBranch('server-b', server(), 'Server B', { inputMapper: input('healthProbeB'), outputMapper: child => ({ serverBHealthy: child.healthy }) })
    .end()
    .addFunction('CheckHealth', scope => {
      // Read both recorded branch outputs before writing the combined result.
      const a = scope.serverAHealthy, b = scope.serverBHealthy;
      const ready = a && b; scope.deploymentReady = ready;
      comment(scope, `Recorded server results: A ${a ? 'healthy' : 'unhealthy'}, B ${b ? 'healthy' : 'unhealthy'}.`);
    }, 'health', 'Combine both recorded server health results')
    .addFunction('Complete', scope => {
      const ready = scope.deploymentReady;
      scope.deploymentOutcome = ready ? 'simulated-ready' : 'simulated-incomplete';
      outcome(scope, ready ? 'Deployment simulation ready. No infrastructure was deployed.' : 'Deployment simulation incomplete. No infrastructure was deployed.');
    }, 'complete', 'Record the deployment simulation outcome')
    .build();
  const executor = new FlowChartExecutor(chart, { readTracking: 'full', nestedReadTracking: true, writeProvenance: 'reads-prefix', captureOutputHandoff: true });
  const story = narrative({ renderer }); executor.attachCombinedRecorder(story); executor.attachScopeRecorder(metrics()); bundle.attachTo(executor);
  await executor.run();
  const snapshot = executor.getSnapshot();
  const runtime = bundle.runtimeOverlay.getOverlay();
  assert.equal(snapshot.sharedState.deploymentReady, true); assert.equal(snapshot.nestedReadTracking, true);
  return { snapshot, graph: bundle.structure.getGraph(), narrativeEntries: story.getEntries(), overlay: { ...runtime, errors: [...runtime.errors], retryAttempts: [...(runtime.retryAttempts ?? [])] } };
}
function registryEvidence() {
  const root = packageRoot ? resolve(packageRoot) : here;
  let evidence;
  try { evidence = JSON.parse(readFileSync(join(root, 'registry-provenance.json'), 'utf8')).packages; }
  catch {
    const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
    evidence = Object.fromEntries(Object.keys(installed).map(name => {
      const entry = lock.packages?.[`node_modules/${name}`];
      return [name, entry && { version: entry.version, tarball: entry.resolved, integrity: entry.integrity }];
    }));
  }
  return Object.fromEntries(Object.entries(installed).map(([name, actual]) => {
    const item = evidence[name]; assert.equal(item?.version, actual.version);
    assert.equal(item.tarball, `https://registry.npmjs.org/${name}/-/${name}-${actual.version}.tgz`);
    assert.match(item.integrity, /^sha512-/);
    return [name, { version: actual.version, tarball: item.tarball, integrity: item.integrity, ...(item.archiveSha256 && { archiveSha256: item.archiveSha256 }) }];
  }));
}
const jsonCopy = value => JSON.parse(JSON.stringify(value));
const bytes = value => JSON.stringify(value, null, 2) + '\n';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const graphFor = (fullGraph, ids) => ({ nodes: fullGraph.nodes.filter(node => ids.has(node.id)), edges: fullGraph.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target)) });
function split(full) {
  const children = ['server-a', 'server-b'].map((subflowId, index) => {
    const entries = Object.entries(full.snapshot.subflowResults).filter(([key, result]) => key.includes('#') && result.subflowId === subflowId);
    assert.equal(entries.length, 1); const [mountRuntimeStageId, result] = entries[0];
    const invocationPath = [...result.treeContext.logAddress.drillPath];
    assert.deepEqual(invocationPath, [mountRuntimeStageId]);
    const ids = new Set(full.graph.nodes.filter(node => node.id.startsWith(subflowId + '/')).map(node => node.id));
    assert.equal(ids.size, 3);
    const narrativeEntries = full.narrativeEntries.filter(entry => entry.runtimeStageId?.startsWith(subflowId + '/'));
    const payload = jsonCopy({ result, graph: graphFor(full.graph, ids), narrativeEntries });
    assert.ok(payload.graph.nodes.every(node => node.data.subflowOf === subflowId));
    return { payload, request: { subflowId, mountRuntimeStageId, invocationPath, runId: full.snapshot.runId }, outputKey: index ? 'serverBHealthy' : 'serverAHealthy' };
  });
  const { subflowResults: _childResults, recorders: omittedRecorders, ...rootSnapshot } = full.snapshot;
  const narrativeEntries = full.narrativeEntries.filter(entry => !children.some(child => entry.runtimeStageId?.startsWith(child.request.subflowId + '/')));
  const overview = jsonCopy({ snapshot: rootSnapshot, graph: graphFor(full.graph, new Set(rootIds)), narrativeEntries,
    runtimeOverlay: { ...full.overlay, executionOrder: full.overlay.executionOrder.filter(step => rootIds.includes(step.stageId)) } });
  assert.equal(overview.graph.nodes.length, 7);
  assert.equal(overview.runtimeOverlay.executionOrder.length, 7);
  assert.equal(narrativeEntries.length + children.reduce((sum, child) => sum + child.payload.narrativeEntries.length, 0), full.narrativeEntries.length);
  // Only selection/projection is performed. Native state, log, tree and handoff
  // facts are neither rewritten nor reconstructed for the drawing.
  assert.deepEqual(overview.snapshot.commitLog, full.snapshot.commitLog);
  assert.deepEqual(overview.snapshot.executionTree, full.snapshot.executionTree);
  return { overview, children, omittedRecorders: omittedRecorders.map(({ id, name }) => ({ id, name })) };
}
const full = await capture();
const { overview, children, omittedRecorders } = split(full);
const deployment = findLastWriter(full.snapshot.commitLog, 'deploymentReady');
assert.ok(deployment); const readKeys = deployment.trace.find(write => write.path === 'deploymentReady').readKeys;
assert.deepEqual([...readKeys].sort(), ['serverAHealthy', 'serverBHealthy']);
const source = createRecordingSource({ snapshot: overview.snapshot, graph: overview.graph, narrativeEntries: overview.narrativeEntries,
  loadSubflow(request) {
    const child = children.find(child => child.request.mountRuntimeStageId === request.mountRuntimeStageId);
    assert.ok(child); assert.deepEqual(request.invocationPath, child.request.invocationPath); return child.payload;
  } });
const lineage = [];
try {
  assert.equal(source.rootSnapshot.subflowResults, undefined);
  for (const child of children) {
    const parentWriter = findLastWriter(full.snapshot.commitLog, child.outputKey);
    const handoff = child.payload.result.outputHandoff;
    assert.equal(handoff.status, 'captured'); assert.equal(handoff.parent.runtimeStageId, parentWriter.runtimeStageId);
    assert.equal(handoff.parent.commitIdx, parentWriter.idx);
    assert.ok(handoff.writes.some(write => write.path === child.outputKey && write.reads.includes('healthy')));
    const healthWriter = findLastWriter(child.payload.result.treeContext.history, 'healthy', handoff.child.beforeCommitIdx);
    assert.equal(healthWriter.stageId, child.request.subflowId + '/health-result');
    const prepared = await source.load(child.request);
    assert.equal(prepared.snapshots.length, 3); assert.equal(prepared.snapshots.at(-1).memory.healthy, true);
    lineage.push({ parentKey: child.outputKey, parentRuntimeStageId: parentWriter.runtimeStageId,
      attribution: handoff.attribution, childKey: 'healthy', childRuntimeStageId: healthWriter.runtimeStageId });
  }
} finally { source.dispose(); }
// Re-run the simulation to check semantic reproducibility. Native IDs, timings,
// run addresses and recorded parallel interleaving remain genuine capture facts.
const repeated = await capture();
assert.deepEqual(repeated.snapshot.sharedState, full.snapshot.sharedState);
assert.deepEqual(repeated.graph, full.graph);
const rootStats = { stages: 7, graphNodes: overview.graph.nodes.length, commits: overview.snapshot.commitLog.length,
  narrativeEntries: overview.narrativeEntries.length, allNarrativeEntries: full.narrativeEntries.length };
const manifest = { version: 1, simulation: true, seed: SEED,
  description: 'Recorded local deployment simulation; no infrastructure was contacted, configured or deployed.',
  generatedAt: new Date().toISOString(), packages: registryEvidence(), rootStats,
  children: children.map(child => ({ ...child.request, file: child.request.subflowId + '.json', stages: 3,
    graphNodes: child.payload.graph.nodes.length, commits: child.payload.result.treeContext.history.length,
    narrativeEntries: child.payload.narrativeEntries.length, outputKey: child.outputKey, childKey: 'healthy',
    sha256: sha256(bytes(child.payload)) })),
  narrativePartition: 'Exact child runtimeStageId prefixes go to that child; recorded mount-boundary entries remain in the overview. Original entry objects/order are retained.',
  omittedRecorderPayloads: omittedRecorders, metricsNotice: 'Aggregate recorder payloads are omitted from the overview to avoid embedding child details. Native root/tree/log facts and every recorded narrative entry are retained in their scoped file.',
  reproducibility: 'The fixed seed repeats shared-state outcome and public graph. Run IDs, timestamps, metrics and parallel event interleaving may differ.',
};
const destination = join(here, 'recording'); mkdirSync(destination, { recursive: true });
writeFileSync(join(destination, 'overview.json'), bytes(overview));
for (const child of children) writeFileSync(join(destination, child.request.subflowId + '.json'), bytes(child.payload));
writeFileSync(join(destination, 'manifest.json'), bytes(manifest));
if (process.env.DEPLOYMENT_CAPTURE_RAW) {
  const raw = resolve(process.env.DEPLOYMENT_CAPTURE_RAW); writeFileSync(raw, bytes(full));
  writeFileSync(raw + '.proof.json', bytes({ rootStats, lineage, sourceLazyAdmissionPassed: true, semanticRerunPassed: true,
    producerSha256: sha256(readFileSync(fileURLToPath(import.meta.url))), overviewSha256: sha256(bytes(overview)),
    children: manifest.children, packages: manifest.packages, narrativePartitionPreservesAllEntries: true }));
}
console.log(JSON.stringify({ rootStats, lineage, children: manifest.children, overviewBytes: Buffer.byteLength(bytes(overview)) }, null, 2));
