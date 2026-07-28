import { create } from "zustand";
import { DEFAULT_DEPARTMENT, DEPARTMENT_STORAGE_KEY, GRADE_ORDER } from "../lib/constants";
import type { Filters } from "../lib/utils";

function initParam(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

function initDepartment(): string {
  if (typeof window === "undefined") return DEFAULT_DEPARTMENT;
  const fromUrl = new URLSearchParams(window.location.search).get("dept");
  if (fromUrl) return fromUrl;
  try {
    return window.localStorage.getItem(DEPARTMENT_STORAGE_KEY) || DEFAULT_DEPARTMENT;
  } catch {
    return DEFAULT_DEPARTMENT;
  }
}

function isDescByDefault(key: string): boolean {
  return GRADE_ORDER.includes(key) || key === "termCount" || key === "latestTotalCount";
}

interface FilterStore extends Filters {
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
  search: initParam("q", ""),
  deptFilter: initDepartment(),
  aPlusFullFilter: initParam("aplus", "exclude"),
  recentOnly: initParam("recent", "on"),
  noGradeFilter: initParam("nograde", "exclude"),
  liberalArtsOnly: initParam("liberal", "off"),
  sortBy: initParam("sort", "A+"),
  sortDir: initParam("dir", "desc"),

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
