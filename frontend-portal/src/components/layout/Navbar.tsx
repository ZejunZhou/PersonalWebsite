import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Container,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CodeIcon from "@mui/icons-material/Code";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "Experience", path: "/experience" },
  { label: "Projects", path: "/projects" },
  { label: "Blog", path: "/blog" },
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
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
          <Box
            component={Link}
            to="/"
            sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}
          >
            <CodeIcon sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
              Portfolio
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                  sx: { background: theme.palette.background.paper, width: 260 },
                }}
              >
                <List sx={{ pt: 4 }}>
                  {NAV_ITEMS.map((item) => (
                    <ListItem
                      key={item.path}
                      component={Link}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      sx={{
                        color:
                          location.pathname === item.path ? "primary.main" : "text.secondary",
                      }}
                    >
                      <ListItemText primary={item.label} />
                    </ListItem>
                  ))}
                  {isAuthenticated ? (
                    <ListItem onClick={handleLogout} sx={{ cursor: "pointer" }}>
                      <ListItemText primary="Logout" sx={{ color: "text.secondary" }} />
                    </ListItem>
                  ) : (
                    <ListItem
                      component={Link}
                      to="/login"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <ListItemText primary="Login" sx={{ color: "text.secondary" }} />
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
                    color:
                      location.pathname === item.path ? "primary.main" : "text.secondary",
                    fontWeight: location.pathname === item.path ? 700 : 500,
                    "&:hover": { color: "primary.light" },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLogout}
                  sx={{ ml: 1, borderColor: "rgba(255,255,255,0.15)" }}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1, borderColor: "rgba(255,255,255,0.15)" }}
                >
                  Login
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
