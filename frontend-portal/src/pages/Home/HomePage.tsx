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
import { Link } from "react-router-dom";
import personImg from "../../images/person.png";

const SKILLS = [
  "Python",
  "Java",
  "Go",
  "TypeScript",
  "React",
  "FastAPI",
  "AWS",
  "Docker",
  "Kubernetes",
  "DynamoDB",
  "PostgreSQL",
  "Git",
];

const HIGHLIGHTS = [
  {
    icon: <CloudIcon sx={{ fontSize: 40, color: "primary.main" }} />,
    title: "Cloud & Distributed Systems",
    description:
      "Built scalable pipelines on AWS processing 300K+ documents across 100 accounts using ECS, S3, and DynamoDB.",
  },
  {
    icon: <TerminalIcon sx={{ fontSize: 40, color: "secondary.main" }} />,
    title: "DevOps & Infrastructure",
    description:
      "Developed GPU health checks on Kubernetes clusters, reducing allocation failures by 30% with custom monitoring plugins.",
  },
  {
    icon: <WebIcon sx={{ fontSize: 40, color: "primary.light" }} />,
    title: "Full-Stack Development",
    description:
      "Created research tools with React + Flask + Cassandra, published at AAAI Symposium Series 2024.",
  },
  {
    icon: <StorageIcon sx={{ fontSize: 40, color: "secondary.light" }} />,
    title: "Data & ML Systems",
    description:
      "Built semantic search engines with vector embeddings, MapReduce pipelines, and RAG-based retrieval systems.",
  },
];

const HomePage: React.FC = () => {
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
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(100,181,246,0.1) 0%, transparent 70%)",
            top: -100,
            right: -100,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(206,147,216,0.08) 0%, transparent 70%)",
            bottom: -50,
            left: -50,
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* Left: Text */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  mb: 2,
                }}
              >
                Software Development Engineer
              </Typography>

              <Typography variant="h1" sx={{ mb: 3, lineHeight: 1.1 }}>
                Zejun's{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  Portfolio
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  mb: 4,
                  maxWidth: 560,
                  fontSize: "1.1rem",
                  lineHeight: 1.8,
                }}
              >
                Hi! I am Zejun Zhou, a second year master student currently pursuing
                a Master of Science degree in Computer Science and Data Science at
                Brown University. Outside work, I like to swim and play badminton.
                I am also a lover of hiking. Reach me out if you want to hang out
                together!
              </Typography>

              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  component={Link}
                  to="/experience"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  View Experience
                </Button>
                <Button
                  component={Link}
                  to="/projects"
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Projects
                </Button>
                <Button
                  component={Link}
                  to="/blog"
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Blog
                </Button>
              </Stack>
            </Grid>

            {/* Right: Photo */}
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: -4,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(100,181,246,0.4), rgba(206,147,216,0.4))",
                    filter: "blur(20px)",
                    zIndex: 0,
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
                    objectFit: "cover",
                    objectPosition: "center 20%",
                    display: "block",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Highlights Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          What I Do
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 560 }}>
          A snapshot of the domains and problems I&apos;ve worked on.
        </Typography>

        <Grid container spacing={3}>
          {HIGHLIGHTS.map((item, idx) => (
            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
              <Card
                sx={{
                  height: "100%",
                  p: 1,
                  transition: "border-color 0.2s, transform 0.2s",
                  "&:hover": {
                    borderColor: "primary.dark",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Skills Section */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ mb: 4 }}>
            Tech Stack
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {SKILLS.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                variant="outlined"
                sx={{
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "text.primary",
                  fontSize: "0.9rem",
                  py: 2.5,
                  px: 1,
                  "&:hover": { borderColor: "primary.main", color: "primary.main" },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Contact CTA */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", py: 8 }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <EmailIcon sx={{ fontSize: 40, color: "primary.main", mb: 2 }} />
          <Typography variant="h3" sx={{ mb: 2 }}>
            Let's Connect
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Looking for a collaborator, or just want to chat about tech, hiking trails,
            or a badminton match? Drop me a line!
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="mailto:zhouzejun1147@gmail.com"
            endIcon={<ArrowForwardIcon />}
          >
            Get in Touch
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
