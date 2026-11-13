export type Role = "employee" | "staff" | "admin";
export type DietaryPreference = "none" | "vegetarian" | "vegan" | "gluten_free";

export const DIETARY_LABELS: Record<DietaryPreference, string> = {
  none: "No preference",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  gluten_free: "Gluten free",
};

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  staff: "Canteen staff",
  admin: "Admin",
};

export interface Tokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  fullname: string;
  role: Role;
  dietary_preference: DietaryPreference;
  email_reminders: boolean;
}

export interface Meal {
  id: number;
  name: string;
  serve_time: string;
  cutoff_time: string;
  cutoff_days_before: number;
  is_active: boolean;
}

export interface Menu {
  id: number;
  date: string;
  meal: number;
  meal_name: string;
  description: string;
}

export interface Booking {
  id: number;
  date: string;
  meal: number;
  meal_name: string;
  user: number;
  user_email: string;
  user_name: string;
  dietary_preference: DietaryPreference;
  guest_name: string;
  is_guest: boolean;
  coupon_code: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

export interface AvailabilityDay {
  date: string;
  /** When booking and cancelling close for this day (ISO date-time). */
  cutoff: string;
  is_open: boolean;
  /** The caller's own booking for this day, if any. */
  booking: number | null;
  is_redeemed: boolean;
}

export interface Availability {
  meal: number;
  days: AvailabilityDay[];
}
