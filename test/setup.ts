/**
 * Test setup — runs for all environments.
 * Guards DOM stubs behind typeof check so node-only tests aren't affected.
 */
import { afterEach } from 'vitest';

// jsdom stubs (no-op in node environment)
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};

  // Auto-cleanup after each test
  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  });
}
