#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

const PORTAL_ORIGIN = "https://portal.hanyang.ac.kr";
const SUGANG_HOME_URL = `${PORTAL_ORIGIN}/sugang/sulg.do`;
const COURSE_SEARCH_URL = `${PORTAL_ORIGIN}/sugang/SgscAct/findSuupSearchSugangSiganpyo.do`;
const SEOUL_UNDERGRADUATE_CODE = "H0002256";
const HANDBOOK_PROGRAM_ID = "P310278";
const TERM_CODES = [
  { code: "10", term: "1" },
  { code: "20", term: "2" },
];
const OUTPUT_COLUMNS = [
  "course_no",
  "course_name",
  "dept_code",
  "dept_name",
  "completion_type_code",
  "completion_type",
  "first_year",
  "first_term",
  "latest_year",
  "latest_term",
  "section_count",
];

function parseArgs(argv) {
  const currentYear = new Date().getFullYear();
  const args = {
    fromYear: currentYear - 2,
    toYear: currentYear,
    output: path.resolve("public/data/course_classifications.csv"),
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--from-year") {
      args.fromYear = Number(next);
      index += 1;
    } else if (arg === "--to-year") {
      args.toYear = Number(next);
      index += 1;
    } else if (arg === "--output") {
      args.output = path.resolve(next);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.fromYear) || !Number.isInteger(args.toYear) || args.fromYear > args.toYear) {
    throw new Error("Use a valid --from-year/--to-year range.");
  }
  return args;
}

function updateCookieJar(response, cookieJar) {
  const setCookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);

  for (const header of setCookies) {
    const [pair] = header.split(";", 1);
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function cookieHeader(cookieJar) {
  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function portalFetch(url, options, cookieJar) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(cookieJar.size ? { Cookie: cookieHeader(cookieJar) } : {}),
    },
  });
  updateCookieJar(response, cookieJar);
  if (!response.ok) {
    throw new Error(`Portal request failed: ${response.status} ${response.statusText} (${url})`);
  }
  return response;
}

function findHandbookPageInfo(html) {
  const encodedLinks = [...html.matchAll(/href=["']#!([^"']+)["']/gu)].map((match) => match[1]);
  for (const encoded of encodedLinks) {
    const decoded = Buffer.from(encoded, "base64").toString("utf8").trim();
    const parts = decoded.split("$@^");
    if (parts[0] === HANDBOOK_PROGRAM_ID) {
      return {
        programId: parts[0],
        menuId: parts[3],
        token: parts[6],
      };
    }
  }
  throw new Error("Could not find the public course-handbook link on the portal.");
}

function extractRows(payload) {
  const dataSet = Object.values(payload).find(
    (value) => Array.isArray(value) && value.some((item) => Array.isArray(item?.list)),
  );
  return dataSet?.find((item) => Array.isArray(item?.list))?.list || [];
}

