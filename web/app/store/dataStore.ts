import Papa from "papaparse";
import { create } from "zustand";
import { DEFAULT_DEPARTMENT } from "../lib/constants";
import type { CourseCatalogRow, CourseClassificationRow, DepartmentCourseRow, GradeRow } from "../lib/types";
import { useFilterStore } from "./filterStore";

interface DataStore {
  raw: GradeRow[];
  catalog: CourseCatalogRow[];
  departmentCourses: DepartmentCourseRow[];
  courseClassifications: CourseClassificationRow[];
  loading: boolean;
  loadData: () => void;
}

export const useDataStore = create<DataStore>((set) => ({
  raw: [],
  catalog: [],
  departmentCourses: [],
  courseClassifications: [],
  loading: true,
  loadData: () => {
    set({ loading: true });
    const cacheKey = Date.now();
    Promise.all([
      fetch(`/data/grade_ratios_by_year.csv?t=${cacheKey}`).then((r) => r.text()),
      fetch(`/data/courses.csv?t=${cacheKey}`).then((r) => r.text()),
      fetch(`/data/department_courses.csv?t=${cacheKey}`).then((r) => r.text()),
      fetch(`/data/course_classifications.csv?t=${cacheKey}`).then((r) => r.text()),
    ]).then(([gradeText, catalogText, departmentCourseText, courseClassificationText]) => {
      const parsedGrades = Papa.parse<GradeRow>(gradeText, { header: true, skipEmptyLines: true });
      const parsedCatalog = Papa.parse<CourseCatalogRow>(catalogText, { header: true, skipEmptyLines: true });
      const parsedDepartmentCourses = Papa.parse<DepartmentCourseRow>(departmentCourseText, { header: true, skipEmptyLines: true });
      const parsedCourseClassifications = Papa.parse<CourseClassificationRow>(courseClassificationText, { header: true, skipEmptyLines: true });
      const availableDepartments = new Set(parsedDepartmentCourses.data.map((row) => row.dept_name).filter(Boolean));
      set({
        raw: parsedGrades.data.filter((r) => r.course_no && r.year && r.grade),
        catalog: parsedCatalog.data.filter((r) => r.course_no),
        departmentCourses: parsedDepartmentCourses.data.filter((r) => r.course_no && r.dept_name),
        courseClassifications: parsedCourseClassifications.data.filter((r) => r.course_no && r.completion_type),
        loading: false,
      });
      const { deptFilter, setDeptFilter } = useFilterStore.getState();
      if (deptFilter && !availableDepartments.has(deptFilter)) setDeptFilter(DEFAULT_DEPARTMENT);
    });
  },
}));
