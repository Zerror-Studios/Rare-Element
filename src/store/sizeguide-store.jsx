import { create } from "zustand";

export const useSizeGuideStore = create((set) => ({
  isSizeGuideOpen: false,
  sizeGuideImage: null, 
  openSizeGuide: (image) =>
    set({
      isSizeGuideOpen: true,
      sizeGuideImage: image,
    }),

  closeSizeGuide: () =>
    set({
      isSizeGuideOpen: false,
    }),

  toggleSizeGuide: (image = null) =>
    set((state) => ({
      isSizeGuideOpen: !state.isSizeGuideOpen,
      sizeGuideImage: image ?? state.sizeGuideImage,
    })),
}));
