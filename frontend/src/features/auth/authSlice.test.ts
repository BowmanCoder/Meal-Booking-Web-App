import { describe, expect, it } from "vitest";

import { createAppStore } from "../../app/store";
import { clearTokens, setTokens } from "./authSlice";

const STORAGE_KEY = "bookmymeal.tokens";

describe("auth session", () => {
  it("starts signed out", () => {
    expect(createAppStore().getState().auth).toEqual({ access: null, refresh: null });
  });

  it("saves the session when signing in and removes it when signing out", () => {
    const store = createAppStore();
    store.dispatch(setTokens({ access: "a1", refresh: "r1" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")).toEqual({ access: "a1", refresh: "r1" });

    store.dispatch(clearTokens());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores a saved session, and ignores a corrupted one", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ access: "a2", refresh: "r2" }));
    expect(createAppStore().getState().auth).toEqual({ access: "a2", refresh: "r2" });

    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(createAppStore().getState().auth).toEqual({ access: null, refresh: null });
  });
});
