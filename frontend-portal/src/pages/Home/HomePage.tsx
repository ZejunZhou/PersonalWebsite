import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloudIcon from "@mui/icons-material/Cloud";
import StorageIcon from "@mui/icons-material/Storage";
import WebIcon from "@mui/icons-material/Web";
import TerminalIcon from "@mui/icons-material/Terminal";
import EmailIcon from "@mui/icons-material/Email";
import CodeIcon from "@mui/icons-material/Code";
import BuildIcon from "@mui/icons-material/Build";
import LayersIcon from "@mui/icons-material/Layers";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import personImg from "../../images/person.png";

const SKILL_CATEGORIES = [
  {
    i18nKey: "languages",
    icon: <CodeIcon sx={{ fontSize: 20, color: "primary.main" }} />,
    color: "primary.main",
    skills: ["Python", "Golang", "Java", "C", "SQL", "JavaScript", "HTML/CSS"],
  },
  {
    i18nKey: "tools",
    icon: <BuildIcon sx={{ fontSize: 20, color: "secondary.main" }} />,
    color: "secondary.main",
    skills: ["AWS","GCP","Docker", "Kubernetes", "Linux", "Git", "VS Code", "Cursor", "Claude Code"],
  },
  {
    i18nKey: "frameworks",
    icon: <LayersIcon sx={{ fontSize: 20, color: "primary.light" }} />,
    color: "primary.light",
    skills: ["PyTorch", "Milvus", "Flask", "React.js", "Spark", "Kafka", "Cassandra", "MySQL"],
  },
];

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: <CloudIcon sx={{ fontSize: 40, color: "primary.main" }} />,
      title: t("home.highlight.cloud"),
      description: t("home.highlight.cloudDesc"),
    },
    {
      icon: <TerminalIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
      title: t("home.highlight.devops"),
      description: t("home.highlight.devopsDesc"),
    },
    {
      icon: <WebIcon sx={{ fontSize: 40, color: "primary.light" }} />,
      title: t("home.highlight.fullstack"),
      description: t("home.highlight.fullstackDesc"),
    },
    {
      icon: <StorageIcon sx={{ fontSize: 40, color: "secondary.light" }} />,
      title: t("home.highlight.data"),
      description: t("home.highlight.dataDesc"),
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(100,181,246,0.1) 0%, transparent 70%)",
            top: -100, right: -100, pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(206,147,216,0.08) 0%, transparent 70%)",
            bottom: -50, left: -50, pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main", fontWeight: 600,
                  letterSpacing: 2, textTransform: "uppercase", mb: 2,
                }}
              >
                {t("home.role")}
              </Typography>

              <Typography variant="h1" sx={{ mb: 3, lineHeight: 1.1 }}>
                {t("home.title")}{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  {t("home.titleHighlight")}
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary", mb: 4,
                  maxWidth: 560, fontSize: "1.1rem", lineHeight: 1.8,
                }}
              >
                {t("home.intro")}
              </Typography>

              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button component={Link} to="/experience" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
                  {t("home.viewExperience")}
                </Button>
                <Button component={Link} to="/projects" variant="outlined" size="large" sx={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  {t("home.projects")}
                </Button>
                <Button component={Link} to="/blog" variant="outlined" size="large" sx={{ borderColor: "rgba(255,255,255,0.2)" }}>
                  {t("home.blog")}
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""', position: "absolute", inset: -4, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(100,181,246,0.4), rgba(206,147,216,0.4))",
                    filter: "blur(20px)", zIndex: 0,
                  },
                }}
              >
                <Box
                  component="img"
                  src={personImg}
                  alt="Zejun Zhou"
                  sx={{
                    width: { xs: 240, sm: 280, md: 320 },
                    height: { xs: 240, sm: 280, md: 320 },
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.1)",
                    objectFit: "cover", objectPosition: "center 20%",
                    display: "block", position: "relative", zIndex: 1,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Highlights */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>{t("home.whatIDo")}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 560 }}>
          {t("home.whatIDoSub")}
        </Typography>

        <Grid container spacing={3}>
          {highlights.map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
              <Card
                sx={{
                  height: "100%", p: 1,
                  transition: "border-color 0.2s, transform 0.2s",
                  "&:hover": { borderColor: "primary.dark", transform: "translateY(-4px)" },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Skills */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ mb: 5 }}>{t("home.techStack")}</Typography>
          <Grid container spacing={4}>
            {SKILL_CATEGORIES.map((cat) => (
              <Grid size={{ xs: 12, md: 4 }} key={cat.i18nKey}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                    height: "100%",
                    transition: "border-color 0.2s, background 0.2s",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
                    {cat.icon}
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: cat.color, letterSpacing: 0.5 }}
                    >
                      {t(`home.skillCategory.${cat.i18nKey}`)}
                    </Typography>
                  </Stack>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {cat.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: "rgba(255,255,255,0.12)",
                          color: "text.primary",
                          fontSize: "0.85rem",
                          py: 2,
                          px: 0.5,
                          "&:hover": { borderColor: cat.color, color: cat.color },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact CTA */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", py: 8 }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <EmailIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
          <Typography variant="h3" sx={{ mb: 2 }}>{t("home.letsConnect")}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t("home.letsConnectSub")}
          </Typography>
          <Button variant="contained" size="large" href="mailto:zhouzejun1147@gmail.com" endIcon={<ArrowForwardIcon />}>
            {t("home.getInTouch")}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
