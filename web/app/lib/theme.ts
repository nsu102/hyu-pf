import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#1D4ED8", light: "#3B82F6", dark: "#1E40AF" },
    secondary: { main: "#F59E0B" },
    background: { default: "#F8FAFC", paper: "#FFFFFF" },
    text: { primary: "#1E293B", secondary: "#64748B" },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: '"Pretendard Variable", "Pretendard", -apple-system, "Noto Sans KR", sans-serif',
    h5: { fontWeight: 800, letterSpacing: -0.5 },
    subtitle2: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, fontSize: "0.75rem", whiteSpace: "nowrap", padding: "4px 6px" },
        sizeSmall: { padding: "4px 6px" },
      },
    },
    MuiChip: {
      styleOverrides: { sizeSmall: { height: 22, fontSize: "0.72rem" } },
    },
  },
});
