import { configureStore } from "@reduxjs/toolkit";

import { baseApi } from "../api/baseApi";
import authReducer, { saveTokens } from "../features/auth/authSlice";

export const store = configureStore({
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
