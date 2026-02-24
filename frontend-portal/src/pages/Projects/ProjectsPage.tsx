import React, { useEffect, useState } from "react";
import {
  Box, Container, Typography, Card, CardContent, Chip, Stack, IconButton, Skeleton, Alert, Button,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import LaunchIcon from "@mui/icons-material/Launch";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";

interface Project {
  project_id: string;
  title: string;
  tech_stack: string;
  date_range: string;
  bullets: string[];
  github_url?: string;
  live_url?: string;
  order: number;
}

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getProjects()
      .then((res) => setProjects(res.data.projects))
      .catch(() => setError(t("projects.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("projAdmin.deleteConfirm"))) return;
    try {
      await apiClient.deleteProject(id);
      setProjects(projects.filter((p) => p.project_id !== id));
    } catch {
      setError(t("projAdmin.deleteError"));
    }
  };

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h2">{t("projects.title")}</Typography>
          {isAdmin && (
            <Button variant="contained" size="small" onClick={() => navigate("/projects/new")}>
              {t("projAdmin.addBtn")}
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          {t("projects.subtitle")}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={180} sx={{ mb: 3, bgcolor: "rgba(255,255,255,0.04)" }} />
            ))
          : projects.map((proj) => (
              <Card key={proj.project_id} sx={{ mb: 3, transition: "border-color 0.2s", "&:hover": { borderColor: "primary.dark" } }}>
                <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 1 }}>{proj.title}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {proj.tech_stack.split(",").map((tech) => (
                          <Chip key={tech.trim()} label={tech.trim()} size="small" variant="outlined" sx={{ borderColor: "secondary.dark", color: "secondary.light" }} />
                        ))}
                      </Stack>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {proj.date_range}
                      </Typography>
                      {proj.github_url && (
                        <IconButton href={proj.github_url} target="_blank" size="small" sx={{ color: "text.secondary" }}>
                          <FontAwesomeIcon icon={faGithub} />
                        </IconButton>
                      )}
                      {proj.live_url && (
                        <IconButton href={proj.live_url} target="_blank" size="small" sx={{ color: "text.secondary" }}>
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                      )}
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => navigate(`/projects/${proj.project_id}/edit`)} sx={{ color: "primary.main" }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(proj.project_id)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                    {proj.bullets.map((bullet, bIdx) => (
                      <Typography key={bIdx} component="li" variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>
                        {bullet}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
      </Container>
    </Box>
  );
};

export default ProjectsPage;
