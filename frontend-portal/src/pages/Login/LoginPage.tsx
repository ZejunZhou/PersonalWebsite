import React, { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Card, CardContent, Alert, Stack, Tabs, Tab,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { extractErrorMessage } from "../../services/api";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/blog");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 0) {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate("/blog");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("login.authError")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Container maxWidth="xs">
        <Card sx={{ p: 1 }}>
          <CardContent>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(100,181,246,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 2,
                }}
              >
                <LockOutlinedIcon sx={{ color: "primary.main", fontSize: 28 }} />
              </Box>
              <Typography variant="h4">{t("login.welcome")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("login.subtitle")}
              </Typography>
            </Box>

            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(null); }} variant="fullWidth" sx={{ mb: 3 }}>
              <Tab label={t("login.tabLogin")} />
              <Tab label={t("login.tabRegister")} />
            </Tabs>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField label={t("login.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                {tab === 1 && (
                  <TextField label={t("login.displayName")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required fullWidth />
                )}
                <TextField label={t("login.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                  {loading ? t("login.pleaseWait") : tab === 0 ? t("login.signIn") : t("login.createAccount")}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
