// Run in a directory with footprintjs@14.0.0-rc.0 installed. The chart is
// the engine's examples/post-execution/causal-chain/06-subflow-output-handoff.
import { writeFileSync } from 'node:fs';
import { flowChart, FlowChartExecutor } from 'footprintjs';
import { subflowCapture } from 'footprintjs/subflow-capture';

const payment = flowChart('Charge', scope => {
  scope.txnId = `TXN-${scope.chargedAmount}`;
}, 'charge').build();

const chart = flowChart('Seed', scope => {
  scope.amount = 99;
  scope.txnId = 'UNRELATED-PARENT-VALUE';
}, 'seed')
  .addSubFlowChartNext('payment', payment, 'Payment', {
    inputMapper: parent => ({ chargedAmount: parent.amount }),
    outputMapper: child => ({ receipt: child.txnId }),
  })
  .addFunction('Ship', scope => { scope.shipped = scope.receipt !== undefined; }, 'ship')
  .build();

for (const mode of ['on', 'default']) {
  const executor = mode === 'default' ? new FlowChartExecutor(chart) : new FlowChartExecutor(chart, {
    readTracking: 'full', writeProvenance: 'reads-prefix', nestedReadTracking: true,
    captureOutputHandoff: true, ...subflowCapture({ input: true, fanout: true }),
    captureCoverage: true, readSources: true,
  });
  await executor.run();
  writeFileSync(new URL(`./${mode}.json`, import.meta.url), JSON.stringify(executor.getSnapshot(), null, 2) + '\n');
}
