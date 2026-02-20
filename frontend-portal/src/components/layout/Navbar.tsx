import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton,
  Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme, Container,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CodeIcon from "@mui/icons-material/Code";
import TranslateIcon from "@mui/icons-material/Translate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const NAV_ITEMS = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.experience"), path: "/experience" },
    { label: t("nav.projects"), path: "/projects" },
    { label: t("nav.blog"), path: "/blog" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(10, 14, 26, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          <Box component={Link} to="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}>
            <CodeIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              {t("nav.siteTitle")}
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton size="small" onClick={toggleLang} sx={{ color: "text.secondary" }}>
                  <TranslateIcon fontSize="small" />
                </IconButton>
                <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              </Box>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { background: theme.palette.background.paper, width: 260 } }}
              >
                <List sx={{ pt: 4 }}>
                  {NAV_ITEMS.map((item) => (
                    <ListItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      sx={{ color: location.pathname === item.path ? "primary.main" : "text.secondary" }}
                    >
                      <ListItemText primary={item.label} />
                    </ListItem>
                  ))}
                  {isAuthenticated ? (
                    <ListItem onClick={handleLogout} sx={{ cursor: "pointer" }}>
                      <ListItemText primary={t("nav.logout")} sx={{ color: "text.secondary" }} />
                    </ListItem>
                  ) : (
                    <ListItem component={Link} to="/login" onClick={() => setDrawerOpen(false)}>
                      <ListItemText primary={t("nav.login")} sx={{ color: "text.secondary" }} />
                    </ListItem>
                  )}
                </List>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: location.pathname === item.path ? "primary.main" : "text.secondary",
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    "&:hover": { color: "primary.light" },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <Button
                size="small"
                onClick={toggleLang}
                startIcon={<TranslateIcon sx={{ fontSize: 18 }} />}
                sx={{ color: "text.secondary", minWidth: 0, px: 1.5, "&:hover": { color: "primary.light" } }}
              >
                {i18n.language === "en" ? "中文" : "EN"}
              </Button>

              {isAuthenticated ? (
                <Button variant="outlined" size="small" onClick={handleLogout} sx={{ ml: 0.5, borderColor: "rgba(255,255,255,0.15)" }}>
                  {t("nav.logout")}
                </Button>
              ) : (
                <Button component={Link} to="/login" variant="outlined" size="small" sx={{ ml: 0.5, borderColor: "rgba(255,255,255,0.15)" }}>
                  {t("nav.login")}
                </Button>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
