#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const DATA_DIR = path.resolve(process.argv[2] || "public/data");
const STRICT = process.argv.includes("--strict");
const GRADE_ORDER = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "P", "S", "U"];
const COMPLETION_TYPES = new Set([
  "비교과",
  "교직전공",
  "전공기초(필수)",
  "전공심화",
  "전공핵심",
  "핵심교양",
  "ROTC필수",
  "교직선택",
  "교직필수",
  "타전공(일반)선택",
  "교양필수",
]);
const ISSUE_COLUMNS = [
  "severity",
  "issue_type",
  "course_no",
  "course_name",
  "year",
  "term",
  "detail",
];

function readCsv(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`Missing data file: ${filePath}`);
  const parsed = Papa.parse(fs.readFileSync(filePath, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    console.warn(`[verify] ${fileName}: ${parsed.errors.length} parse warning(s)`);
  }
  return parsed.data;
}

function writeCsv(fileName, rows, columns) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, fileName), `${Papa.unparse(rows, { columns, newline: "\n" })}\n`);
}

function pushIssue(issues, severity, issueType, row, detail) {
  issues.push({
    severity,
    issue_type: issueType,
    course_no: row?.course_no || "",
    course_name: row?.course_name || "",
    year: row?.year || "",
    term: row?.term || "",
    detail,
  });
}

