"use client";

import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ThemeProvider } from "@mui/material/styles";
import { signIn } from "next-auth/react";
import { HANYANG_DOMAIN } from "../lib/auth-constants";
import { theme } from "../lib/theme";

type LockedDashboardProps = {
  errorMessage: string | null;
};

function GoogleMark() {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: 24,
        height: 24,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: "#fff",
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-2 3.02v2.57h3.24c1.9-1.75 2.98-4.32 2.98-7.46Z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.98-.9 6.63-2.43L15.39 17a6 6 0 0 1-8.94-3.16H3.1v2.66A10 10 0 0 0 12 22Z"
        />
        <path
          fill="#FBBC05"
          d="M6.45 13.84A6 6 0 0 1 6.14 12c0-.64.11-1.26.31-1.84V7.5H3.1A10 10 0 0 0 2 12c0 1.61.39 3.14 1.1 4.5l3.35-2.66Z"
        />
        <path
          fill="#EA4335"
          d="M12 6.02c1.47 0 2.8.51 3.84 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.35 2.66A5.97 5.97 0 0 1 12 6.02Z"
        />
      </svg>
    </Box>
  );
}

export function LockedDashboard({ errorMessage }: LockedDashboardProps) {
  const [isPending, setIsPending] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleSignIn() {
    setIsPending(true);
    setClientError(null);

    try {
      await signIn(
        "google",
        { callbackUrl: "/" },
        { hd: HANYANG_DOMAIN, prompt: "select_account" }
      );
    } catch {
      setClientError(
        "Google 로그인 화면을 열지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
      setIsPending(false);
    }
  }

  const visibleError = clientError || errorMessage;

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            flexShrink: 0,
            bgcolor: "primary.main",
            borderBottom: "2px solid #F59E0B",
          }}
        >
          <Toolbar
            variant="dense"
            sx={{
              justifyContent: "space-between",
              minHeight: { xs: 44, sm: 48 },
            }}
          >
            <Box
              component="img"
              src="/brand/hyu-pf-logo.png"
              alt="hyu-pf"
              sx={{ width: "auto", height: { xs: 26, sm: 30 } }}
            />
            <Chip
              icon={<LockOutlinedIcon />}
              label="로그인 필요"
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "#fff",
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 1.5, flex: 1 }}>
          <Paper
            sx={{
              p: 1.5,
              mb: 1.5,
              display: "flex",
              gap: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Skeleton variant="rounded" width="32%" height={40} />
            <Skeleton variant="rounded" width="22%" height={40} />
            <Skeleton variant="rounded" width={96} height={40} />
          </Paper>
          <Paper
            sx={{
              height: "calc(100% - 70px)",
              minHeight: 300,
              p: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.3}>
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={`${96 - (index % 3) * 7}%`}
                  height={34}
                />
              ))}
            </Stack>
          </Paper>
        </Container>

        <Dialog
          open
          maxWidth="sm"
          fullWidth
          aria-labelledby="auth-dialog-title"
          slotProps={{
            backdrop: {
              sx: {
                bgcolor: "rgba(15, 23, 42, 0.38)",
                backdropFilter: "blur(2px)",
              },
            },
            paper: {
              sx: {
                m: 2,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)",
              },
            },
          }}
        >
          <DialogContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Typography
              sx={{
                mb: 2.5,
                color: "#4B5563",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              hyu-pf 로그인
            </Typography>
            <Typography
              id="auth-dialog-title"
              component="h1"
              sx={{
                mb: 1.5,
                color: "#202124",
                fontSize: { xs: 24, sm: 28 },
                fontWeight: 800,
                lineHeight: 1.35,
                letterSpacing: "-0.045em",
              }}
            >
              한양 메일로 로그인해주세요
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ mb: 4, fontSize: 14, lineHeight: 1.7 }}
            >
              로그인 후 서비스를 이용할 수 있습니다.
            </Typography>

            {visibleError ? (
              <Box
                role="alert"
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  color: "#991B1B",
                  bgcolor: "#FEF2F2",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {visibleError}
              </Box>
            ) : null}

            <Button
              fullWidth
              size="large"
              variant="outlined"
              startIcon={<GoogleMark />}
              onClick={handleSignIn}
              disabled={isPending}
              sx={{
                minHeight: 68,
                borderColor: "#3778FF",
                borderRadius: 0.75,
                color: "#1457C5",
                bgcolor: "#EEF4FF",
                textTransform: "none",
                fontSize: { xs: 15, sm: 17 },
                fontWeight: 700,
                "&:hover": {
                  borderColor: "#1D5FDB",
                  bgcolor: "#E4EEFF",
                },
              }}
            >
              {isPending
                ? "Google로 이동 중..."
                : "한양대학교 이메일로 로그인"}
            </Button>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "22px 1fr",
                gap: 1.25,
                alignItems: "start",
              }}
            >
              <InfoOutlinedIcon
                sx={{ mt: 0.15, color: "primary.main", fontSize: 20 }}
              />
              <Box>
                <Typography
                  sx={{ mb: 0.75, color: "#24364B", fontSize: 13, fontWeight: 700 }}
                >
                  @hanyang.ac.kr 계정만 사용할 수 있습니다.
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: 11, lineHeight: 1.7 }}
                >
                  Google 계정 정보는 인증 여부 확인에만 사용되며, 별도의 사용자
                  데이터를 수집하거나 데이터베이스에 저장하지 않습니다.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
