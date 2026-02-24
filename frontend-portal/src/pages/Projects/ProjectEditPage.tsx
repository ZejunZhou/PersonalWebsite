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

const ProjectEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [title, setTitle] = useState("");
  const [techStack, setTechStack] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.getProjects()
      .then((res) => {
        const proj = res.data.projects.find((p: any) => p.project_id === id);
        if (!proj) { setError(t("projects.loadError")); return; }
        setTitle(proj.title); setTechStack(proj.tech_stack); setDateRange(proj.date_range);
        setBullets(proj.bullets?.length ? proj.bullets : [""]); setOrder(proj.order || 0);
        setGithubUrl(proj.github_url || ""); setLiveUrl(proj.live_url || "");
      })
      .catch(() => setError(t("projects.loadError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (!isAdmin) { navigate("/projects"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.updateProject(id, {
        title, tech_stack: techStack, date_range: dateRange,
        bullets: bullets.filter((b) => b.trim()), order,
        github_url: githubUrl || null, live_url: liveUrl || null,
      });
      navigate("/projects");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("projAdmin.saveError")));
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
        <Typography variant="h2" sx={{ mb: 4 }}>{t("projAdmin.editTitle")}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField label={t("projAdmin.title")} value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label={t("projAdmin.techStack")} value={techStack} onChange={(e) => setTechStack(e.target.value)} required fullWidth />
            <TextField label={t("projAdmin.dateRange")} value={dateRange} onChange={(e) => setDateRange(e.target.value)} required fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label={t("projAdmin.githubUrl")} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} fullWidth />
              <TextField label={t("projAdmin.liveUrl")} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} fullWidth />
            </Stack>
            <TextField label={t("projAdmin.order")} type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} sx={{ width: 120 }} />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>{t("projAdmin.bullets")}</Typography>
              {bullets.map((b, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TextField
                    value={b} onChange={(e) => { const arr = [...bullets]; arr[i] = e.target.value; setBullets(arr); }}
                    fullWidth multiline size="small" placeholder={`${t("projAdmin.bullet")} ${i + 1}`}
                  />
                  {bullets.length > 1 && (
                    <IconButton size="small" onClick={() => setBullets(bullets.filter((_, idx) => idx !== i))} sx={{ color: "error.main" }}>
                      <RemoveCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => setBullets([...bullets, ""])}>{t("projAdmin.addBullet")}</Button>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? t("projAdmin.saving") : t("projAdmin.save")}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/projects")} sx={{ borderColor: "rgba(255,255,255,0.2)" }}>
                {t("blogCreate.cancel")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default ProjectEditPage;
