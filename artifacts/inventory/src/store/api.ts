import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './index';

const baseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Products', 'Movements', 'Dashboard', 'Categories', 'Me'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),

    // Products
    getProducts: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.lowStock) queryParams.append('lowStock', String(params.lowStock));
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.sort) queryParams.append('sort', params.sort);
        return `/products?${queryParams.toString()}`;
      },
      providesTags: ['Products'],
    }),
    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Categories'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products', 'Dashboard', 'Categories'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        'Products',
        'Dashboard',
        'Categories'
      ],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products', 'Dashboard', 'Categories'],
    }),

    // Movements
    getMovements: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.productId) queryParams.append('productId', params.productId);
        if (params?.type) queryParams.append('type', params.type);
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        return `/movements?${queryParams.toString()}`;
      },
      providesTags: ['Movements'],
    }),
    createMovement: builder.mutation({
      query: (body) => ({
        url: '/movements',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        'Movements',
        'Products',
        { type: 'Product', id: productId },
        'Dashboard'
      ],
    }),

    // Dashboard
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetMovementsQuery,
  useCreateMovementMutation,
  useGetDashboardSummaryQuery,
} = api;
