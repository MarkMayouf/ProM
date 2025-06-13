import { RETURNS_URL } from '../constants';
import { apiSlice } from './apiSlice';

export const returnApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all returns (Admin)
    getReturns: builder.query({
      query: (params) => ({
        url: RETURNS_URL,
        params: {
          pageNumber: params?.pageNumber || 1,
          limit: params?.limit || 10,
          status: params?.status,
          priority: params?.priority,
          assigned: params?.assigned,
          search: params?.search
        }
      }),
      providesTags: ['Return'],
      keepUnusedDataFor: 5
    }),

    // Get user's returns
    getUserReturns: builder.query({
      query: () => ({
        url: `${RETURNS_URL}/mine`
      }),
      providesTags: ['Return'],
      keepUnusedDataFor: 5
    }),

    // Get return by ID
    getReturnById: builder.query({
      query: (returnId) => ({
        url: `${RETURNS_URL}/${returnId}`
      }),
      providesTags: (result, error, returnId) => [
        { type: 'Return', id: returnId }
      ]
    }),

    // Get return statistics (Admin)
    getReturnStats: builder.query({
      query: () => ({
        url: `${RETURNS_URL}/stats`
      }),
      providesTags: ['ReturnStats'],
      keepUnusedDataFor: 5
    }),

    // Create new return request
    createReturn: builder.mutation({
      query: (returnData) => ({
        url: RETURNS_URL,
        method: 'POST',
        body: returnData
      }),
      invalidatesTags: ['Return', 'ReturnStats']
    }),

    // Update return status (Admin)
    updateReturnStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `${RETURNS_URL}/${id}/status`,
        method: 'PUT',
        body: { status, notes }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Return', id },
        'Return',
        'ReturnStats'
      ]
    }),

    // Process return refund (Admin)
    processReturnRefund: builder.mutation({
      query: ({ id, ...refundData }) => ({
        url: `${RETURNS_URL}/${id}/refund`,
        method: 'PUT',
        body: refundData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Return', id },
        'Return',
        'ReturnStats'
      ]
    }),

    // Add quality check results (Admin)
    addQualityCheck: builder.mutation({
      query: ({ id, ...qualityData }) => ({
        url: `${RETURNS_URL}/${id}/quality-check`,
        method: 'PUT',
        body: qualityData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Return', id },
        'Return',
        'ReturnStats'
      ]
    })
  })
});

export const {
  useGetReturnsQuery,
  useGetUserReturnsQuery,
  useGetReturnByIdQuery,
  useGetReturnStatsQuery,
  useCreateReturnMutation,
  useUpdateReturnStatusMutation,
  useProcessReturnRefundMutation,
  useAddQualityCheckMutation
} = returnApiSlice; 