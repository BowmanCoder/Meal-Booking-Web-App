import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { userAuthAPI } from "../services/userAuthAPI";
import authReducer from "../features/authSlice";
import userReducer from "../features/userSlice";

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [userAuthAPI.reducerPath]: userAuthAPI.reducer,
    auth: authReducer,
    user: userReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userAuthAPI.middleware),
});

setupListeners(store.dispatch);
