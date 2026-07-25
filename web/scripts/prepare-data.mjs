#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const SOURCE_CSV = path.resolve(process.argv[2] || "../outputs/grade_ratios_full_by_year.csv");
const OUT_DIR = path.resolve(process.argv[3] || "public/data");
const ROOT_DIR = path.resolve(OUT_DIR, "../..", "..");
const DEFAULT_CATALOG_CSV = path.join(ROOT_DIR, "outputs", "grade_ratios_full_by_year.before_two_column_fix.csv");
const CATALOG_CSV = path.resolve(
  process.env.CATALOG_CSV || process.argv[4] || (fs.existsSync(DEFAULT_CATALOG_CSV) ? DEFAULT_CATALOG_CSV : SOURCE_CSV),
);

const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "P", "S", "U"];
const LONG_COLUMNS = [
  "course_no",
  "course_name",
  "year",
  "term",
  "grade",
  "count",
  "ratio",
  "campus_code",
  "dept_code",
  "dept_name",
  "opening_dept",
  "year_term_range",
  "pdf_path",
];
const COURSE_COLUMNS = [
  "course_no",
  "course_name",
  "canonical_dept_code",
  "canonical_dept_name",
  "opening_dept",
  "year_term_range",
  "first_year",
  "first_term",
  "latest_year",
  "latest_term",
  "grade_row_count",
  "term_count",
  "department_count",
  "pdf_path",
  "parse_status",
];
const TERM_WIDE_COLUMNS = [
  "campus_code",
  "dept_code",
  "dept_name",
  "course_no",
  "course_name",
  "year",
  "term",
  "year_term_range",
  "opening_dept",
  ...GRADE_ORDER.flatMap((grade) => [`${grade}_count`, `${grade}_ratio`]),
  "parse_status",
  "pdf_path",
  "error",
  "total_count",
];

function normalizeGrade(grade) {
  return String(grade || "").replace(/^([ABCD])0$/, "$1");
}

function normalizeStatus(row) {
  const status = String(row.parse_status || "").trim();
  if (status) return status;
  if (row["수업년도"] && row["수업학기"] && row["등급"]) return "ok";
  return "unknown";
}

function compareYearTerm(aYear, aTerm, bYear, bTerm) {
  const ay = Number(aYear || 0);
  const at = Number(aTerm || 0);
  const by = Number(bYear || 0);
  const bt = Number(bTerm || 0);
  if (ay !== by) return ay - by;
  return at - bt;
}

function pushSet(map, key, value) {
  if (!key || !value) return;
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
}

function csvEscapePath(relativePath) {
  return String(relativePath || "").replaceAll("\\", "/");
}

function numberValue(value) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeCsv(fileName, rows, columns) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const csv = Papa.unparse(rows, { columns, newline: "\n" });
  fs.writeFileSync(path.join(OUT_DIR, fileName), `${csv}\n`);
}

