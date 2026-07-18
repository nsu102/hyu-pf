export interface GradeRow {
  course_no: string;
  course_name: string;
  year: string;
  term: string;
  grade: string;
  count: string;
  ratio: string;
  campus_code: string;
  dept_code: string;
  dept_name: string;
  opening_dept: string;
  year_term_range: string;
  pdf_path: string;
}

export interface CourseCatalogRow {
  course_no: string;
  course_name: string;
  canonical_dept_name: string;
  opening_dept: string;
  year_term_range: string;
  parse_status: string;
}

export interface DepartmentCourseRow {
  course_no: string;
  dept_name: string;
}

export interface CourseSummary {
  course_no: string;
  course_name: string;
  dept_name: string;
  opening_dept: string;
  year_term_range: string;
  latestYear: number;
  latestTerm: number;
  recentYear: number;
  latestTotalCount: number;
  termCount: number;
  grades: Record<string, number>;
  counts: Record<string, number>;
  terms: TermData[];
  hasGradeData: boolean;
  parseStatus: string;
  departmentNames: string[];
}

export interface TermData {
  year: number;
  term: number;
  totalCount: number;
  grades: Record<string, number>;
  counts: Record<string, number>;
}
