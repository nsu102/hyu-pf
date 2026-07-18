import { RefObject } from "react";
import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { CourseSummary } from "../lib/types";
import { useUiStore } from "../store/uiStore";
import { GradeStrip } from "./GradeStrip";
import { CourseSignals } from "./CourseSignals";

export function CourseCards({
  visible,
  hasMore,
  sentinelRef,
}: {
  visible: CourseSummary[];
  hasMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
}) {
  const setModalCourse = useUiStore((s) => s.setModalCourse);

  return (
    <>
      <Stack spacing={0.75}>
        {visible.map((s) => (
          <Card
            key={s.course_no}
            onClick={() => setModalCourse(s)}
            sx={{ border: "1px solid", borderColor: "divider", cursor: "pointer", transition: "background 0.1s", "&:active": { bgcolor: "#f1f5f9" } }}
          >
            <CardContent sx={{ py: 1.25, px: 1.5, "&:last-child": { pb: 1.25 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                    <Typography sx={{ fontSize: "0.7rem", color: "primary.main", fontWeight: 700, fontFamily: "monospace" }}>{s.course_no}</Typography>
                    <Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>{s.dept_name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1.3 }} noWrap>{s.course_name}</Typography>
                </Box>
                <ChevronRightIcon sx={{ fontSize: 18, color: "#cbd5e1", flexShrink: 0 }} />
              </Box>
              <Box sx={{ mt: 1 }}>
                <GradeStrip grades={s.grades} counts={s.counts} unavailable={!s.hasGradeData} />
              </Box>
              <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <CourseSignals course={s} />
                {s.hasGradeData && (
                  <Typography sx={{ fontSize: "0.7rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                    <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>총원</Box> {s.latestTotalCount.toLocaleString()}명
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <div ref={sentinelRef} />
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </>
  );
}
