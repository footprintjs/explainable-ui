/**
 * Test setup — runs for all environments.
 * Guards DOM stubs behind typeof check so node-only tests aren't affected.
 */
import { afterEach } from 'vitest';

// jsdom stubs (no-op in node environment)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};

  // ResizeObserver — required by @xyflow/react inside ExplainableShell.
  // jsdom doesn't ship it. A noop stub is enough for our render assertions.
  if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
    (globalThis as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Auto-cleanup after each test
  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  });
}
