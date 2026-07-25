import { DEFAULT_DEPARTMENT, GRADE_COLORS, GRADE_ORDER } from "./constants";
import type { CourseCatalogRow, CourseSummary, DepartmentCourseRow, GradeRow, TermData } from "./types";

export function gradeColor(val: number): string {
  if (val >= 35) return "#15803d";
  if (val >= 25) return "#166534";
  if (val >= 15) return "#1d4ed8";
  if (val >= 5) return "#7c3aed";
  return "#94a3b8";
}

export function gradeTone(grade: string): string {
  return GRADE_COLORS[grade] || "#94a3b8";
}

export function sumGrades(grades: Record<string, number>, targets: string[]): number {
  return targets.reduce((sum, grade) => sum + (grades[grade] || 0), 0);
}

export function formatRatio(value: number): string {
  if (!value) return "-";
  return `${value.toFixed(1)}%`;
}

export function formatDepartmentNames(names: string[], visibleCount = 2): string {
  if (names.length <= visibleCount) return names.join(", ");
  return `${names.slice(0, visibleCount).join(", ")} 외 ${names.length - visibleCount}개`;
}

export function getTextSortValue(course: CourseSummary, key: string): string {
  if (key === "course_no") return course.course_no;
  if (key === "course_name") return course.course_name;
  if (key === "dept_name") return course.departmentNames.join(", ");
  if (key === "opening_dept") return course.opening_dept;
  if (key === "year_term_range") return course.year_term_range;
  return "";
}

export function buildSummaries(rows: GradeRow[], catalogRows: CourseCatalogRow[], departmentCourseRows: DepartmentCourseRow[]): CourseSummary[] {
  const map = new Map<string, { meta: GradeRow | CourseCatalogRow; terms: Map<string, { grades: Record<string, number>; counts: Record<string, number> }>; parseStatus: string }>();
  const departmentsByCourse = new Map<string, Set<string>>();

  for (const link of departmentCourseRows) {
    if (!link.course_no || !link.dept_name) continue;
    if (!departmentsByCourse.has(link.course_no)) departmentsByCourse.set(link.course_no, new Set());
    departmentsByCourse.get(link.course_no)!.add(link.dept_name);
  }

  for (const course of catalogRows) {
    if (!course.course_no) continue;
    map.set(course.course_no, { meta: course, terms: new Map(), parseStatus: course.parse_status || "" });
  }

  for (const row of rows) {
    const key = row.course_no;
    if (!map.has(key)) {
      map.set(key, { meta: row, terms: new Map(), parseStatus: "ok" });
    }
    const entry = map.get(key)!;
    entry.meta = row;
    entry.parseStatus = "ok";
    const termKey = `${row.year}-${row.term}`;
    if (!entry.terms.has(termKey)) {
      entry.terms.set(termKey, { grades: {}, counts: {} });
    }
    const t = entry.terms.get(termKey)!;
    const normalGrade = row.grade.replace(/0$/, "");
    t.grades[normalGrade] = parseFloat(row.ratio) || 0;
    t.counts[normalGrade] = parseInt(row.count) || 0;
  }

  const summaries: CourseSummary[] = [];
  for (const [, { meta, terms, parseStatus }] of map) {
    const termArr: TermData[] = [...terms.entries()]
      .map(([k, v]) => {
        const [y, t] = k.split("-").map(Number);
        const totalCount = Object.values(v.counts).reduce((sum, count) => sum + count, 0);
        return { year: y, term: t, totalCount, grades: v.grades, counts: v.counts };
      })
      .sort((a, b) => a.year === b.year ? a.term - b.term : a.year - b.year);

    const latest = termArr[termArr.length - 1];
    // ponytail: no-grade courses have no term data, so read recency from the year_term_range end ("2015/1 ~ 2017/2" -> 2017)
    const rangeEndYear = Number(meta.year_term_range?.match(/(\d{4})\/\d\s*$/)?.[1]) || 0;
    const deptName = "dept_name" in meta ? meta.dept_name : meta.canonical_dept_name;
    const departmentNames = [...(departmentsByCourse.get(meta.course_no) || new Set<string>())];
    if (deptName && !departmentNames.includes(deptName)) departmentNames.push(deptName);
    summaries.push({
      course_no: meta.course_no,
      course_name: meta.course_name,
      dept_name: deptName,
      opening_dept: meta.opening_dept,
      year_term_range: meta.year_term_range,
      latestYear: latest?.year || 0,
      latestTerm: latest?.term || 0,
      recentYear: latest?.year || rangeEndYear,
      latestTotalCount: latest?.totalCount || 0,
      termCount: termArr.length,
      grades: latest?.grades || {},
      counts: latest?.counts || {},
      terms: termArr,
      hasGradeData: termArr.length > 0,
      parseStatus,
      departmentNames,
    });
  }
  return summaries;
}

export interface Filters {
  search: string;
  deptFilter: string;
  aPlusFullFilter: string;
  recentOnly: string;
  noGradeFilter: string;
  sortBy: string;
  sortDir: string;
}

export function filterAndSort(summaries: CourseSummary[], f: Filters): CourseSummary[] {
  if (!f.deptFilter) return [];
  let result = f.deptFilter === DEFAULT_DEPARTMENT
    ? summaries
    : summaries.filter((s) => s.departmentNames.includes(f.deptFilter));
  if (f.noGradeFilter === "exclude") result = result.filter((s) => s.hasGradeData);
  if (f.aPlusFullFilter === "exclude") result = result.filter((s) => (s.grades["A+"] || 0) < 99.995);
  if (f.recentOnly === "on") result = result.filter((s) => s.recentYear >= 2024);
  if (f.search) {
    const q = f.search.toLowerCase();
    result = result.filter((s) =>
      s.course_name.toLowerCase().includes(q) ||
      s.course_no.toLowerCase().includes(q) ||
      s.departmentNames.some((departmentName) => departmentName.toLowerCase().includes(q)) ||
      s.opening_dept?.toLowerCase().includes(q)
    );
  }
  const isGrade = GRADE_ORDER.includes(f.sortBy);
  return [...result].sort((a, b) => {
    if (isGrade) {
      const av = a.grades[f.sortBy] || 0;
      const bv = b.grades[f.sortBy] || 0;
      return f.sortDir === "desc" ? bv - av : av - bv;
    }
    if (f.sortBy === "termCount") {
      return f.sortDir === "desc" ? b.termCount - a.termCount : a.termCount - b.termCount;
    }
    if (f.sortBy === "latestTotalCount") {
      return f.sortDir === "desc" ? b.latestTotalCount - a.latestTotalCount : a.latestTotalCount - b.latestTotalCount;
    }
    const av = getTextSortValue(a, f.sortBy).toLowerCase();
    const bv = getTextSortValue(b, f.sortBy).toLowerCase();
    return f.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}
