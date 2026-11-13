import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Tokens } from "../../api/types";

export interface AuthState {
  access: string | null;
  refresh: string | null;
}

const STORAGE_KEY = "bookmymeal.tokens";
const signedOut: AuthState = { access: null, refresh: null };

function loadTokens(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return signedOut;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (typeof parsed.access === "string" && typeof parsed.refresh === "string") {
      return { access: parsed.access, refresh: parsed.refresh };
    }
  } catch {
    // Storage is unavailable or corrupted: start signed out.
  }
  return signedOut;
}

export function saveTokens(state: AuthState): void {
  try {
    if (state.access && state.refresh) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Without storage the session simply ends when the tab closes.
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadTokens,
  reducers: {
    setTokens: (_state, action: PayloadAction<Tokens>) => ({
      access: action.payload.access,
      refresh: action.payload.refresh,
    }),
    clearTokens: () => signedOut,
  },
});

export const { setTokens, clearTokens } = authSlice.actions;
export default authSlice.reducer;
