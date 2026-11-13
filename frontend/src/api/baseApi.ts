import {
  createApi,
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import type { RootState } from "../app/store";
import { clearTokens, setTokens } from "../features/auth/authSlice";
import type { Tokens } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/";

// Requests that are part of signing in. A 401 from these means "wrong
// credentials", not "your session expired", so they are never retried.
const SIGN_IN_PATHS = ["login/", "register/", "token/", "resetpassword"];

// Endpoints used while signed out. They never carry a token: the server
// rejects any request with an expired one, even on its public endpoints.
const PUBLIC_ENDPOINTS = ["login", "register", "requestPasswordReset", "resetPassword"];

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const token = (getState() as RootState).auth.access;
    if (token && !PUBLIC_ENDPOINTS.includes(endpoint)) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Refresh tokens are single-use (the server rotates them), so when several
// requests fail at once they must share one refresh call.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(api: BaseQueryApi, extraOptions: object): Promise<boolean> {
  const refresh = (api.getState() as RootState).auth.refresh;
  if (!refresh) return false;
  const result = await rawBaseQuery(
    { url: "token/refresh/", method: "POST", body: { refresh } },
    api,
    extraOptions,
  );
  const tokens = result.data as Partial<Tokens> | undefined;
  if (tokens?.access) {
    api.dispatch(setTokens({ access: tokens.access, refresh: tokens.refresh ?? refresh }));
    return true;
  }
  return false;
}

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === "string" ? args : args.url;
  const isSignIn = SIGN_IN_PATHS.some((path) => url.startsWith(path));

  if (result.error?.status === 401 && !isSignIn) {
    refreshInFlight ??= refreshTokens(api, extraOptions).finally(() => {
      refreshInFlight = null;
    });
    if (await refreshInFlight) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearTokens());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile", "Meals", "Menus", "Bookings", "Availability"],
  endpoints: () => ({}),
});
