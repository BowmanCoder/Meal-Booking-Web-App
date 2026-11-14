import "@testing-library/jest-dom/vitest";

import { transferableAbortController } from "node:util";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The test environment mixes two worlds: jsdom supplies AbortController, while
// fetch and Request come from Node. Newer Node versions refuse a jsdom abort
// signal ("Expected signal to be an instance of AbortSignal"), which breaks
// every API call in a test. Using Node's own classes keeps the two consistent.
const nodeAbortController = transferableAbortController();
globalThis.AbortController = nodeAbortController.constructor as typeof AbortController;
globalThis.AbortSignal = nodeAbortController.signal.constructor as typeof AbortSignal;

// jsdom has no matchMedia; the theme asks it whether the device prefers dark mode.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
