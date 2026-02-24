import React, { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Alert, Stack, IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import apiClient, { extractErrorMessage } from "../../services/api";

const ExperienceCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAdmin) { navigate("/experience"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.createExperience({
        company, role, location, start_date: startDate, end_date: endDate,
        bullets: bullets.filter((b) => b.trim()), order,
      });
      navigate("/experience");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("expAdmin.createError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h2" sx={{ mb: 4 }}>{t("expAdmin.createTitle")}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField label={t("expAdmin.company")} value={company} onChange={(e) => setCompany(e.target.value)} required fullWidth />
            <TextField label={t("expAdmin.role")} value={role} onChange={(e) => setRole(e.target.value)} required fullWidth />
            <TextField label={t("expAdmin.location")} value={location} onChange={(e) => setLocation(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label={t("expAdmin.startDate")} value={startDate} onChange={(e) => setStartDate(e.target.value)} required fullWidth placeholder="Jun. 2025" />
              <TextField label={t("expAdmin.endDate")} value={endDate} onChange={(e) => setEndDate(e.target.value)} required fullWidth placeholder="Aug. 2025" />
            </Stack>
            <TextField label={t("expAdmin.order")} type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} sx={{ width: 120 }} />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>{t("expAdmin.bullets")}</Typography>
              {bullets.map((b, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TextField
                    value={b} onChange={(e) => { const arr = [...bullets]; arr[i] = e.target.value; setBullets(arr); }}
                    fullWidth multiline size="small" placeholder={`${t("expAdmin.bullet")} ${i + 1}`}
                  />
                  {bullets.length > 1 && (
                    <IconButton size="small" onClick={() => setBullets(bullets.filter((_, idx) => idx !== i))} sx={{ color: "error.main" }}>
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => setBullets([...bullets, ""])}>{t("expAdmin.addBullet")}</Button>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? t("expAdmin.saving") : t("expAdmin.save")}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/experience")} sx={{ borderColor: "rgba(255,255,255,0.2)" }}>
                {t("blogCreate.cancel")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default ExperienceCreatePage;
