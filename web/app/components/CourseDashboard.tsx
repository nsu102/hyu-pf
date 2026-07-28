"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar,
  Box,
  Chip,
  Container,
  IconButton,
  LinearProgress,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import { PAGE_SIZE, DEFAULT_DEPARTMENT } from "../lib/constants";
import { theme } from "../lib/theme";
import { buildSummaries, filterAndSort } from "../lib/utils";
import { useDataStore } from "../store/dataStore";
import { useFilterStore } from "../store/filterStore";
import { useUrlSync } from "../store/useUrlSync";
import { Filters } from "./Filters";
import { CourseTable } from "./CourseTable";
import { CourseCards } from "./CourseCards";
import { CourseModal } from "./CourseModal";
import { UserMenu } from "./UserMenu";

type CourseDashboardProps = {
  user: {
    name?: string | null;
    email: string;
  };
};

export function CourseDashboard({ user }: CourseDashboardProps) {
  return (
    <Suspense fallback={<LinearProgress />}>
      <DashboardInner user={user} />
    </Suspense>
  );
}

function DashboardInner({ user }: CourseDashboardProps) {
  const { raw, catalog, departmentCourses, loading, loadData } = useDataStore();
  const { search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, sortBy, sortDir } = useFilterStore();
  useUrlSync();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const summaries = useMemo(() => buildSummaries(raw, catalog, departmentCourses), [raw, catalog, departmentCourses]);

  const depts = useMemo(
    () => [...new Set(summaries.flatMap((s) => s.departmentNames))]
      .filter(Boolean)
      .sort((a, b) => a === DEFAULT_DEPARTMENT ? -1 : b === DEFAULT_DEPARTMENT ? 1 : a.localeCompare(b)),
    [summaries]
  );

  const filtered = useMemo(
    () => filterAndSort(summaries, { search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, sortBy, sortDir }),
    [summaries, search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, sortBy, sortDir]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setVisibleCount(PAGE_SIZE), 0);
    return () => window.clearTimeout(timer);
  }, [deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, search, sortBy, sortDir]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const root = scrollContainerRef.current || null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length));
        }
      },
      { root, rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filtered.length]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <AppBar position="static" elevation={0} sx={{ flexShrink: 0, bgcolor: "primary.main", borderBottom: "2px solid #F59E0B" }}>
          <Toolbar variant="dense" sx={{ justifyContent: "space-between", minHeight: { xs: 44, sm: 48 } }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, paddingTop: 0.5 }}>
              <Box
                component="img"
                src="/brand/hyu-pf-logo.png"
                alt="hyu-pf"
                sx={{ display: "block", width: "auto", height: { xs: 26, sm: 30 } }}
              />
              <Typography variant="caption" sx={{ opacity: 0.7, display: { xs: "none", sm: "inline" } }}>
                한양대 교과목 성적비율
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Chip label={`${summaries.length.toLocaleString()}개`} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600 }} />
              <Tooltip title="새로고침">
                <IconButton color="inherit" onClick={loadData} disabled={loading} size="small" aria-label="새로고침">
                  <RefreshIcon fontSize="small" sx={{ animation: loading ? "spin 1s linear infinite" : "none", "@keyframes spin": { "100%": { transform: "rotate(360deg)" } } }} />
                </IconButton>
              </Tooltip>
              <UserMenu user={user} />
            </Box>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="xl"
          sx={{
            py: 1.5,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: { xs: "auto", md: "visible" },
          }}
        >
          <Filters depts={depts} filteredCount={filtered.length} isMobile={isMobile} />

          {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

          {!loading && filtered.length > 0 && !isMobile && (
            <CourseTable visible={visible} filteredCount={filtered.length} hasMore={hasMore} sentinelRef={sentinelRef} scrollContainerRef={scrollContainerRef} />
          )}

          {!loading && filtered.length > 0 && isMobile && (
            <CourseCards visible={visible} hasMore={hasMore} sentinelRef={sentinelRef} />
          )}

          {!loading && filtered.length === 0 && (
            <Paper sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", p: 5, border: "1px solid", borderColor: "divider" }}>
              <Typography color="text.secondary">{deptFilter ? "검색 결과 없음" : "학과를 입력해주세요"}</Typography>
            </Paper>
          )}
        </Container>

        <CourseModal isMobile={isMobile} />
      </Box>
    </ThemeProvider>
  );
}
