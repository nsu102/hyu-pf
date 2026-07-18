import { Box, Tooltip, Typography } from "@mui/material";
import { DISPLAY_GRADES } from "../lib/constants";
import { formatRatio, gradeTone } from "../lib/utils";

export function GradeStrip({ grades, counts, unavailable = false }: { grades: Record<string, number>; counts?: Record<string, number>; unavailable?: boolean }) {
  if (unavailable) {
    return (
      <Typography sx={{ minWidth: 220, fontSize: "0.72rem", color: "text.secondary" }}>성적표 없음</Typography>
    );
  }
  const active = DISPLAY_GRADES.filter((grade) => (grades[grade] || 0) > 0);
  if (!active.length) {
    return <Box sx={{ height: 14, borderRadius: 999, bgcolor: "#e2e8f0" }} />;
  }

  return (
    <Box sx={{ minWidth: 220 }}>
      <Box sx={{ display: "flex", height: 14, overflow: "hidden", borderRadius: 999, bgcolor: "#e2e8f0", boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}>
        {active.map((grade) => {
          const ratio = grades[grade] || 0;
          const count = counts?.[grade] || 0;
          return (
            <Tooltip key={grade} title={`${grade} ${formatRatio(ratio)}${count ? ` · ${count}명` : ""}`} arrow>
              <Box
                sx={{
                  width: `${Math.max(ratio, 0.8)}%`,
                  bgcolor: gradeTone(grade),
                  minWidth: ratio > 0 ? 3 : 0,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.35 }}>
        <Typography sx={{ fontSize: "0.62rem", color: "text.secondary" }}>A</Typography>
        <Typography sx={{ fontSize: "0.62rem", color: "text.secondary" }}>B/C</Typography>
        <Typography sx={{ fontSize: "0.62rem", color: "text.secondary" }}>P/F</Typography>
      </Box>
    </Box>
  );
}
