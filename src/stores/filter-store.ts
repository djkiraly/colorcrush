import { create } from "zustand";

interface FilterStore {
  category: string | null;
  tags: string[];
  priceRange: [number, number];
  sort: string;
  search: string;
  page: number;

  setCategory: (category: string | null) => void;
  toggleTag: (tag: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSort: (sort: string) => void;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const initialState = {
  category: null,
  tags: [] as string[],
  priceRange: [0, 100] as [number, number],
  sort: "featured",
  search: "",
  page: 1,
};

export const useFilterStore = create<FilterStore>()((set) => ({
  ...initialState,

  setCategory: (category) => set({ category, page: 1 }),
  toggleTag: (tag) =>
    set((state) => ({
      tags: state.tags.includes(tag)
        ? state.tags.filter((t) => t !== tag)
        : [...state.tags, tag],
      page: 1,
    })),
  setPriceRange: (priceRange) => set({ priceRange, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(initialState),
}));
