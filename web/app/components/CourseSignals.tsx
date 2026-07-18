import { Chip, Stack, Typography } from "@mui/material";
import { PASS_FAIL_GRADES } from "../lib/constants";
import type { CourseSummary } from "../lib/types";
import { formatRatio, sumGrades } from "../lib/utils";

export function CourseSignals({ course }: { course: CourseSummary }) {
  if (!course.hasGradeData) {
    return <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>성적표 없음</Typography>;
  }
  const aPlus = course.grades["A+"] || 0;
  const aBand = sumGrades(course.grades, ["A+", "A"]);
  const passFail = sumGrades(course.grades, PASS_FAIL_GRADES);
  const fail = course.grades.F || 0;

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5, justifyContent: "flex-end" }}>
      <Chip size="small" label={`A+ ${formatRatio(aPlus)}`} sx={{ bgcolor: "#ccfbf1", color: "#0f766e", fontWeight: 800 }} />
      <Chip size="small" label={`A권 ${formatRatio(aBand)}`} sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 800 }} />
      {passFail > 0 && <Chip size="small" label={`P/F ${formatRatio(passFail)}`} sx={{ bgcolor: "#e2e8f0", color: "#334155", fontWeight: 700 }} />}
      {fail > 0 && <Chip size="small" label={`F ${formatRatio(fail)}`} sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 800 }} />}
    </Stack>
  );
}
