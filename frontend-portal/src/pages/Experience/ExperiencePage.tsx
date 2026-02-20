import React, { useEffect, useState } from "react";
import {
  Box, Container, Typography, Card, CardContent, Chip, Skeleton, Alert,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useTranslation } from "react-i18next";
import apiClient from "../../services/api";

interface Experience {
  experience_id: string;
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  bullets: string[];
  order: number;
}

const ExperiencePage: React.FC = () => {
  const { t } = useTranslation();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getExperiences()
      .then((res) => setExperiences(res.data.experiences))
      .catch(() => setError(t("experience.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h2" sx={{ mb: 1 }}>{t("experience.title")}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          {t("experience.subtitle")}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={200} sx={{ mb: 3, bgcolor: "rgba(255,255,255,0.04)" }} />
            ))
          : experiences.map((exp, idx) => (
              <Card
                key={exp.experience_id}
                sx={{
                  mb: 3, position: "relative", overflow: "visible",
                  transition: "border-color 0.2s", "&:hover": { borderColor: "primary.dark" },
                }}
              >
                {idx < experiences.length - 1 && (
                  <Box sx={{ position: "absolute", left: 32, bottom: -24, width: 2, height: 24, bgcolor: "rgba(255,255,255,0.08)" }} />
                )}
                <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>{exp.company}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Chip icon={<WorkIcon sx={{ fontSize: 16 }} />} label={exp.role} size="small" variant="outlined" sx={{ borderColor: "primary.dark", color: "primary.light" }} />
                        <Chip icon={<LocationOnIcon sx={{ fontSize: 16 }} />} label={exp.location} size="small" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      {exp.start_date} &ndash; {exp.end_date}
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                    {exp.bullets.map((bullet, bIdx) => (
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

export default ExperiencePage;
