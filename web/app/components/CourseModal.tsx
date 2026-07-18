import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { GRADE_ORDER } from "../lib/constants";
import { gradeColor, sumGrades } from "../lib/utils";
import { GradeStrip } from "./GradeStrip";
import { useUiStore } from "../store/uiStore";

export function CourseModal({ isMobile }: { isMobile: boolean }) {
  const { modalCourse, setModalCourse } = useUiStore();

  return (
    <Dialog
      open={!!modalCourse}
      onClose={() => setModalCourse(null)}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{ paper: { sx: { maxHeight: isMobile ? "100%" : "85vh", p: isMobile ? 0 : 1 } } }}
    >
      {modalCourse && (() => {
        const activeGrades = GRADE_ORDER.filter((g) => modalCourse.terms.some((t) => t.grades[g]));
        const aBand = sumGrades(modalCourse.grades, ["A+", "A"]);
        const bBand = sumGrades(modalCourse.grades, ["B+", "B"]);
        const cBand = sumGrades(modalCourse.grades, ["C+", "C"]);
        const dBand = sumGrades(modalCourse.grades, ["D+", "D"]);
        const avgAPlus = modalCourse.terms.reduce((s, t) => s + (t.grades["A+"] || 0), 0) / modalCourse.terms.length;
        const avgABand = modalCourse.terms.reduce((s, t) => s + (t.grades["A+"] || 0) + (t.grades["A"] || 0), 0) / modalCourse.terms.length;

        return (
          <Box sx={{ padding: 2 }}>
            <Box sx={{ pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", color: "primary.main", fontFamily: "monospace", fontWeight: 700, mb: 0.25 }}>{modalCourse.course_no}</Typography>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, lineHeight: 1.2, mb: 0.5 }}>{modalCourse.course_name}</Typography>
                <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                  {modalCourse.dept_name} · {modalCourse.opening_dept}
                </Typography>
              </Box>
              <IconButton onClick={() => setModalCourse(null)} size="small" aria-label="닫기" sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ px: 3, pb: 2.5 }}>
              {!modalCourse.hasGradeData ? (
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: "0.95rem", color: "text.primary", fontWeight: 700 }}>성적표 없음</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.35 }}>
                    포털 교과목 리포트에 성적부여현황 표가 제공되지 않은 과목입니다.
                  </Typography>
                </Box>
              ) : null}
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", textTransform: "uppercase", fontWeight: 600, mb: 1.5, letterSpacing: 0.5 }}>
                {modalCourse.hasGradeData ? `최근 학기 (${modalCourse.latestYear}/${modalCourse.latestTerm}) · ${modalCourse.latestTotalCount}명` : `개설 범위 · ${modalCourse.year_term_range || "정보 없음"}`}
              </Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 1.5, mb: 2.5 }}>
                {[
                  { label: "A+", value: modalCourse.grades["A+"] || 0, count: modalCourse.counts["A+"] || 0 },
                  { label: "A권", value: aBand, count: (modalCourse.counts["A+"] || 0) + (modalCourse.counts["A"] || 0) },
                  { label: "B권", value: bBand, count: (modalCourse.counts["B+"] || 0) + (modalCourse.counts["B"] || 0) },
                  { label: "C권", value: cBand, count: (modalCourse.counts["C+"] || 0) + (modalCourse.counts["C"] || 0) },
                  { label: "D/F", value: dBand + (modalCourse.grades["F"] || 0), count: (modalCourse.counts["D+"] || 0) + (modalCourse.counts["D"] || 0) + (modalCourse.counts["F"] || 0) },
                ].map((m) => (
                  <Box key={m.label} sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 1.5, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                    <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: gradeColor(m.value), lineHeight: 1 }}>
                      {m.value ? m.value.toFixed(1) : "-"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", mt: 0.4 }}>{m.label}</Typography>
                    {m.count > 0 && <Typography sx={{ fontSize: "0.6rem", color: "text.secondary" }}>{m.count}명</Typography>}
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", textTransform: "uppercase" }}>평균 A+ (전체 학기)</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: gradeColor(avgAPlus) }}>{avgAPlus.toFixed(1)}%</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", textTransform: "uppercase" }}>평균 A권 (전체 학기)</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: gradeColor(avgABand) }}>{avgABand.toFixed(1)}%</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", textTransform: "uppercase" }}>데이터</Typography>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>{modalCourse.termCount}학기</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", textTransform: "uppercase" }}>개설 범위</Typography>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{modalCourse.year_term_range}</Typography>
                </Box>
              </Box>

              <GradeStrip grades={modalCourse.grades} counts={modalCourse.counts} unavailable={!modalCourse.hasGradeData} />
            </Box>

            <Divider />

            <DialogContent sx={{ p: 0 }}>
              <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", textTransform: "uppercase", fontWeight: 600, px: 3, pt: 2, pb: 0.75, letterSpacing: 0.5 }}>
                학기별 추이
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: "#f8fafc", position: "sticky", left: 0, zIndex: 1, fontSize: "0.7rem" }}>학기</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: "#f8fafc", fontSize: "0.7rem" }}>총원</TableCell>
                      {activeGrades.map((g) => (
                        <TableCell key={g} align="right" sx={{ fontWeight: 700, bgcolor: "#f8fafc", fontSize: "0.7rem" }}>{g}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...modalCourse.terms].reverse().map((t) => {
                      const isLatest = t.year === modalCourse.latestYear && t.term === modalCourse.latestTerm;
                      return (
                        <TableRow key={`${t.year}-${t.term}`} sx={{ bgcolor: isLatest ? "#f0f7ff" : "transparent" }}>
                          <TableCell sx={{ fontWeight: isLatest ? 700 : 500, whiteSpace: "nowrap", position: "sticky", left: 0, bgcolor: isLatest ? "#f0f7ff" : "#fff", zIndex: 1, fontSize: "0.75rem" }}>
                            {t.year}/{t.term}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.75rem", fontWeight: isLatest ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>
                            {t.totalCount.toLocaleString()}
                          </TableCell>
                          {activeGrades.map((g) => {
                            const v = t.grades[g] || 0;
                            const c = t.counts[g] || 0;
                            return (
                              <TableCell key={g} align="right" sx={{ fontSize: "0.75rem", fontVariantNumeric: "tabular-nums" }}>
                                {v ? (
                                  <Tooltip title={`${c}명 (${v.toFixed(1)}%)`} arrow>
                                    <Box component="span" sx={{ color: gradeColor(v), fontWeight: v >= 20 ? 700 : 400, cursor: "default" }}>
                                      {v.toFixed(1)}
                                    </Box>
                                  </Tooltip>
                                ) : (
                                  <Box component="span" sx={{ color: "#e2e8f0" }}>-</Box>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
          </Box>
        );
      })()}
    </Dialog>
  );
}
