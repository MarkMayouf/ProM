import { apiSlice } from "./apiSlice";
import { COUPONS_URL } from "../constants";

export const couponsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    applyCoupon: builder.mutation({
      query: (data) => ({
        url: `${COUPONS_URL}/apply`,
        method: "POST",
        body: data,
      }),
    }),
    getCoupons: builder.query({
      query: (params = {}) => {
        const { type } = params;
        let url = COUPONS_URL;
        
        // If type is specified, add as query parameter
        if (type) {
          url = `${COUPONS_URL}?type=${type}`;
        }
        
        return {
          url,
        };
      },
      providesTags: ["Coupon"],
      keepUnusedDataFor: 5,
    }),
    getCouponDetails: builder.query({
      query: (id) => ({
        url: `${COUPONS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createCoupon: builder.mutation({
      query: (data) => ({
        url: COUPONS_URL,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    updateCoupon: builder.mutation({
      query: ({ couponId, ...data }) => ({
        url: `${COUPONS_URL}/${couponId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Coupon"],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `${COUPONS_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupon"],
    }),
  }),
});

export const {
  useApplyCouponMutation,
  useGetCouponsQuery,
  useGetCouponDetailsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApiSlice;