function numberValue(value) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function main() {
  const courses = readCsv("courses.csv");
  const latest = readCsv("grade_ratios.csv");
  const long = readCsv("grade_ratios_by_year.csv");
  const termWide = readCsv("grade_ratios_by_term.csv");
  const departments = readCsv("departments.csv");
  const departmentCourses = readCsv("department_courses.csv");
  const courseClassifications = readCsv("course_classifications.csv");
  const coverage = readCsv("coverage_report.csv");

  const issues = [];
  const courseNos = new Set();
  const latestCourseNos = new Set();
  const longCourseNos = new Set();
  const longKeys = new Set();
  const termWideKeys = new Set();
  const termSums = new Map();
  const classificationKeys = new Set();

  for (const course of courses) {
    if (courseNos.has(course.course_no)) {
      pushIssue(issues, "error", "duplicate_course_in_courses_csv", course, "Duplicate course_no in courses.csv");
    }
    courseNos.add(course.course_no);
    if (course.parse_status !== "ok") {
      pushIssue(issues, "warning", "course_without_grade_data", course, `parse_status=${course.parse_status || "blank"}`);
    }
  }

  for (const row of latest) {
    if (latestCourseNos.has(row.course_no)) {
      pushIssue(issues, "error", "duplicate_course_in_latest_csv", row, "Duplicate course_no in grade_ratios.csv");
    }
    latestCourseNos.add(row.course_no);
    if (!courseNos.has(row.course_no)) {
      pushIssue(issues, "error", "latest_row_missing_course_metadata", row, "grade_ratios.csv row has no matching courses.csv row");
    }
    const hasAnyGrade = GRADE_ORDER.some((grade) => numberValue(row[grade]) > 0);
    if (!hasAnyGrade) {
      pushIssue(issues, "warning", "latest_row_has_no_grade_ratio", row, "Latest row has no positive grade ratio");
    }
  }

  for (const row of long) {
    longCourseNos.add(row.course_no);
    if (!courseNos.has(row.course_no)) {
      pushIssue(issues, "error", "long_row_missing_course_metadata", row, "grade_ratios_by_year.csv row has no matching courses.csv row");
    }
    const key = `${row.course_no}::${row.year}::${row.term}::${row.grade}`;
    if (longKeys.has(key)) {
      pushIssue(issues, "error", "duplicate_long_grade_row", row, "Duplicate course/year/term/grade in grade_ratios_by_year.csv");
    }
    longKeys.add(key);

    const termKey = `${row.course_no}::${row.year}::${row.term}`;
    const current = termSums.get(termKey) || {
      course_no: row.course_no,
      course_name: row.course_name,
      year: row.year,
      term: row.term,
      ratio: 0,
      count: 0,
      totalCount: 0,
      counts: {},
      ratios: {},
    };
    current.ratio += numberValue(row.ratio);
    current.count += 1;
    current.totalCount += numberValue(row.count);
    current.counts[row.grade] = numberValue(row.count);
    current.ratios[row.grade] = numberValue(row.ratio);
    termSums.set(termKey, current);
  }

  for (const row of termWide) {
    const key = `${row.course_no}::${row.year}::${row.term}`;
    if (termWideKeys.has(key)) {
      pushIssue(issues, "error", "duplicate_term_wide_row", row, "Duplicate course/year/term in grade_ratios_by_term.csv");
    }
    termWideKeys.add(key);
    if (!courseNos.has(row.course_no)) {
      pushIssue(issues, "error", "term_wide_row_missing_course_metadata", row, "grade_ratios_by_term.csv row has no matching courses.csv row");
    }
    const expected = termSums.get(key);
    if (!expected) {
      pushIssue(issues, "error", "term_wide_row_missing_long_rows", row, "grade_ratios_by_term.csv row has no matching long rows");
      continue;
    }
    if (numberValue(row.total_count) !== expected.totalCount) {
      pushIssue(
        issues,
        "error",
        "term_total_count_mismatch",
        row,
        `total_count=${row.total_count || 0}, expected=${expected.totalCount}`,
      );
    }
    for (const grade of GRADE_ORDER) {
      const countColumn = `${grade}_count`;
      const ratioColumn = `${grade}_ratio`;
      const actualCount = numberValue(row[countColumn]);
      const expectedCount = expected.counts[grade] || 0;
      if (actualCount !== expectedCount) {
        pushIssue(issues, "error", "term_grade_count_mismatch", row, `${countColumn}=${actualCount}, expected=${expectedCount}`);
      }
      const actualRatio = numberValue(row[ratioColumn]);
      const expectedRatio = expected.ratios[grade] || 0;
      if (Math.abs(actualRatio - expectedRatio) > 0.005) {
        pushIssue(issues, "error", "term_grade_ratio_mismatch", row, `${ratioColumn}=${actualRatio}, expected=${expectedRatio}`);
      }
    }
  }

  for (const course of courses) {
    if (course.parse_status === "ok" && !longCourseNos.has(course.course_no)) {
      pushIssue(issues, "error", "ok_course_missing_long_rows", course, "Course is ok but has no grade_ratios_by_year.csv rows");
    }
    if (course.parse_status === "ok" && !latestCourseNos.has(course.course_no)) {
      pushIssue(issues, "error", "ok_course_missing_latest_row", course, "Course is ok but has no grade_ratios.csv latest row");
    }
  }

  for (const term of termSums.values()) {
    if (term.count >= 2 && (term.ratio < 99.3 || term.ratio > 100.7)) {
      pushIssue(
        issues,
        "warning",
        "term_ratio_sum_not_near_100",
        term,
        `ratio_sum=${term.ratio.toFixed(2)}, grade_count=${term.count}`,
      );
    }
  }

  for (const row of coverage) {
    if (row.issues) {
      pushIssue(issues, "warning", "coverage_report_issue", row, row.issues);
    }
  }

  const departmentCourseKeys = new Set();
  const departmentCodes = new Set(departments.map((row) => row.dept_code).filter(Boolean));
  const linkedDepartmentCodes = new Set();
  for (const row of departmentCourses) {
    const key = `${row.dept_code}::${row.course_no}`;
    linkedDepartmentCodes.add(row.dept_code);
    if (departmentCourseKeys.has(key)) {
      pushIssue(issues, "error", "duplicate_department_course_link", row, "Duplicate dept_code/course_no link");
    }
    departmentCourseKeys.add(key);
    if (!departmentCodes.has(row.dept_code)) {
      pushIssue(issues, "error", "department_link_missing_department", row, "department_courses.csv dept_code has no matching departments.csv row");
    }
    if (!courseNos.has(row.course_no)) {
      pushIssue(issues, "error", "department_course_missing_course_metadata", row, "department_courses.csv row has no matching courses.csv row");
    }
  }

  for (const row of departments) {
    if (!linkedDepartmentCodes.has(row.dept_code)) {
      pushIssue(issues, "error", "department_missing_course_link", row, "departments.csv row has no matching department_courses.csv row");
    }
  }

  for (const row of courseClassifications) {
    const key = `${row.course_no}::${row.completion_type_code || row.completion_type}`;
    if (classificationKeys.has(key)) {
      pushIssue(issues, "error", "duplicate_course_classification", row, "Duplicate course_no/completion_type link");
    }
    classificationKeys.add(key);
    if (!courseNos.has(row.course_no)) {
      pushIssue(issues, "error", "classification_missing_course_metadata", row, "Classification row has no matching courses.csv row");
    }
    if (!COMPLETION_TYPES.has(row.completion_type)) {
      pushIssue(issues, "error", "unknown_completion_type", row, `completion_type=${row.completion_type || "blank"}`);
    }
  }

  writeCsv("verification_issues.csv", issues, ISSUE_COLUMNS);

  const summary = {
    courses: courses.length,
    latest_courses: latest.length,
    grade_ratio_rows: long.length,
    grade_ratio_terms: termWide.length,
    departments: departments.length,
    department_course_links: departmentCourses.length,
    course_classification_links: courseClassifications.length,
    classified_courses: new Set(courseClassifications.map((row) => row.course_no)).size,
    issues: issues.length,
    errors: issues.filter((issue) => issue.severity === "error").length,
    warnings: issues.filter((issue) => issue.severity === "warning").length,
    strict: STRICT,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (summary.errors > 0 || (STRICT && summary.warnings > 0)) {
    process.exitCode = 1;
  }
}

main();
