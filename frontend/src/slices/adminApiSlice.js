import { apiSlice } from "./apiSlice";
import { ADMIN_URL } from "../constants"; // Assuming ADMIN_URL = "/api/admin"

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({
        url: `${ADMIN_URL}/stats`,
      }),
      providesTags: ["DashboardStats"], // Tag for caching
      keepUnusedDataFor: 60, // Keep data for 60 seconds
    }),
    // Add other admin-specific endpoints here as needed (e.g., for user management, product management if not covered elsewhere)
  }),
});

export const {
  useGetDashboardStatsQuery,
} = adminApiSlice;

