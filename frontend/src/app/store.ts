import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "../api/baseApi";
import authReducer, { saveTokens } from "../features/auth/authSlice";

/** Build a store. The app uses one; each test builds its own. */
export function createAppStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

  // Keep the session across page reloads.
  let lastSaved = store.getState().auth;
  store.subscribe(() => {
    const current = store.getState().auth;
    if (current !== lastSaved) {
      lastSaved = current;
      saveTokens(current);
    }
  });
  return store;
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
