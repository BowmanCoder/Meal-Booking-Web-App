import { baseApi } from "./baseApi";
import type { Availability, Booking, Meal, Menu } from "./types";

interface DateRange {
  date_from: string;
  date_to: string;
}

export interface CreateBookingsRequest {
  meal: number;
  /** One day. */
  date?: string;
  /** Several hand-picked days, booked all-or-nothing. */
  dates?: string[];
  guest_name?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMeals: build.query<Meal[], void>({
      query: () => "meals/",
      providesTags: ["Meals"],
    }),
    getMenus: build.query<Menu[], DateRange & { meal: number }>({
      query: (params) => ({ url: "menus/", params }),
      providesTags: ["Menus"],
    }),
    getAvailability: build.query<Availability, DateRange & { meal: number }>({
      query: (params) => ({ url: "bookings/availability/", params }),
      providesTags: ["Availability"],
    }),
    getMyBookings: build.query<Booking[], { date_from?: string; date_to?: string } | void>({
      query: (params) => ({ url: "bookings/", params: { mine: 1, ...(params ?? {}) } }),
      providesTags: ["Bookings"],
    }),
    createBookings: build.mutation<Booking[], CreateBookingsRequest>({
      query: (body) => ({ url: "bookings/", method: "POST", body }),
      invalidatesTags: ["Bookings", "Availability"],
    }),
    cancelBooking: build.mutation<void, number>({
      query: (id) => ({ url: `bookings/${id}/`, method: "DELETE" }),
      invalidatesTags: ["Bookings", "Availability"],
    }),
  }),
});

export const {
  useGetMealsQuery,
  useGetMenusQuery,
  useGetAvailabilityQuery,
  useGetMyBookingsQuery,
  useCreateBookingsMutation,
  useCancelBookingMutation,
} = bookingApi;
