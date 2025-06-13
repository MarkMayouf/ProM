import {
  PRODUCTS_URL,
  UPLOAD_URL
} from '../constants';
import {
  apiSlice
} from './apiSlice';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ 
        keyword, 
        pageNumber, 
        category, 
        subcategory, 
        sort, 
        minPrice, 
        maxPrice, 
        filters,
        limit,
        sale
      }) => {
        const params = {};
        
        // Add parameters only if they have valid values
        if (keyword) params.keyword = keyword;
        if (pageNumber) params.pageNumber = pageNumber;
        if (category) params.category = category;
        if (subcategory) params.subcategory = subcategory;
        if (sort) params.sort = sort;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (limit) params.limit = limit;
        if (sale) params.sale = sale;
        
        // Merge any additional filters
        if (filters) {
          Object.assign(params, filters);
        }
        

        
        return {
          url: PRODUCTS_URL,
          params,
        };
      },
      keepUnusedDataFor: 5,
      providesTags: ['Products'],
    }),
    getProductDetails: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
      }),
      keepUnusedDataFor: 5,
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: PRODUCTS_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data._id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    uploadProductImage: builder.mutation({
      query: (data) => ({
        url: `${UPLOAD_URL}`,
        method: 'POST',
        body: data,
        formData: true,
        prepareHeaders: (headers) => {
          headers.delete('Content-Type');
          return headers;
        },
      }),
    }),
    uploadMultipleProductImages: builder.mutation({
      query: (data) => ({
        url: `${UPLOAD_URL}/multiple`,
        method: 'POST',
        body: data,
        formData: true,
        prepareHeaders: (headers) => {
          headers.delete('Content-Type');
          return headers;
        },
      }),
    }),
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: 'DELETE',
      }),
      providesTags: ['Products'],
    }),
    createReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),
    getTopProducts: builder.query({
      query: () => `${PRODUCTS_URL}/top`,
      keepUnusedDataFor: 5,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useUploadMultipleProductImagesMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useGetTopProductsQuery,
} = productsApiSlice;