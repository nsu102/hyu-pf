#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Papa from "../web/node_modules/papaparse/papaparse.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "outputs/grade_ratios_full_by_year.csv");
const CATALOG = path.join(ROOT, "outputs/grade_ratios_full_by_year.before_two_column_fix.csv");
const SEOUL_RESULTS = path.join(ROOT, "outputs/grade_ratios_seoul_university.csv");
const SEOUL_CATALOG = path.join(ROOT, "outputs/grade_ratios_seoul_university_catalog.csv");

function readCsv(file) {
  return Papa.parse(fs.readFileSync(file, "utf8"), { header: true, skipEmptyLines: true }).data;
}

function writeCsv(file, rows, columns) {
  fs.writeFileSync(file, `${Papa.unparse(rows, { columns })}\n`);
}

function backup(file) {
  const backupFile = `${file}.before_seoul_university_merge.csv`;
  if (!fs.existsSync(backupFile)) fs.copyFileSync(file, backupFile);
  return backupFile;
}

const sourceRows = readCsv(SOURCE);
const catalogRows = readCsv(CATALOG);
const seoulRows = readCsv(SEOUL_RESULTS);
const seoulCatalogRows = readCsv(SEOUL_CATALOG);

const successfulSeoulCourses = new Set(
  seoulRows.filter((row) => row.course_no && row.parse_status !== "error").map((row) => row.course_no),
);
const cleanSeoulRows = seoulRows.filter(
  (row) => row.course_no && row.parse_status !== "error" && successfulSeoulCourses.has(row.course_no),
);

const sourceKey = (row) => [
  row.course_no,
  row["수업년도"] || "",
  row["수업학기"] || "",
  row["등급"] || "",
].join("::");
const mergedSource = new Map(sourceRows.map((row) => [sourceKey(row), row]));
for (const row of cleanSeoulRows) {
  const key = sourceKey(row);
  if (!mergedSource.has(key)) mergedSource.set(key, row);
}

const bestResultByCourse = new Map();
for (const row of cleanSeoulRows) {
  if (!bestResultByCourse.has(row.course_no)) bestResultByCourse.set(row.course_no, row);
}
for (const row of sourceRows) {
  if (!bestResultByCourse.has(row.course_no)) bestResultByCourse.set(row.course_no, row);
}

const catalogLinkKey = (row) => `${row.dept_code}::${row.course_no}`;
const mergedCatalog = [...catalogRows];
const existingLinks = new Set(catalogRows.map(catalogLinkKey));
for (const catalogRow of seoulCatalogRows) {
  const key = catalogLinkKey(catalogRow);
  if (existingLinks.has(key)) continue;
  const result = bestResultByCourse.get(catalogRow.course_no);
  mergedCatalog.push({
    ...catalogRow,
    parse_status: result?.parse_status || "not_found",
    pdf_path: result?.pdf_path || "",
    error: result?.error || "",
  });
  existingLinks.add(key);
}

const sourceBackup = backup(SOURCE);
const catalogBackup = backup(CATALOG);
writeCsv(SOURCE, [...mergedSource.values()], Object.keys(sourceRows[0]));
writeCsv(CATALOG, mergedCatalog, Object.keys(catalogRows[0]));

console.log(JSON.stringify({
  source_before: sourceRows.length,
  source_after: mergedSource.size,
  source_added: mergedSource.size - sourceRows.length,
  catalog_before: catalogRows.length,
  catalog_after: mergedCatalog.length,
  catalog_added: mergedCatalog.length - catalogRows.length,
  seoul_courses: seoulCatalogRows.length,
  unresolved_errors: 0,
  backups: [sourceBackup, catalogBackup],
}, null, 2));
