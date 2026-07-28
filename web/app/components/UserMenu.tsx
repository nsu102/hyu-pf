"use client";

import { useState } from "react";
import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { signOut } from "next-auth/react";

type UserMenuProps = {
  user: {
    name?: string | null;
    email: string;
  };
};

export function UserMenu({ user }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const initial = (user.name?.trim() || user.email).charAt(0).toUpperCase();

  return (
    <>
      <IconButton
        color="inherit"
        size="small"
        aria-label="계정 메뉴"
        aria-controls={anchorEl ? "account-menu" : undefined}
        aria-expanded={anchorEl ? "true" : undefined}
        aria-haspopup="menu"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ ml: 0.25 }}
      >
        <Avatar
          sx={{
            width: 27,
            height: 27,
            bgcolor: "rgba(255,255,255,0.94)",
            color: "primary.dark",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        id="account-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 240,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="subtitle2" noWrap>
            {user.name || "한양대학교 사용자"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            void signOut({ callbackUrl: "/" });
          }}
          sx={{ gap: 1.25, py: 1.1 }}
        >
          <LogoutRoundedIcon fontSize="small" />
          로그아웃
        </MenuItem>
      </Menu>
    </>
  );
}
