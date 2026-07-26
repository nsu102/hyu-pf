#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const root = path.resolve(import.meta.dirname, "..");
const input = path.resolve(process.argv[2] || path.join(root, "outputs", "grade_ratios_full_by_year.csv"));
const output = path.resolve(process.argv[3] || path.join(root, "outputs", "grade_ratios_full_by_year_reparsed.csv"));
const require = createRequire(import.meta.url);
const Papa = require(path.join(root, "web", "node_modules", "papaparse"));

const fields = [
  "campus_code",
  "dept_code",
  "dept_name",
  "course_no",
  "course_name",
  "year_term_range",
  "opening_dept",
  "수업년도",
  "수업학기",
  "등급",
  "인원",
  "비율",
  "parse_status",
  "pdf_path",
  "error",
];
const gradeOrder = ["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "P", "S", "U"];

function csvRecords(text) {
  const records = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted && ch === '"' && text[i + 1] === '"') {
      current += '""';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
      current += ch;
    } else if (!quoted && (ch === "\n" || ch === "\r")) {
      if (current) records.push(current);
      current = "";
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
    } else {
      current += ch;
    }
  }
  if (current) records.push(current);
  return records;
}

function splitCsvLine(line) {
  const cols = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted && ch === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (!quoted && ch === ",") {
      cols.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

function readCsv(file) {
  const physicalLines = fs.readFileSync(file, "utf8").split(/\r?\n/u);
  const header = Papa.parse(physicalLines[0]).data[0];
  const rows = [];
  let parseWarningCount = 0;

  for (const line of physicalLines.slice(1)) {
    if (!/^H[A-Z0-9]+,/u.test(line)) continue;
    const parsed = Papa.parse(line);
    parseWarningCount += parsed.errors.length;
    const values = parsed.data[0] || [];
    rows.push(Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])));
  }

  if (parseWarningCount > 0) {
    console.warn(`[reparse] Recovered rows with ${parseWarningCount} isolated CSV parse warning(s)`);
  }
  return rows;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function isValidCourseNo(value) {
  return /^[A-Z][A-Z0-9-]*\d{3,}$/u.test(String(value || "").trim());
}

function pdfToText(pdfPath) {
  return execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseGradeRows(text) {
  const normalized = text.replace(/\r/g, "\n");
  const gradeStateMatch = normalized.match(/성적부여현황\s*\(\s*등급\s*\)([\s\S]*?)(?:\n\s*5\.|\f|\n\s*강의평가)/);
  if (!gradeStateMatch) return [];

  const rows = [];
  const seen = new Set();
  for (const line of gradeStateMatch[1].split("\n")) {
    const matches = line.trim().matchAll(/(20\d{2})\s+([12])\s+(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\s+([\d,]+)\s+(\d+(?:\.\d+)?)/g);
    for (const match of matches) {
      const [, year, term, grade, count, ratio] = match;
      const normalizedGrade = grade.replace(/^([ABCD])$/, "$10");
      const key = `${year}/${term}/${normalizedGrade}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        "수업년도": year,
        "수업학기": term,
        "등급": normalizedGrade,
        "인원": count.replaceAll(",", ""),
        "비율": ratio,
      });
    }
  }
  return rows.sort((a, b) => {
    const ay = Number(a["수업년도"]);
    const by = Number(b["수업년도"]);
    if (ay !== by) return ay - by;
    const at = Number(a["수업학기"]);
    const bt = Number(b["수업학기"]);
    if (at !== bt) return at - bt;
    return gradeOrder.indexOf(a["등급"]) - gradeOrder.indexOf(b["등급"]);
  });
}

function collectCourses(rows) {
  const courses = new Map();
  for (const row of rows) {
    if (!isValidCourseNo(row.course_no)) continue;
    if (!row.pdf_path) continue;
    if (courses.has(row.course_no)) continue;
    courses.set(row.course_no, {
      campus_code: row.campus_code,
      dept_code: row.dept_code,
      dept_name: row.dept_name,
      course_no: row.course_no,
      course_name: row.course_name,
      year_term_range: row.year_term_range,
      opening_dept: row.opening_dept,
      pdf_path: row.pdf_path,
    });
  }
  return [...courses.values()].sort((a, b) => a.course_no.localeCompare(b.course_no));
}

const outputRows = [];
const courses = collectCourses(readCsv(input));
let parsedCourses = 0;
let missingPdfs = 0;
let notFound = 0;
let errors = 0;

for (const course of courses) {
  const pdfPath = path.isAbsolute(course.pdf_path) ? course.pdf_path : path.join(root, course.pdf_path);
  const base = {
    campus_code: course.campus_code,
    dept_code: course.dept_code,
    dept_name: course.dept_name,
    course_no: course.course_no,
    course_name: course.course_name,
    year_term_range: course.year_term_range,
    opening_dept: course.opening_dept,
    pdf_path: course.pdf_path,
  };

  try {
    if (!fs.existsSync(pdfPath)) {
      missingPdfs += 1;
      outputRows.push({ ...base, "수업년도": "", "수업학기": "", "등급": "", "인원": "", "비율": "", parse_status: "error", error: "PDF file not found" });
      continue;
    }

    const parsed = parseGradeRows(pdfToText(pdfPath));
    if (!parsed.length) {
      notFound += 1;
      outputRows.push({ ...base, "수업년도": "", "수업학기": "", "등급": "", "인원": "", "비율": "", parse_status: "not_found", error: "" });
      continue;
    }

    parsedCourses += 1;
    outputRows.push(...parsed.map((row) => ({ ...base, ...row, parse_status: "ok", error: "" })));
  } catch (error) {
    errors += 1;
    outputRows.push({
      ...base,
      "수업년도": "",
      "수업학기": "",
      "등급": "",
      "인원": "",
      "비율": "",
      parse_status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${fields.join(",")}\n${outputRows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")).join("\n")}\n`);
console.log(JSON.stringify({
  input,
  output,
  courses: courses.length,
  parsed_courses: parsedCourses,
  not_found: notFound,
  missing_pdfs: missingPdfs,
  errors,
  rows: outputRows.length,
}, null, 2));
