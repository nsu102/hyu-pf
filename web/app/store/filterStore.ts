import { create } from "zustand";
import { DEFAULT_DEPARTMENT, DEPARTMENT_STORAGE_KEY, GRADE_ORDER } from "../lib/constants";
import type { Filters } from "../lib/utils";

const INITIAL_FILTERS: Filters = {
  search: "",
  deptFilter: DEFAULT_DEPARTMENT,
  aPlusFullFilter: "exclude",
  recentOnly: "on",
  noGradeFilter: "exclude",
  liberalArtsOnly: "off",
  sortBy: "A+",
  sortDir: "desc",
};

function isDescByDefault(key: string): boolean {
  return GRADE_ORDER.includes(key) || key === "termCount" || key === "latestTotalCount";
}

interface FilterStore extends Filters {
  hasHydrated: boolean;
  hydrateFromClient: () => void;
  setSearch: (v: string) => void;
  setDeptFilter: (v: string) => void;
  setAPlusFullFilter: (v: string) => void;
  setRecentOnly: (v: string) => void;
  setNoGradeFilter: (v: string) => void;
  setLiberalArtsOnly: (v: string) => void;
  setSortBy: (v: string) => void;
  setSortDir: (v: string) => void;
  toggleSort: (key: string) => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...INITIAL_FILTERS,
  hasHydrated: false,

  hydrateFromClient: () => {
    if (get().hasHydrated || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    let storedDepartment = DEFAULT_DEPARTMENT;
    try {
      storedDepartment =
        window.localStorage.getItem(DEPARTMENT_STORAGE_KEY) ||
        DEFAULT_DEPARTMENT;
    } catch {
    }

    set({
      search: params.get("q") || INITIAL_FILTERS.search,
      deptFilter:
        params.get("dept") ||
        storedDepartment,
      aPlusFullFilter:
        params.get("aplus") || INITIAL_FILTERS.aPlusFullFilter,
      recentOnly: params.get("recent") || INITIAL_FILTERS.recentOnly,
      noGradeFilter:
        params.get("nograde") || INITIAL_FILTERS.noGradeFilter,
      liberalArtsOnly:
        params.get("liberal") || INITIAL_FILTERS.liberalArtsOnly,
      sortBy: params.get("sort") || INITIAL_FILTERS.sortBy,
      sortDir: params.get("dir") || INITIAL_FILTERS.sortDir,
      hasHydrated: true,
    });
  },

  setSearch: (v) => set({ search: v }),
  setDeptFilter: (v) => {
    try {
      window.localStorage.setItem(DEPARTMENT_STORAGE_KEY, v);
    } catch {
    }
    set({ deptFilter: v });
  },
  setAPlusFullFilter: (v) => set({ aPlusFullFilter: v }),
  setRecentOnly: (v) => set({ recentOnly: v }),
  setNoGradeFilter: (v) => set({ noGradeFilter: v }),
  setLiberalArtsOnly: (v) => set({ liberalArtsOnly: v }),
  setSortBy: (v) => set({ sortBy: v, sortDir: isDescByDefault(v) ? "desc" : "asc" }),
  setSortDir: (v) => set({ sortDir: v }),
  toggleSort: (key) => {
    const { sortBy, sortDir } = get();
    if (sortBy === key) set({ sortDir: sortDir === "asc" ? "desc" : "asc" });
    else set({ sortBy: key, sortDir: isDescByDefault(key) ? "desc" : "asc" });
  },
}));
