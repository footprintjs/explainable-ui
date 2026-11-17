/** Explicit host-worker bridge. No worker URL, engine runtime or worker lifetime is created here. */
export { createSubflowWorkerPreparation } from './worker/bridge';
export type { SubflowWorkerPreparation } from './worker/bridge';
export { attachSubflowWorker } from './worker/handler';
