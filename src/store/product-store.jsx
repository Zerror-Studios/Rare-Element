import { create } from 'zustand';

const useProductStore = create((set) => ({
  products: [],
  totalCount: 0,
  filters: {},
  offset: 0,
  limit: 20,
  loading: false,
  hasMore: false,

  setInitialProducts: (products, totalCount) => {
    set({
      products,
      totalCount,
      offset: products.length,
      hasMore: products.length < totalCount,
    });
  },

  appendProducts: (newProducts, totalCount) => {
    set((state) => {
      const updatedProducts = [...state.products, ...newProducts];
      return {
        products: updatedProducts,
        totalCount,
        offset: updatedProducts.length,
        hasMore: updatedProducts.length < totalCount,
      };
    });
  },

  setFilters: (newFilters) => {
    set({
      filters: newFilters,
      products: [],
      offset: 0,
      hasMore: false,
      totalCount: 0,
    });
  },

  setLoading: (loading) => set({ loading }),

  resetStore: () => {
    set({
      products: [],
      totalCount: 0,
      filters: {},
      offset: 0,
      hasMore: false,
      loading: false,
    });
  },
}));

export default useProductStore;
