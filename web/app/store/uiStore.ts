import { create } from "zustand";
import type { CourseSummary } from "../lib/types";

interface UiStore {
  modalCourse: CourseSummary | null;
  filterOpen: boolean;
  setModalCourse: (c: CourseSummary | null) => void;
  setFilterOpen: (v: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  modalCourse: null,
  filterOpen: false,
  setModalCourse: (c) => set({ modalCourse: c }),
  setFilterOpen: (v) => set({ filterOpen: v }),
}));
