import { baseApi } from "./baseApi";
import type { Attendance, ForecastRow, Meal, Menu, PrepSheet, RedeemResponse } from "./types";

export type MealUpdate = Partial<Omit<Meal, "id">>;

/** Endpoints for canteen staff and admins. */
export const kitchenApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    redeemCoupon: build.mutation<RedeemResponse, string>({
      query: (coupon_code) => ({
        url: "bookings/redeem/",
        method: "POST",
        body: { coupon_code },
        // "Already used", "wrong day" and "not found" are answers to show the
        // scanner, not failures, so they are read like a normal response.
        validateStatus: (response) => [200, 404, 409].includes(response.status),
      }),
      invalidatesTags: ["Kitchen"],
    }),
    getPrepSheet: build.query<PrepSheet, string>({
      query: (date) => ({ url: "kitchen/prep-sheet/", params: { date } }),
      providesTags: ["Kitchen"],
    }),
    getAttendance: build.query<Attendance, void>({
      query: () => "kitchen/attendance/",
      providesTags: ["Kitchen"],
    }),
    getForecast: build.query<{ days: ForecastRow[] }, number>({
      query: (days) => ({ url: "kitchen/forecast/", params: { days } }),
      providesTags: ["Kitchen"],
    }),
    saveMenu: build.mutation<Menu, { id?: number; body: FormData }>({
      // FormData, not JSON, because a menu can carry a photo.
      query: ({ id, body }) => ({
        url: id === undefined ? "menus/" : `menus/${id}/`,
        method: id === undefined ? "POST" : "PATCH",
        body,
      }),
      invalidatesTags: ["Menus", "Kitchen"],
    }),
    deleteMenu: build.mutation<void, number>({
      query: (id) => ({ url: `menus/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Menus", "Kitchen"],
    }),
    updateMeal: build.mutation<Meal, { id: number; body: MealUpdate }>({
      query: ({ id, body }) => ({ url: `meals/${id}/`, method: "PATCH", body }),
      invalidatesTags: ["Meals", "Availability", "Kitchen"],
    }),
  }),
});

export const {
  useRedeemCouponMutation,
  useGetPrepSheetQuery,
  useGetAttendanceQuery,
  useGetForecastQuery,
  useSaveMenuMutation,
  useDeleteMenuMutation,
  useUpdateMealMutation,
} = kitchenApi;
