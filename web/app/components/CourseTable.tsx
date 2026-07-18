import { RefObject } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { CourseSummary } from "../lib/types";
import { useFilterStore } from "../store/filterStore";
import { useUiStore } from "../store/uiStore";
import { GradeStrip } from "./GradeStrip";
import { CourseSignals } from "./CourseSignals";

export function CourseTable({
  visible,
  filteredCount,
  hasMore,
  sentinelRef,
  scrollContainerRef,
}: {
  visible: CourseSummary[];
  filteredCount: number;
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}) {
  const { sortBy, sortDir, toggleSort } = useFilterStore();
  const setModalCourse = useUiStore((s) => s.setModalCourse);
  const sd = sortDir as "asc" | "desc";

  return (
    <Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", border: "1px solid", borderColor: "divider" }}>
      <TableContainer ref={scrollContainerRef} sx={{ flex: 1, minHeight: 0 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: "#f8fafc" }}>
                <TableSortLabel active={sortBy === "course_no"} direction={sortBy === "course_no" ? sd : "asc"} onClick={() => toggleSort("course_no")}>학수번호</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc" }}>
                <TableSortLabel active={sortBy === "course_name"} direction={sortBy === "course_name" ? sd : "asc"} onClick={() => toggleSort("course_name")}>과목명</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc" }}>
                <TableSortLabel active={sortBy === "dept_name"} direction={sortBy === "dept_name" ? sd : "asc"} onClick={() => toggleSort("dept_name")}>학과</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc" }}>최근</TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc", minWidth: 260 }}>분포</TableCell>
              <TableCell align="right" sx={{ bgcolor: sortBy === "A+" ? "#eff6ff" : "#f8fafc", minWidth: 230 }}>
                <TableSortLabel active={sortBy === "A+"} direction={sortBy === "A+" ? sd : "desc"} onClick={() => toggleSort("A+")}>핵심지표</TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: "#f8fafc" }}>
                <TableSortLabel active={sortBy === "latestTotalCount"} direction={sortBy === "latestTotalCount" ? sd : "desc"} onClick={() => toggleSort("latestTotalCount")}>총원</TableSortLabel>
              </TableCell>
              <TableCell sx={{ bgcolor: "#f8fafc", width: 32 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((s) => (
              <TableRow
                key={s.course_no}
                hover
                onClick={() => setModalCourse(s)}
                sx={{ cursor: "pointer", transition: "background 0.1s", "&:hover": { bgcolor: "#f1f5f9" }, "&:active": { bgcolor: "#e2e8f0" } }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.72rem", color: "primary.main", fontWeight: 600 }}>{s.course_no}</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.course_name}</TableCell>
                <TableCell sx={{ fontSize: "0.72rem", color: "text.secondary", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.dept_name}</TableCell>
                <TableCell sx={{ fontSize: "0.75rem", color: "text.secondary", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{s.hasGradeData ? `${s.latestYear}/${s.latestTerm}` : "-"}</TableCell>
                <TableCell><GradeStrip grades={s.grades} counts={s.counts} unavailable={!s.hasGradeData} /></TableCell>
                <TableCell align="right"><CourseSignals course={s} /></TableCell>
                <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.hasGradeData ? s.latestTotalCount.toLocaleString() : "-"}</TableCell>
                <TableCell sx={{ px: 0 }}><ChevronRightIcon sx={{ fontSize: 16, color: "#cbd5e1" }} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div ref={sentinelRef} style={{ height: 1 }} />
        {hasMore && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </TableContainer>
      {!hasMore && filteredCount > 0 && (
        <Typography variant="caption" sx={{ display: "block", textAlign: "center", py: 1, color: "text.secondary" }}>
          전체 {filteredCount.toLocaleString()}건
        </Typography>
      )}
    </Paper>
  );
}
