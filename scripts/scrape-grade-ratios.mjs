#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const PORTFOLIO_URL =
  "https://portal.hanyang.ac.kr/port.do#!UDMyMDMxNiRAXmhha3NhLyRAXjAkQF5NMzE5NDc3JEBe6rWQ6rO866qp7Y+s7Yq47Y+066as7JikJEBeTTAwMzc5NCRAXjJmMTEwMmViM2MyZjMyYjY3NzMxYjg5M2E1ODc4NTI0ODBhNTA2NDljNmNmN2M5M2ZmMGQ4MTYwZmE2ZmVkYjc=!";

const GRADE_COLUMNS = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "P", "S", "U"];

function parseArgs(argv) {
  const args = {
    campus: "H0002256",
    dept: "",
    limit: 0,
    output: "outputs/grade_ratios.csv",
    pdfDir: "outputs/pdfs",
    headed: false,
    fresh: false,
    includeRootDept: false,
    listOnly: false,
    skipFrom: [],
    delayMs: 700,
    format: "long",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--campus") {
      args.campus = next;
      i += 1;
    } else if (arg === "--dept") {
      args.dept = next;
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number(next || 0);
      i += 1;
    } else if (arg === "--output") {
      args.output = next;
      i += 1;
    } else if (arg === "--pdf-dir") {
      args.pdfDir = next;
      i += 1;
    } else if (arg === "--delay-ms") {
      args.delayMs = Number(next || args.delayMs);
      i += 1;
    } else if (arg === "--skip-from") {
      args.skipFrom.push(next);
      i += 1;
    }
    else if (arg === "--format") {
      args.format = next;
      i += 1;
    }
    else if (arg === "--long") args.format = "long";
    else if (arg === "--wide") args.format = "wide";
    else if (arg === "--headed") args.headed = true;
    else if (arg === "--fresh") args.fresh = true;
    else if (arg === "--include-root-dept") args.includeRootDept = true;
    else if (arg === "--list-only") args.listOnly = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function loadDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function ensureDir(fileOrDir, isDir = false) {
  const dir = isDir ? fileOrDir : path.dirname(fileOrDir);
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csvFields(format) {
  if (format === "wide") {
    return [
      "campus_code",
      "dept_code",
      "dept_name",
      "course_no",
      "course_name",
      "year_term_range",
      "opening_dept",
      ...GRADE_COLUMNS,
      "parse_status",
      "pdf_path",
      "error",
    ];
  }

  return [
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
}

function appendCsv(file, rows, format = "long") {
  ensureDir(file);
  const exists = fs.existsSync(file);
  const fields = csvFields(format);
  const lines = [];
  if (!exists) lines.push(fields.map(csvEscape).join(","));
  for (const row of rows) lines.push(fields.map((field) => csvEscape(row[field])).join(","));
  fs.appendFileSync(file, `${lines.join("\n")}\n`);
}

function readCompletedKeys(file) {
  if (!fs.existsSync(file)) return new Set();
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return new Set();
  const headers = splitCsvLine(lines[0]);
  const courseIndex = headers.indexOf("course_no");
  const statusIndex = headers.indexOf("parse_status");
  const keys = new Set();
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    if (statusIndex >= 0 && cols[statusIndex] === "error") continue;
    if (courseIndex >= 0 && cols[courseIndex]) {
      keys.add(cols[courseIndex]);
    }
  }
  return keys;
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

function safeName(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function pdfToText(pdfPath) {
  return execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

async function savePdfFromUrl(context, url, pdfPath) {
  const response = await context.request.get(url);
  if (!response.ok()) throw new Error(`PDF request failed: ${response.status()} ${url}`);
  const body = await response.body();
  if (body.length < 100) throw new Error(`PDF response was too small: ${body.length} bytes`);
  fs.writeFileSync(pdfPath, body);
  return pdfPath;
}

function normalizeGrade(grade) {
  return grade.replace(/0$/, "");
}

function parseGradeRatios(text) {
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[ＡA]\s*\+/g, "A+")
    .replace(/[ＢB]\s*\+/g, "B+")
    .replace(/[ＣC]\s*\+/g, "C+")
    .replace(/[ＤD]\s*\+/g, "D+")
    .replace(/\b([ABCD])0\b/g, "$1");

  const result = Object.fromEntries(GRADE_COLUMNS.map((grade) => [grade, ""]));

  const gradeStateMatch = normalized.match(/성적부여현황\s*\(\s*등급\s*\)([\s\S]*?)(?:\n\s*5\.|\f|\n\s*강의평가)/);
  if (gradeStateMatch) {
    const byYearTerm = new Map();
    for (const line of gradeStateMatch[1].split("\n")) {
      const match = line.trim().match(/^(20\d{2})\s+([12])\s+(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\s+\d+\s+(\d+(?:\.\d+)?)/);
      if (!match) continue;
      const [, year, term, rawGrade, ratio] = match;
      const key = `${year}/${term}`;
      if (!byYearTerm.has(key)) byYearTerm.set(key, Object.fromEntries(GRADE_COLUMNS.map((grade) => [grade, ""])));
      const grade = normalizeGrade(rawGrade);
      if (grade in result) byYearTerm.get(key)[grade] = ratio;
    }

    const latestKey = [...byYearTerm.keys()].sort((a, b) => {
      const [ay, at] = a.split("/").map(Number);
      const [by, bt] = b.split("/").map(Number);
      return ay === by ? at - bt : ay - by;
    }).pop();
    if (latestKey) {
      return { ratios: byYearTerm.get(latestKey), status: "ok" };
    }
  }

  const sectionMatch = normalized.match(/교과목\s*성적\s*비율[\s\S]{0,2500}/);
  const searchText = sectionMatch ? sectionMatch[0] : normalized;

  const lines = searchText.split("\n").map((line) => line.trim()).filter(Boolean);
  for (let i = 0; i < lines.length - 1; i += 1) {
    const headerGrades = [...lines[i].matchAll(/\b(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\b/g)].map((m) => normalizeGrade(m[1]));
    const values = [...lines[i + 1].matchAll(/(\d+(?:\.\d+)?)\s*%?/g)].map((m) => m[1]);
    if (headerGrades.length >= 3 && values.length >= headerGrades.length) {
      headerGrades.forEach((grade, idx) => {
        if (grade in result && !result[grade]) result[grade] = values[idx];
      });
    }
  }

  const pairPattern = /\b(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\b\s*[:：]?\s*(?:\d+\s*(?:명|건)?\s*)?(\d+(?:\.\d+)?)\s*%/g;
  for (const match of searchText.matchAll(pairPattern)) {
    const grade = normalizeGrade(match[1]);
    if (grade in result) result[grade] = match[2];
  }

  const found = GRADE_COLUMNS.some((grade) => result[grade] !== "");
  return { ratios: result, status: found ? "ok" : "not_found" };
}

function parseGradeRatioRows(text) {
  const normalized = text.replace(/\r/g, "\n");
  const gradeStateMatch = normalized.match(/성적부여현황\s*\(\s*등급\s*\)([\s\S]*?)(?:\n\s*5\.|\f|\n\s*강의평가)/);
  if (!gradeStateMatch) return { rows: [], status: "not_found" };

  const rows = [];
  for (const line of gradeStateMatch[1].split("\n")) {
    const matches = line.trim().matchAll(/(20\d{2})\s+([12])\s+(A\+|A0?|B\+|B0?|C\+|C0?|D\+|D0?|F|P|S|U)\s+(\d+)\s+(\d+(?:\.\d+)?)/g);
    for (const match of matches) {
      const [, year, term, grade, count, ratio] = match;
      rows.push({
        "수업년도": year,
        "수업학기": term,
        "등급": grade.replace(/^([ABCD])$/, "$10"),
        "인원": count,
        "비율": ratio,
      });
    }
  }

  return { rows, status: rows.length ? "ok" : "not_found" };
}

async function waitForOptions(page, selector, minCount) {
  await page.waitForFunction(
    ({ selector: innerSelector, minCount: innerMinCount }) =>
      document.querySelectorAll(`${innerSelector} option`).length >= innerMinCount,
    { selector, minCount },
    { timeout: 20000 },
  );
}

async function login(page, id, password) {
  await page.goto("https://portal.hanyang.ac.kr/sso/lgin.do", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.fill("#userId", id);
  await page.fill("#password", password);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
    page.click(".btn_login a"),
  ]);
  await page.waitForTimeout(1200);

  if (await page.locator("#btn_cancel").count()) {
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await Promise.allSettled([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
      page.click("#btn_cancel"),
    ]);
    await page.waitForTimeout(1500);
  }
}

async function openPortfolio(page, campusCode) {
  await page.goto(PORTFOLIO_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector("#cbCampus", { timeout: 30000 });
  await page.selectOption("#cbCampus", campusCode);
  await waitForOptions(page, "#cbHakgwa", 2);
}

async function getDepartments(page, args) {
  const departments = await page.$$eval("#cbHakgwa option", (options) =>
    options.map((option) => ({
      code: option.value,
      name: option.textContent.trim(),
    })),
  );

  return departments.filter((dept) => {
    if (!dept.code) return false;
    if (args.dept) return dept.code === args.dept;
    if (!args.includeRootDept && dept.code === args.campus) return false;
    return true;
  });
}

async function findCourses(page, dept) {
  let lastCourses = [];
  const expectedDept = normalizeDeptForCompare(dept.name);
  const isCampusRoot = dept.code === "H0002256";

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await clearBlockingUi(page);
    await page.selectOption("#cbHakgwa", dept.code);
    await page.waitForTimeout(400);
    await page.fill("#edGwamokNm", "");
    const previousText = await page.locator("#gdMain tbody").innerText({ timeout: 1000 }).catch(() => "");
    await page.click("#btn_Find");
    await page.waitForSelector("#gdMain", { timeout: 20000 });
    await page.waitForFunction(
      ({ previous }) => {
        const text = document.querySelector("#gdMain tbody")?.innerText?.trim() || "";
        return text && text !== previous.trim();
      },
      { previous: previousText },
      { timeout: 10000 },
    ).catch(() => {});
    await page.waitForTimeout(1200);
    await clearBlockingUi(page);

    lastCourses = await page.$$eval("#gdMain tbody tr", (rows) =>
      rows
        .map((row) => {
          const get = (id) => row.querySelector(`#${id}`)?.textContent.trim() || "";
          return {
            course_no: get("haksuNo"),
            course_name: get("gwamokNm"),
            year_term_range: get("startEndYearterm"),
            opening_dept: get("slgSoskCd2"),
          };
        })
        .filter((row) => row.course_no && row.course_name),
    );

    const hasExpectedDept = lastCourses.some((course) =>
      normalizeDeptForCompare(course.opening_dept).includes(expectedDept),
    );
    // The "서울 대학" option is an aggregate search bucket. Its result rows
    // contain each real opening department, not the aggregate option label.
    if (!lastCourses.length || isCampusRoot || hasExpectedDept) return lastCourses;
    console.warn(`  [retry] Course grid did not match ${dept.name}; refreshing (${attempt}/4)`);
    await page.waitForTimeout(1000 + attempt * 500);
  }

  return lastCourses;
}

function normalizeDeptForCompare(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, "");
}

async function openCourseDetail(page, course) {
  await clearBlockingUi(page);
  const rows = page.locator("#gdMain tbody tr").filter({ hasText: course.course_no });
  const count = await rows.count();
  if (count < 1) throw new Error(`Course row not found: ${course.course_no}`);

  const popupPromise = page.waitForEvent("popup", { timeout: 12000 }).catch(() => null);
  const oldUrl = page.url();
  await rows.nth(0).dblclick();
  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
    return { detailPage: popup, closeAfter: true, oldUrl };
  }

  await page.waitForTimeout(1500);
  return { detailPage: page, closeAfter: false, oldUrl };
}

async function clickReportAndSavePdf(detailPage, context, pdfPath) {
  await detailPage.waitForFunction(
    () => document.body?.innerText?.includes("리포트출력"),
    null,
    { timeout: 30000 },
  );

  const reportSelectors = [
    "#btn_Report",
    "#btn_Print",
    "#btn_print",
    "#btn_Rpt",
    "#btn_Output",
    "input[type=button][value*='리포트']",
    "input[type=button][value*='출력']",
    "button:has-text('리포트')",
    "button:has-text('출력')",
    "a:has-text('리포트')",
    "a:has-text('출력')",
    "a.mj_btn_blue",
  ];

  let button = null;
  for (const selector of reportSelectors) {
    const candidate = detailPage.locator(selector);
    const count = await candidate.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const item = candidate.nth(i);
      const text = (await item.innerText().catch(() => "")).replace(/\s+/g, "");
      const value = (await item.getAttribute("value").catch(() => "") || "").replace(/\s+/g, "");
      if ((text.includes("리포트출력") || value.includes("리포트출력")) && await item.isVisible().catch(() => false)) {
        button = item;
        break;
      }
    }
    if (button) break;
  }
  if (!button) throw new Error("Report output button not found");

  ensureDir(pdfPath);
  const reportEventPromise = Promise.race([
    detailPage.waitForEvent("download", { timeout: 30000 }).then((download) => ({ type: "download", download })).catch(() => null),
    detailPage.waitForEvent("popup", { timeout: 30000 }).then((popup) => ({ type: "popup", popup })).catch(() => null),
  ]);
  await button.click();

  const reportEvent = await reportEventPromise;
  if (reportEvent?.type === "download") {
    await reportEvent.download.saveAs(pdfPath);
    return pdfPath;
  }

  if (reportEvent?.type === "popup") {
    const popup = reportEvent.popup;
    await popup.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
    const url = popup.url();
    if (/\.pdf($|\?)|pdf/i.test(url)) {
      await savePdfFromUrl(context, url, pdfPath);
      await popup.close().catch(() => {});
      return pdfPath;
    }

    await popup.waitForFunction(
      () => [...document.querySelectorAll("a")].some((a) => /export_type=pdf|ReportingServer\/service/i.test(a.href)),
      null,
      { timeout: 20000 },
    ).catch(() => {});

    const pdfHref = await popup.$$eval("a", (links) => {
      const link = links.find((a) => /export_type=pdf|ReportingServer\/service/i.test(a.href));
      return link?.href || "";
    });
    if (pdfHref) {
      await savePdfFromUrl(context, pdfHref, pdfPath);
      await popup.close().catch(() => {});
      return pdfPath;
    }

    const innerDownload = await popup.waitForEvent("download", { timeout: 10000 }).catch(() => null);
    if (innerDownload) {
      await innerDownload.saveAs(pdfPath);
      await popup.close().catch(() => {});
      return pdfPath;
    }
    await popup.close().catch(() => {});
    throw new Error(`Report popup did not produce a PDF: ${url}`);
  }

  throw new Error("Report click did not produce a download or popup");
}

async function clearBlockingUi(page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll(".ui-widget-overlay").forEach((element) => element.remove());
    document.querySelectorAll(".blockUI, .blockOverlay").forEach((element) => element.remove());
  }).catch(() => {});
}

async function closeExtraPages(context, mainPage) {
  for (const openedPage of context.pages()) {
    if (openedPage !== mainPage) await openedPage.close().catch(() => {});
  }
}

async function main() {
  loadDotEnv();
  const args = parseArgs(process.argv);
  const id = process.env.HY_ID;
  const password = process.env.HY_PASSWORD;
  if (!id || !password) {
    throw new Error("Set HY_ID and HY_PASSWORD in .env or environment variables.");
  }

  ensureDir(args.pdfDir, true);
  if (args.fresh && fs.existsSync(args.output)) fs.unlinkSync(args.output);
  const completed = args.fresh ? new Set() : readCompletedKeys(args.output);
  for (const skipFile of args.skipFrom) {
    for (const courseNo of readCompletedKeys(skipFile)) completed.add(courseNo);
  }
  const launchOptions = {
    headless: !args.headed,
  };
  if (process.env.PLAYWRIGHT_CHANNEL) launchOptions.channel = process.env.PLAYWRIGHT_CHANNEL;

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  try {
    console.log("[login] Signing in to Hanyang portal");
    await login(page, id, password);
    await openPortfolio(page, args.campus);
    const departments = await getDepartments(page, args);
    console.log(`[departments] ${departments.length} department(s) queued`);

    let processed = 0;
    for (const dept of departments) {
      console.log(`[department] ${dept.name} (${dept.code})`);
      const courses = await findCourses(page, dept);
      console.log(`  [courses] ${courses.length}`);

      if (args.listOnly) {
        appendCsv(args.output, courses.map((course) => ({
          campus_code: args.campus,
          dept_code: dept.code,
          dept_name: dept.name,
          ...course,
          "수업년도": "",
          "수업학기": "",
          "등급": "",
          "인원": "",
          "비율": "",
          parse_status: "catalog",
          pdf_path: "",
          error: "",
        })), args.format);
        continue;
      }

      for (const course of courses) {
        if (args.limit && processed >= args.limit) break;
        const key = course.course_no;
        if (completed.has(key)) {
          console.log(`  [skip] ${course.course_no} ${course.course_name}`);
          continue;
        }

        const baseRow = {
          campus_code: args.campus,
          dept_code: dept.code,
          dept_name: dept.name,
          ...course,
          pdf_path: "",
        };
        let outputRows = [{
          ...baseRow,
          ...Object.fromEntries(GRADE_COLUMNS.map((grade) => [grade, ""])),
          "수업년도": "",
          "수업학기": "",
          "등급": "",
          "인원": "",
          "비율": "",
          parse_status: "",
          error: "",
        }];
        let detailPageForCleanup = null;
        let closeDetailAfter = false;

        console.log(`  [course] ${course.course_no} ${course.course_name}`);
        try {
          await clearBlockingUi(page);
          const { detailPage, closeAfter, oldUrl } = await openCourseDetail(page, course);
          detailPageForCleanup = detailPage;
          closeDetailAfter = closeAfter;
          const bodyText = await detailPage.locator("body").innerText({ timeout: 10000 }).catch(() => "");
          if (/권한오류|인증값/.test(bodyText)) throw new Error("Detail page authorization error");

          const pdfPath = path.join(
            args.pdfDir,
            `${safeName(dept.name)}__${safeName(course.course_no)}__${safeName(course.course_name)}.pdf`,
          );
          await clickReportAndSavePdf(detailPage, context, pdfPath);

          const pdfText = pdfToText(pdfPath);
          if (args.format === "wide") {
            const parsed = parseGradeRatios(pdfText);
            outputRows = [{
              ...baseRow,
              ...Object.fromEntries(GRADE_COLUMNS.map((grade) => [grade, ""])),
              ...parsed.ratios,
              parse_status: parsed.status,
              pdf_path: pdfPath,
              error: "",
            }];
          } else {
            const parsed = parseGradeRatioRows(pdfText);
            outputRows = parsed.rows.length
              ? parsed.rows.map((gradeRow) => ({
                ...baseRow,
                ...gradeRow,
                parse_status: parsed.status,
                pdf_path: pdfPath,
                error: "",
              }))
              : [{
                ...baseRow,
                "수업년도": "",
                "수업학기": "",
                "등급": "",
                "인원": "",
                "비율": "",
                parse_status: parsed.status,
                pdf_path: pdfPath,
                error: "",
              }];
          }

          if (closeAfter) {
            await detailPage.close().catch(() => {});
            detailPageForCleanup = null;
          } else if (page.url() !== oldUrl) {
            await page.goto(PORTFOLIO_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
            await openPortfolio(page, args.campus);
            await findCourses(page, dept);
            detailPageForCleanup = null;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          outputRows = [{
            ...baseRow,
            ...Object.fromEntries(GRADE_COLUMNS.map((grade) => [grade, ""])),
            "수업년도": "",
            "수업학기": "",
            "등급": "",
            "인원": "",
            "비율": "",
            parse_status: "error",
            error: errorMessage,
          }];
          console.warn(`  [error] ${errorMessage}`);
          if (closeDetailAfter && detailPageForCleanup && detailPageForCleanup !== page) {
            await detailPageForCleanup.close().catch(() => {});
          }
          await closeExtraPages(context, page);
          await page.bringToFront().catch(() => {});
          await clearBlockingUi(page);
          await page.goto(PORTFOLIO_URL, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
          await openPortfolio(page, args.campus).catch(() => {});
          await findCourses(page, dept).catch(() => {});
        }

        appendCsv(args.output, outputRows, args.format);
        completed.add(key);
        processed += 1;
        await page.waitForTimeout(args.delayMs);
      }

      if (args.limit && processed >= args.limit) break;
    }

    console.log(`[done] Wrote ${args.output}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
