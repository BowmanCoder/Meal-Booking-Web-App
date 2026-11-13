import { baseApi } from "./baseApi";
import type { DietaryPreference, Tokens, User } from "./types";

interface SignInResponse {
  token: Tokens;
  msg: string;
}

export interface RegisterRequest {
  fullname: string;
  email: string;
  password: string;
  password2: string;
  dietary_preference: DietaryPreference;
}

export type ProfileUpdate = Partial<Pick<User, "fullname" | "dietary_preference" | "email_reminders">>;

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<SignInResponse, { email: string; password: string }>({
      query: (body) => ({ url: "login/", method: "POST", body }),
    }),
    register: build.mutation<SignInResponse, RegisterRequest>({
      query: (body) => ({ url: "register/", method: "POST", body }),
    }),
    requestPasswordReset: build.mutation<{ msg: string }, { email: string }>({
      query: (body) => ({ url: "resetpasswordemail/", method: "POST", body }),
    }),
    resetPassword: build.mutation<
      { msg: string },
      { uid: string; token: string; password: string; password2: string }
    >({
      query: ({ uid, token, ...body }) => ({
        url: `resetpassword/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
        method: "POST",
        body,
      }),
    }),
    getProfile: build.query<User, void>({
      query: () => "profile/",
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<User, ProfileUpdate>({
      query: (body) => ({ url: "profile/", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    changePassword: build.mutation<
      { msg: string },
      { current_password: string; password: string; password2: string }
    >({
      query: (body) => ({ url: "changepassword/", method: "POST", body }),
    }),
    logout: build.mutation<void, { refresh: string }>({
      query: (body) => ({ url: "logout/", method: "POST", body }),
    }),
    logoutEverywhere: build.mutation<void, void>({
      query: () => ({ url: "logout-all/", method: "POST" }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
  useLogoutEverywhereMutation,
} = authApi;
