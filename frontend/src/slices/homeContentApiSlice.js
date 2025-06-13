import { apiSlice } from './apiSlice';
import { HOMECONTENT_URL } from '../constants';

export const homeContentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Public endpoints
    getHomeContent: builder.query({
      query: () => ({
        url: HOMECONTENT_URL,
      }),
      keepUnusedDataFor: 5,
      providesTags: ['HomeContent'],
    }),

    // Admin endpoints
    getHomeContentAdmin: builder.query({
      query: () => ({
        url: `${HOMECONTENT_URL}/admin`,
      }),
      providesTags: ['HomeContent'],
    }),

    getProductsForSelection: builder.query({
      query: () => ({
        url: `${HOMECONTENT_URL}/products`,
      }),
      providesTags: ['Products'],
    }),

    // Hero section endpoints
    createOrUpdateHeroSection: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/hero`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    addHeroSlide: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/hero/slide`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    updateHeroSlide: builder.mutation({
      query: ({ slideId, ...data }) => ({
        url: `${HOMECONTENT_URL}/hero/slide/${slideId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    deleteHeroSlide: builder.mutation({
      query: (slideId) => ({
        url: `${HOMECONTENT_URL}/hero/slide/${slideId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HomeContent'],
    }),

    // Collections section endpoints
    createOrUpdateCollectionsSection: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/collections`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    addCollection: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/collections/collection`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    updateCollection: builder.mutation({
      query: ({ collectionId, ...data }) => ({
        url: `${HOMECONTENT_URL}/collections/collection/${collectionId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    deleteCollection: builder.mutation({
      query: (collectionId) => ({
        url: `${HOMECONTENT_URL}/collections/collection/${collectionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HomeContent'],
    }),

    // Featured suits section endpoints
    createOrUpdateFeaturedSuitsSection: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/featured-suits`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    addFeaturedSuit: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/featured-suits/suit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    updateFeaturedSuit: builder.mutation({
      query: ({ suitId, ...data }) => ({
        url: `${HOMECONTENT_URL}/featured-suits/suit/${suitId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    deleteFeaturedSuit: builder.mutation({
      query: (suitId) => ({
        url: `${HOMECONTENT_URL}/featured-suits/suit/${suitId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HomeContent'],
    }),

    // Perfect combinations section endpoints
    createOrUpdatePerfectCombinationsSection: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/perfect-combinations`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    addPerfectCombination: builder.mutation({
      query: (data) => ({
        url: `${HOMECONTENT_URL}/perfect-combinations/combination`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    updatePerfectCombination: builder.mutation({
      query: ({ combinationId, ...data }) => ({
        url: `${HOMECONTENT_URL}/perfect-combinations/combination/${combinationId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['HomeContent'],
    }),

    deletePerfectCombination: builder.mutation({
      query: (combinationId) => ({
        url: `${HOMECONTENT_URL}/perfect-combinations/combination/${combinationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HomeContent'],
    }),
  }),
});

export const {
  useGetHomeContentQuery,
  useGetHomeContentAdminQuery,
  useGetProductsForSelectionQuery,
  useCreateOrUpdateHeroSectionMutation,
  useAddHeroSlideMutation,
  useUpdateHeroSlideMutation,
  useDeleteHeroSlideMutation,
  useCreateOrUpdateCollectionsSectionMutation,
  useAddCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useCreateOrUpdateFeaturedSuitsSectionMutation,
  useAddFeaturedSuitMutation,
  useUpdateFeaturedSuitMutation,
  useDeleteFeaturedSuitMutation,
  useCreateOrUpdatePerfectCombinationsSectionMutation,
  useAddPerfectCombinationMutation,
  useUpdatePerfectCombinationMutation,
  useDeletePerfectCombinationMutation,
} = homeContentApiSlice; 