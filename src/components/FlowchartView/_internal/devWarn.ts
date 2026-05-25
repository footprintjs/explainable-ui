/**
 * Dev-mode detection without depending on `@types/node`.
 *
 * Returns `true` when running outside an explicitly production env.
 * Browser builds (no `process` global) treat as dev — acceptable for
 * a debugging library: a user-visible warning in a browser is a
 * debugging signal anyway.
 *
 * Shared by every translator's notify path + orphan-event warnings.
 */
export function isDevModeEnv(): boolean {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  return proc?.env?.NODE_ENV !== "production";
}

/**
 * Dev-mode `console.warn` shim. No-op in production. Lazy message
 * construction (`messageFn`) — avoids string-concat cost when prod.
 */
export function devWarn(messageFn: () => string, ...extras: unknown[]): void {
  if (!isDevModeEnv()) return;
  // eslint-disable-next-line no-console
  console.warn(messageFn(), ...extras);
}
