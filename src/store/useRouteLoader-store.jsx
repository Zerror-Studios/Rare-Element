import { create } from "zustand";

let hideTimer;

export const useRouteLoaderStore = create((set) => ({
  isLoading: false,
  start: () => {
    clearTimeout(hideTimer);
    set({ isLoading: true });
  },
  stop: () => {
    hideTimer = setTimeout(() => {
      set({ isLoading: false });
    }, 300); // 👈 minimum visible duration
  },
}));