async function fetchTermRows(year, termCode, cookieJar) {
  const allRows = [];
  const maxRows = 10000;
  let skipRows = 0;
  let totalCount = Infinity;

  while (skipRows < totalCount) {
    const body = {
      skipRows: String(skipRows),
      maxRows: String(maxRows),
      strLocaleGb: "ko",
      strIsSugangSys: "true",
      strDetailGb: "0",
      notAppendQrys: "true",
      strSuupOprGb: "0",
      strJojik: SEOUL_UNDERGRADUATE_CODE,
      strSuupYear: String(year),
      strSuupTerm: termCode,
      strIsuGrade: "",
      strTsGangjwa: "",
      strIlbanCommonGb: "",
      strIsuGbCd: "",
      strHaksuNo: "",
      strChgGwamok: "",
      strGwamok: "",
      strDaehak: "",
      strHakgwa: "",
      strYeongyeok: "",
      strPgmNm: "",
    };
    const response = await portalFetch(
      COURSE_SEARCH_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json+sua; charset=utf-8" },
        body: JSON.stringify(body),
      },
      cookieJar,
    );
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Portal returned a non-JSON response for ${year}/${termCode}: ${text.slice(0, 120)}`);
    }
    const rows = extractRows(payload);
    if (!rows.length) break;
    totalCount = Number(rows[0].totalCnt) || rows.length;
    allRows.push(...rows);
    skipRows += rows.length;
  }

  return allRows;
}

function compareYearTerm(aYear, aTerm, bYear, bTerm) {
  if (Number(aYear) !== Number(bYear)) return Number(aYear) - Number(bYear);
  return Number(aTerm) - Number(bTerm);
}

async function main() {
  const args = parseArgs(process.argv);
  const cookieJar = new Map();
  const homeResponse = await portalFetch(SUGANG_HOME_URL, {}, cookieJar);
  const pageInfo = findHandbookPageInfo(await homeResponse.text());
  await portalFetch(
    `${PORTAL_ORIGIN}/sugang/openPage.do?pgmId=${encodeURIComponent(pageInfo.programId)}&menuId=${encodeURIComponent(pageInfo.menuId)}&tk=${encodeURIComponent(pageInfo.token)}`,
    {},
    cookieJar,
  );

  const targets = [];
  for (let year = args.fromYear; year <= args.toYear; year += 1) {
    for (const term of TERM_CODES) targets.push({ year, ...term });
  }

  const rowsByTerm = [];
  for (const target of targets) {
    const rows = await fetchTermRows(target.year, target.code, cookieJar);
    rowsByTerm.push({ ...target, rows });
    console.log(`[classifications] ${target.year}/${target.term}: ${rows.length.toLocaleString()} sections`);
  }

  const classifications = new Map();
  for (const { year, term, rows } of rowsByTerm) {
    for (const row of rows) {
      const courseNo = String(row.haksuNo || "").trim();
      const departmentCode = String(
        row.slgSosokCd || row.banSosokCd || row.gnjSosokCd || "",
      ).trim();
      const departmentName = String(
        row.slgSosokNm || row.banSosokNm || row.gnjSosokNm || "",
      ).trim();
      const completionType = String(row.isuGbNm || "").trim();
      const completionTypeCode = String(row.isuGbCd || "").trim();
      if (!courseNo || !completionType) continue;
      const key = [
        courseNo,
        departmentCode || departmentName,
        completionTypeCode || completionType,
      ].join("::");
      const existing = classifications.get(key);
      if (!existing) {
        classifications.set(key, {
          course_no: courseNo,
          course_name: String(row.gwamokNm || "").trim(),
          dept_code: departmentCode,
          dept_name: departmentName,
          completion_type_code: completionTypeCode,
          completion_type: completionType,
          first_year: String(year),
          first_term: term,
          latest_year: String(year),
          latest_term: term,
          section_count: 1,
        });
        continue;
      }

      existing.section_count += 1;
      if (compareYearTerm(year, term, existing.first_year, existing.first_term) < 0) {
        existing.first_year = String(year);
        existing.first_term = term;
      }
      if (compareYearTerm(year, term, existing.latest_year, existing.latest_term) > 0) {
        existing.latest_year = String(year);
        existing.latest_term = term;
        existing.course_name = String(row.gwamokNm || existing.course_name).trim();
      }
    }
  }

  const outputRows = [...classifications.values()].sort((a, b) => {
    if (a.course_no !== b.course_no) return a.course_no.localeCompare(b.course_no);
    if (a.dept_code !== b.dept_code) return a.dept_code.localeCompare(b.dept_code);
    return a.completion_type_code.localeCompare(b.completion_type_code);
  });
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${Papa.unparse(outputRows, { columns: OUTPUT_COLUMNS, newline: "\n" })}\n`);
  console.log(JSON.stringify({
    output: args.output,
    from_year: args.fromYear,
    to_year: args.toYear,
    course_type_links: outputRows.length,
    courses: new Set(outputRows.map((row) => row.course_no)).size,
    departments: new Set(outputRows.map((row) => row.dept_code).filter(Boolean)).size,
    completion_types: [...new Set(outputRows.map((row) => row.completion_type))].sort(),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