function readSourceRows(file = SOURCE_CSV) {
  if (!fs.existsSync(file)) {
    throw new Error(`Source CSV not found: ${file}`);
  }
  const parsed = Papa.parse(fs.readFileSync(file, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    console.warn(`[prepare] PapaParse reported ${parsed.errors.length} parse warning(s)`);
  }
  const rows = parsed.data.filter((row) => isValidCourseNo(row.course_no));
  const dropped = parsed.data.length - rows.length;
  if (dropped > 0) {
    console.warn(`[prepare] Dropped ${dropped} malformed row(s) without a valid course_no`);
  }
  return rows;
}

function isValidCourseNo(value) {
  return /^[A-Z][A-Z0-9-]*\d{3,}$/u.test(String(value || "").trim());
}

function ensureCourse(courses, row, status) {
  const courseNo = String(row.course_no || "").trim();
  if (!courses.has(courseNo)) {
    courses.set(courseNo, {
      course_no: courseNo,
      course_name: row.course_name || "",
      canonical_dept_code: row.dept_code || "",
      canonical_dept_name: row.dept_name || "",
      opening_dept: row.opening_dept || "",
      year_term_range: row.year_term_range || "",
      first_year: "",
      first_term: "",
      latest_year: "",
      latest_term: "",
      grade_row_count: 0,
      term_count: 0,
      department_count: 0,
      pdf_path: row.pdf_path || "",
      parse_status: status,
    });
  }
}

function buildData(rows, catalogRows) {
  const courses = new Map();
  const depts = new Map();
  const deptCourses = new Map();
  const longRows = new Map();
  const statusesByCourse = new Map();
  const departmentsByCourse = new Map();

  for (const row of catalogRows) {
    const courseNo = String(row.course_no || "").trim();
    if (!courseNo) continue;

    const status = normalizeStatus(row);
    pushSet(statusesByCourse, courseNo, status);
    pushSet(departmentsByCourse, courseNo, row.dept_code || row.dept_name);
    ensureCourse(courses, row, status);

    if (row.dept_code) {
      if (!depts.has(row.dept_code)) {
        depts.set(row.dept_code, {
          campus_code: row.campus_code || "",
          dept_code: row.dept_code || "",
          dept_name: row.dept_name || "",
          course_count: 0,
          ok_course_count: 0,
          not_found_course_count: 0,
          error_course_count: 0,
        });
      }
      const deptCourseKey = `${row.dept_code}::${courseNo}`;
      if (!deptCourses.has(deptCourseKey)) {
        deptCourses.set(deptCourseKey, {
          campus_code: row.campus_code || "",
          dept_code: row.dept_code || "",
          dept_name: row.dept_name || "",
          course_no: courseNo,
          course_name: row.course_name || "",
          year_term_range: row.year_term_range || "",
          opening_dept: row.opening_dept || "",
          parse_status: status,
        });
      }
    }
  }

  for (const row of rows) {
    const courseNo = String(row.course_no || "").trim();
    if (!courseNo) continue;

    const status = normalizeStatus(row);
    pushSet(statusesByCourse, courseNo, status);
    ensureCourse(courses, row, status);

    if (status !== "ok") continue;
    const year = String(row["수업년도"] || "").trim();
    const term = String(row["수업학기"] || "").trim();
    const grade = normalizeGrade(row["등급"]);
    if (!year || !term || !grade) continue;

    const key = `${courseNo}::${year}::${term}::${grade}`;
    if (!longRows.has(key)) {
      longRows.set(key, {
        course_no: courseNo,
        course_name: row.course_name || "",
        year,
        term,
        grade,
        count: String(row["인원"] || "").trim(),
        ratio: String(row["비율"] || "").trim(),
        campus_code: row.campus_code || "",
        dept_code: row.dept_code || "",
        dept_name: row.dept_name || "",
        opening_dept: row.opening_dept || "",
        year_term_range: row.year_term_range || "",
        pdf_path: csvEscapePath(row.pdf_path || ""),
      });
    }
  }

  const long = [...longRows.values()].sort((a, b) => {
    if (a.course_no !== b.course_no) return a.course_no.localeCompare(b.course_no);
    const yt = compareYearTerm(a.year, a.term, b.year, b.term);
    if (yt !== 0) return yt;
    return GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
  });

  const termSets = new Map();
  for (const row of long) {
    const course = courses.get(row.course_no);
    if (!course.pdf_path && row.pdf_path) course.pdf_path = row.pdf_path;
    course.grade_row_count += 1;
    if (!course.first_year || compareYearTerm(row.year, row.term, course.first_year, course.first_term) < 0) {
      course.first_year = row.year;
      course.first_term = row.term;
    }
    if (!course.latest_year || compareYearTerm(row.year, row.term, course.latest_year, course.latest_term) > 0) {
      course.latest_year = row.year;
      course.latest_term = row.term;
    }
    pushSet(termSets, row.course_no, `${row.year}/${row.term}`);
  }

  for (const [courseNo, course] of courses) {
    course.term_count = termSets.get(courseNo)?.size || 0;
    course.department_count = departmentsByCourse.get(courseNo)?.size || 0;
    const statuses = statusesByCourse.get(courseNo) || new Set();
    course.parse_status = course.grade_row_count > 0 ? "ok" : [...statuses].sort().join("|");
  }

  const wideByTerm = new Map();
  const wideByCourse = new Map();
  for (const row of long) {
    const termKey = `${row.course_no}::${row.year}::${row.term}`;
    if (!wideByTerm.has(termKey)) {
      wideByTerm.set(termKey, {
        campus_code: row.campus_code,
        dept_code: row.dept_code,
        dept_name: row.dept_name,
        course_no: row.course_no,
        course_name: row.course_name,
        year: row.year,
        term: row.term,
        total_count: 0,
        year_term_range: row.year_term_range,
        opening_dept: row.opening_dept,
        ...Object.fromEntries(GRADE_ORDER.flatMap((grade) => [[`${grade}_count`, ""], [`${grade}_ratio`, ""]])),
        parse_status: "ok",
        pdf_path: row.pdf_path,
        error: "",
      });
    }
    const termRow = wideByTerm.get(termKey);
    termRow.total_count += numberValue(row.count);
    termRow[`${row.grade}_count`] = row.count;
    termRow[`${row.grade}_ratio`] = row.ratio;

    const course = courses.get(row.course_no);
    if (!course || row.year !== course.latest_year || row.term !== course.latest_term) continue;
    if (!wideByCourse.has(row.course_no)) {
      wideByCourse.set(row.course_no, {
        campus_code: row.campus_code,
        dept_code: row.dept_code,
        dept_name: row.dept_name,
        course_no: row.course_no,
        course_name: row.course_name,
        year: row.year,
        term: row.term,
        total_count: 0,
        year_term_range: row.year_term_range,
        opening_dept: row.opening_dept,
        ...Object.fromEntries(GRADE_ORDER.map((grade) => [grade, ""])),
        ...Object.fromEntries(GRADE_ORDER.map((grade) => [`${grade}_count`, ""])),
        parse_status: "ok",
        pdf_path: row.pdf_path,
        error: "",
      });
    }
    const latestRow = wideByCourse.get(row.course_no);
    latestRow.total_count += numberValue(row.count);
    latestRow[row.grade] = row.ratio;
    latestRow[`${row.grade}_count`] = row.count;
  }

  const courseRows = [...courses.values()].sort((a, b) => a.course_no.localeCompare(b.course_no));
  const deptCourseRows = [...deptCourses.values()].sort((a, b) =>
    a.dept_name.localeCompare(b.dept_name) || a.course_no.localeCompare(b.course_no),
  );

  for (const dept of depts.values()) {
    const related = deptCourseRows.filter((row) => row.dept_code === dept.dept_code);
    dept.course_count = related.length;
    dept.ok_course_count = related.filter((row) => courses.get(row.course_no)?.parse_status === "ok").length;
    dept.not_found_course_count = related.filter((row) => courses.get(row.course_no)?.parse_status.includes("not_found")).length;
    dept.error_course_count = related.filter((row) => courses.get(row.course_no)?.parse_status.includes("error")).length;
  }

  const coverageRows = courseRows.map((course) => {
    const sourcePdf = course.pdf_path ? path.resolve(ROOT_DIR, course.pdf_path) : "";
    const pdfExists = sourcePdf ? fs.existsSync(sourcePdf) : false;
    const issues = [];
    if (course.grade_row_count === 0) issues.push("missing_grade_rows");
    if (course.pdf_path && !pdfExists) issues.push("missing_pdf_file");
    if (!course.pdf_path && course.grade_row_count > 0) issues.push("missing_pdf_path");
    return {
      course_no: course.course_no,
      course_name: course.course_name,
      parse_status: course.parse_status,
      grade_row_count: course.grade_row_count,
      term_count: course.term_count,
      department_count: course.department_count,
      latest_year: course.latest_year,
      latest_term: course.latest_term,
      pdf_path: course.pdf_path,
      pdf_exists: pdfExists ? "yes" : "no",
      issues: issues.join("|"),
    };
  });

  return {
    long,
    termWide: [...wideByTerm.values()].sort((a, b) => {
      if (a.course_no !== b.course_no) return a.course_no.localeCompare(b.course_no);
      return compareYearTerm(a.year, a.term, b.year, b.term);
    }),
    wide: [...wideByCourse.values()].sort((a, b) => a.course_no.localeCompare(b.course_no)),
    courses: courseRows,
    departments: [...depts.values()].sort((a, b) => a.dept_name.localeCompare(b.dept_name)),
    departmentCourses: deptCourseRows,
    coverage: coverageRows,
  };
}

function main() {
  const rows = readSourceRows();
  const catalogRows = CATALOG_CSV === SOURCE_CSV ? rows : readSourceRows(CATALOG_CSV);
  const data = buildData(rows, catalogRows);

  writeCsv("grade_ratios_by_year.csv", data.long, LONG_COLUMNS);
  writeCsv("grade_ratios_by_term.csv", data.termWide, TERM_WIDE_COLUMNS);
  writeCsv("grade_ratios.csv", data.wide, [
    "campus_code",
    "dept_code",
    "dept_name",
    "course_no",
    "course_name",
    "year",
    "term",
    "year_term_range",
    "opening_dept",
    ...GRADE_ORDER,
    ...GRADE_ORDER.map((grade) => `${grade}_count`),
    "parse_status",
    "pdf_path",
    "error",
    "total_count",
  ]);
  writeCsv("courses.csv", data.courses, COURSE_COLUMNS);
  writeCsv("departments.csv", data.departments, [
    "campus_code",
    "dept_code",
    "dept_name",
    "course_count",
    "ok_course_count",
    "not_found_course_count",
    "error_course_count",
  ]);
  writeCsv("department_courses.csv", data.departmentCourses, [
    "campus_code",
    "dept_code",
    "dept_name",
    "course_no",
    "course_name",
    "year_term_range",
    "opening_dept",
    "parse_status",
  ]);
  writeCsv("coverage_report.csv", data.coverage, [
    "course_no",
    "course_name",
    "parse_status",
    "grade_row_count",
    "term_count",
    "department_count",
    "latest_year",
    "latest_term",
    "pdf_path",
    "pdf_exists",
    "issues",
  ]);

  const summary = {
    source_csv: SOURCE_CSV,
    catalog_csv: CATALOG_CSV,
    generated_at: new Date().toISOString(),
    source_rows: rows.length,
    service_courses: data.wide.length,
    grade_ratio_rows: data.long.length,
    grade_ratio_terms: data.termWide.length,
    catalog_courses: data.courses.length,
    departments: data.departments.length,
    department_course_links: data.departmentCourses.length,
    coverage_issues: data.coverage.filter((row) => row.issues).length,
  };
  fs.writeFileSync(path.join(OUT_DIR, "metadata.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
