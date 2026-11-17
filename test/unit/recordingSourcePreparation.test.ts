import { expect, it } from 'vitest';
import { prepareSubflow } from '../../src/progressiveRendering/prepare';

it('projects a real-shaped raw engine child rather than treating it as a root RuntimeSnapshot', async () => {
  const result = { subflowId: 'child', treeContext: { globalContext: {},
    stageContexts: { id: 'child/sum', name: 'child/Sum', runtimeStageId: 'child/sum#9', stageReads: {}, stageWrites: { total: 35 } },
    history: [{ stage: 'child/Sum', stageId: 'child/sum', runtimeStageId: 'child/sum#9', trace: [{ path: 'total' }], overwrite: { total: 35 } }],
  } };
  const value = await prepareSubflow({ result }, { invocationPath: ['child#1'], mountRuntimeStageId: 'child#1', subflowId: 'child' }, { signal: new AbortController().signal });
  expect(value.snapshots).toHaveLength(1);
  expect(value.snapshots[0]).toMatchObject({ runtimeStageId: 'child/sum#9', memory: { total: 35 } });
  expect(result).not.toHaveProperty('snapshots');
});
