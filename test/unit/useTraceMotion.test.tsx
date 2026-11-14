/** @vitest-environment jsdom */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TRACE_MOTION_MS, useTraceMotion } from "../../src/_internal/useTraceMotion";

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
afterEach(() => {
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else Reflect.deleteProperty(window, "matchMedia");
});

function install(value: unknown) {
  Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value });
}

function preference(reduced: boolean, legacy = false) {
  const listeners = new Set<() => void>();
  let current = reduced;
  let reads = 0;
  const add = vi.fn((...args: unknown[]) => listeners.add(args[args.length - 1] as () => void));
  const remove = vi.fn((...args: unknown[]) => listeners.delete(args[args.length - 1] as () => void));
  const media = {
    get matches() { reads++; return current; },
    ...(legacy ? { addListener: add, removeListener: remove } : { addEventListener: add, removeEventListener: remove }),
  };
  const matchMedia = vi.fn(() => media);
  install(matchMedia);
  return {
    media, matchMedia, listeners, add, remove,
    readCount: () => reads,
    change(next: boolean) { current = next; act(() => { for (const notify of listeners) notify(); }); },
  };
}

describe("useTraceMotion", () => {
  it("keeps SSR motion off without reading browser preferences", () => {
    const host = preference(false);
    function Probe() { return createElement("span", null, String(useTraceMotion())); }
    expect(renderToString(createElement(Probe))).toBe("<span>false</span>");
    expect(host.matchMedia).not.toHaveBeenCalled();
    expect(TRACE_MOTION_MS).toBe(240);
  });

  it.each([false, true])("follows live modern preference changes (initial reduce=%s)", reduced => {
    const host = preference(reduced);
    const hook = renderHook(() => useTraceMotion());
    expect(hook.result.current).toBe(!reduced);
    expect(host.matchMedia).toHaveBeenCalledExactlyOnceWith("(prefers-reduced-motion: reduce)");
    expect(host.add).toHaveBeenCalledWith("change", expect.any(Function));
    host.change(true);
    expect(hook.result.current).toBe(false);
    host.change(false);
    expect(hook.result.current).toBe(true);

    const lateCallback = [...host.listeners][0];
    hook.unmount();
    expect(host.remove).toHaveBeenCalledWith("change", lateCallback);
    expect(host.listeners.size).toBe(0);
    const readsAfterUnmount = host.readCount();
    lateCallback();
    expect(host.readCount()).toBe(readsAfterUnmount);
  });

  it("subscribes and cleans up through the legacy MediaQueryList API", () => {
    const host = preference(true, true);
    const hook = renderHook(() => useTraceMotion());
    expect(hook.result.current).toBe(false);
    host.change(false);
    expect(hook.result.current).toBe(true);
    const callback = [...host.listeners][0];
    hook.unmount();
    expect(host.remove).toHaveBeenCalledExactlyOnceWith(callback);
    expect(host.listeners.size).toBe(0);
  });

  it("falls back to legacy listeners when a host rejects modern registration", () => {
    const host = preference(false, true);
    Object.assign(host.media, {
      addEventListener() { throw new Error("unsupported modern listener"); },
      removeEventListener() {},
    });
    const hook = renderHook(() => useTraceMotion());
    expect(hook.result.current).toBe(true);
    host.change(true);
    expect(hook.result.current).toBe(false);
    hook.unmount();
    expect(host.remove).toHaveBeenCalledOnce();
  });

  it("does not let unsupported listener property access or cleanup break the host", () => {
    const broken = Object.defineProperty({ matches: false }, "addEventListener", {
      get() { throw new Error("unsupported listener property"); },
    });
    install(() => broken);
    const unsupported = renderHook(() => useTraceMotion());
    expect(unsupported.result.current).toBe(false);
    unsupported.unmount();

    const host = preference(false);
    Object.assign(host.media, { removeEventListener() { throw new Error("unsupported cleanup"); } });
    const mounted = renderHook(() => useTraceMotion());
    expect(mounted.result.current).toBe(true);
    expect(() => mounted.unmount()).not.toThrow();
  });

  it.each([
    undefined,
    () => { throw new Error("unsupported preference"); },
    () => undefined,
    () => ({ matches: undefined }),
    () => ({ matches: false }),
    () => ({ matches: false, addEventListener() { throw new Error("unsupported listener"); }, removeEventListener() {} }),
  ])("keeps motion off for unsupported hosts without throwing", matchMedia => {
    install(matchMedia);
    const hook = renderHook(() => useTraceMotion());
    expect(hook.result.current).toBe(false);
    expect(() => hook.unmount()).not.toThrow();
  });
});
