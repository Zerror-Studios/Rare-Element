import { create } from 'zustand';

const useCategoryStore = create((set) => ({
  products: [],
  totalCount: 0,
  offset: 0,
  limit: 12,
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

  setLoading: (loading) => set({ loading }),

  resetStore: () => {
    set({
      products: [],
      totalCount: 0,
      offset: 0,
      hasMore: false,
      loading: false,
    });
  },
}));

export default useCategoryStore;
