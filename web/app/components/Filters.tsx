import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { DEFAULT_DEPARTMENT, DISPLAY_GRADES } from "../lib/constants";
import { useFilterStore } from "../store/filterStore";
import { useUiStore } from "../store/uiStore";

export function Filters({
  depts,
  completionTypes,
  filteredCount,
  isMobile,
}: {
  depts: string[];
  completionTypes: string[];
  filteredCount: number;
  isMobile: boolean;
}) {
  const {
    search, deptFilter, aPlusFullFilter, recentOnly, noGradeFilter, completionType, sortBy,
    setSearch, setDeptFilter, setAPlusFullFilter, setRecentOnly, setNoGradeFilter, setCompletionType, setSortBy,
  } = useFilterStore();
  const { filterOpen, setFilterOpen } = useUiStore();

  const deptField = (
    <Autocomplete
      size="small"
      options={depts}
      value={deptFilter || null}
      onChange={(_, v) => setDeptFilter(v || "")}
      renderInput={(params) => <TextField {...params} label="학과" placeholder="학과 검색..." />}
      sx={isMobile ? { flex: 1, minWidth: 0 } : { minWidth: 200 }}
      noOptionsText="학과를 입력해주세요"
      clearText="초기화"
      slotProps={{ listbox: { sx: { maxHeight: 240 } } }}
    />
  );
  const completionTypeField = (
    <FormControl size="small" sx={{ minWidth: 155 }}>
      <InputLabel shrink>이수구분</InputLabel>
      <Select
        value={completionType}
        label="이수구분"
        displayEmpty
        renderValue={(value) => value || "전체"}
        onChange={(e) => setCompletionType(e.target.value)}
      >
        <MenuItem value="">전체</MenuItem>
        {completionType && !completionTypes.includes(completionType) && (
          <MenuItem value={completionType}>{completionType}</MenuItem>
        )}
        {completionTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
      </Select>
    </FormControl>
  );
  const sortField = (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel>정렬</InputLabel>
      <Select value={sortBy} label="정렬" onChange={(e) => setSortBy(e.target.value)}>
        <MenuItem value="course_name">과목명</MenuItem>
        <MenuItem value="course_no">학수번호</MenuItem>
        <MenuItem value="dept_name">학과</MenuItem>
        <MenuItem value="termCount">학기수</MenuItem>
        <MenuItem value="latestTotalCount">최근 총원</MenuItem>
        {DISPLAY_GRADES.map((g) => <MenuItem key={g} value={g}>{g} 비율</MenuItem>)}
      </Select>
    </FormControl>
  );
  const checks = (
    <>
      <FormControlLabel
        control={<Checkbox size="small" checked={aPlusFullFilter === "exclude"} onChange={(e) => setAPlusFullFilter(e.target.checked ? "exclude" : "include")} />}
        label={<Typography sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>A+ 100% 제외</Typography>}
        sx={{ ml: 0, mr: 0 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={recentOnly === "on"} onChange={(e) => setRecentOnly(e.target.checked ? "on" : "off")} />}
        label={<Typography sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>최근 3년 개설</Typography>}
        sx={{ ml: 0, mr: 0 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={noGradeFilter === "exclude"} onChange={(e) => setNoGradeFilter(e.target.checked ? "exclude" : "include")} />}
        label={<Typography sx={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>성적표 없음 제외</Typography>}
        sx={{ ml: 0, mr: 0 }}
      />
    </>
  );
  const searchField = (
    <TextField
      size="small"
      placeholder="검색"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      sx={isMobile ? { flex: 1, minWidth: 0 } : { width: 220, flexShrink: 0 }}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "action.disabled" }} /></InputAdornment>,
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch("")} aria-label="검색 초기화"><ClearIcon fontSize="small" /></IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );

  const hasActive = !!deptFilter || !!completionType || aPlusFullFilter === "exclude" || recentOnly === "on" || noGradeFilter === "exclude" || !!search;

  return (
    <Paper sx={{ p: 1.5, mb: 1.5, flexShrink: 0, border: "1px solid", borderColor: "divider" }}>
      {isMobile ? (
        <>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {deptField}
              <Button variant="outlined" size="small" onClick={() => setFilterOpen(true)} sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>필터</Button>
            </Stack>
            {searchField}
          </Stack>
          <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} fullWidth maxWidth="xs">
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>필터</Typography>
              {completionTypeField}
              {sortField}
              <Box sx={{ display: "flex", flexDirection: "column" }}>{checks}</Box>
              <Button variant="contained" onClick={() => setFilterOpen(false)}>적용</Button>
            </Box>
          </Dialog>
        </>
      ) : (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
          {deptField}
          {completionTypeField}
          {sortField}
          {checks}
          <Box sx={{ flexGrow: 1 }} />
          {searchField}
        </Stack>
      )}
      {hasActive && (
        <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          {deptFilter && (
            <Chip
              label={deptFilter === DEFAULT_DEPARTMENT ? "서울 대학 (전체)" : deptFilter}
              size="small"
              onDelete={() => setDeptFilter("")}
              color="primary"
              variant="outlined"
            />
          )}
          {completionType && <Chip label={`이수구분: ${completionType}`} size="small" onDelete={() => setCompletionType("")} color="info" variant="outlined" />}
          {aPlusFullFilter === "exclude" && <Chip label="A+ 100% 제외" size="small" onDelete={() => setAPlusFullFilter("include")} color="secondary" variant="outlined" />}
          {recentOnly === "on" && <Chip label="최근 3년 개설" size="small" onDelete={() => setRecentOnly("off")} variant="outlined" />}
          {noGradeFilter === "exclude" && <Chip label="성적표 없음 제외" size="small" onDelete={() => setNoGradeFilter("include")} variant="outlined" />}
          {search && <Chip label={`"${search}"`} size="small" onDelete={() => setSearch("")} variant="outlined" />}
          <Typography variant="caption" sx={{ color: "text.secondary", ml: 0.5 }}>
            {filteredCount.toLocaleString()}건
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
