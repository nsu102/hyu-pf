import Papa from "papaparse";
import { create } from "zustand";
import { DEFAULT_DEPARTMENT } from "../lib/constants";
import type { CourseCatalogRow, DepartmentCourseRow, GradeRow } from "../lib/types";
import { useFilterStore } from "./filterStore";

interface DataStore {
  raw: GradeRow[];
  catalog: CourseCatalogRow[];
  departmentCourses: DepartmentCourseRow[];
  loading: boolean;
  loadData: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  raw: [],
  catalog: [],
  departmentCourses: [],
  loading: true,
  loadData: () => {
    set({ loading: true });
    const cacheKey = Date.now();
    Promise.all([
      fetch(`/data/grade_ratios_by_year.csv?t=${cacheKey}`).then((r) => r.text()),
      fetch(`/data/courses.csv?t=${cacheKey}`).then((r) => r.text()),
      fetch(`/data/department_courses.csv?t=${cacheKey}`).then((r) => r.text()),
    ]).then(([gradeText, catalogText, departmentCourseText]) => {
      const parsedGrades = Papa.parse<GradeRow>(gradeText, { header: true, skipEmptyLines: true });
      const parsedCatalog = Papa.parse<CourseCatalogRow>(catalogText, { header: true, skipEmptyLines: true });
      const parsedDepartmentCourses = Papa.parse<DepartmentCourseRow>(departmentCourseText, { header: true, skipEmptyLines: true });
      const availableDepartments = new Set(parsedDepartmentCourses.data.map((row) => row.dept_name).filter(Boolean));
      set({
        raw: parsedGrades.data.filter((r) => r.course_no && r.year && r.grade),
        catalog: parsedCatalog.data.filter((r) => r.course_no),
        departmentCourses: parsedDepartmentCourses.data.filter((r) => r.course_no && r.dept_name),
        loading: false,
      });
      const { deptFilter, setDeptFilter } = useFilterStore.getState();
      if (deptFilter && !availableDepartments.has(deptFilter)) setDeptFilter(DEFAULT_DEPARTMENT);
    });
  },
}));
