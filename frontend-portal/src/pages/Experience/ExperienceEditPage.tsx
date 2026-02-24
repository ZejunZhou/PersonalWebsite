import React, { useEffect, useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Alert, Stack, IconButton, Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import apiClient, { extractErrorMessage } from "../../services/api";

const ExperienceEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.getExperiences()
      .then((res) => {
        const exp = res.data.experiences.find((e: any) => e.experience_id === id);
        if (!exp) { setError(t("experience.loadError")); return; }
        setCompany(exp.company); setRole(exp.role); setLocation(exp.location);
        setStartDate(exp.start_date); setEndDate(exp.end_date);
        setBullets(exp.bullets?.length ? exp.bullets : [""]); setOrder(exp.order || 0);
      })
      .catch(() => setError(t("experience.loadError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (!isAdmin) { navigate("/experience"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.updateExperience(id, {
        company, role, location, start_date: startDate, end_date: endDate,
        bullets: bullets.filter((b) => b.trim()), order,
      });
      navigate("/experience");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("expAdmin.saveError")));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Skeleton variant="text" width="40%" height={60} sx={{ mb: 4 }} />
        <Skeleton variant="rounded" height={400} sx={{ bgcolor: "rgba(255,255,255,0.04)" }} />
      </Container>
    );
  }

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h2" sx={{ mb: 4 }}>{t("expAdmin.editTitle")}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField label={t("expAdmin.company")} value={company} onChange={(e) => setCompany(e.target.value)} required fullWidth />
            <TextField label={t("expAdmin.role")} value={role} onChange={(e) => setRole(e.target.value)} required fullWidth />
            <TextField label={t("expAdmin.location")} value={location} onChange={(e) => setLocation(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label={t("expAdmin.startDate")} value={startDate} onChange={(e) => setStartDate(e.target.value)} required fullWidth />
              <TextField label={t("expAdmin.endDate")} value={endDate} onChange={(e) => setEndDate(e.target.value)} required fullWidth />
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

export default ExperienceEditPage;
