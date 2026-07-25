#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const input = process.argv[2] || path.join(root, "outputs", "grade_ratios_fixed.csv");
const output = process.argv[3] || path.join(root, "outputs", "grade_ratios_by_year.csv");

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
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, idx) => [header, cols[idx] || ""]));
  });
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function pdfToText(pdfPath) {
  return execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function parseRows(text) {
  const normalized = text.replace(/\r/g, "\n");
  const gradeStateMatch = normalized.match(/성적부여현황\s*\(\s*등급\s*\)([\s\S]*?)(?:\n\s*5\.|\f|\n\s*강의평가)/);
  if (!gradeStateMatch) return [];

  const rows = [];
  for (const line of gradeStateMatch[1].split("\n")) {
    const matches = line.trim().matchAll(/(20\d{2})\s+([12])\s+(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\s+([\d,]+)\s+(\d+(?:\.\d+)?)/g);
    for (const match of matches) {
      const [, year, term, grade, count, ratio] = match;
      rows.push({
        "수업년도": year,
        "수업학기": term,
        "등급": grade.replace(/^([ABCD])$/, "$10"),
        "인원": count.replaceAll(",", ""),
        "비율": ratio,
      });
    }
  }
  return rows;
}

const rows = [];
for (const course of readCsv(input)) {
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
    const parsed = fs.existsSync(pdfPath) ? parseRows(pdfToText(pdfPath)) : [];
    if (parsed.length) {
      rows.push(...parsed.map((row) => ({ ...base, ...row, parse_status: "ok", error: "" })));
    } else {
      rows.push({
        ...base,
        "수업년도": "",
        "수업학기": "",
        "등급": "",
        "인원": "",
        "비율": "",
        parse_status: "not_found",
        error: "",
      });
    }
  } catch (error) {
    rows.push({
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
fs.writeFileSync(output, `${fields.join(",")}\n${rows.map((row) => fields.map((field) => csvEscape(row[field])).join(",")).join("\n")}\n`);
console.log(`wrote ${output}`);
console.log(`rows ${rows.length}`);
