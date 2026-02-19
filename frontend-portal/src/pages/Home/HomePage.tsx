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
import { Link } from "react-router-dom";

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
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient background orb */}
        <Box
          sx={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(100,181,246,0.12) 0%, transparent 70%)",
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
              "radial-gradient(circle, rgba(206,147,216,0.1) 0%, transparent 70%)",
            bottom: -50,
            left: -50,
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 720 }}>
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
              Building Scalable
              <Box component="span" sx={{ color: "primary.main" }}>
                {" "}
                Systems
              </Box>{" "}
              &{" "}
              <Box component="span" sx={{ color: "secondary.main" }}>
                Products
              </Box>
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", mb: 4, maxWidth: 560, fontSize: "1.15rem" }}
            >
              Passionate about distributed systems, cloud infrastructure, and building
              developer tools. Experienced across AWS, Kubernetes, and full-stack web
              development.
            </Typography>
            <Stack direction="row" spacing={2}>
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
            </Stack>
          </Box>
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
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.dark" },
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
    </Box>
  );
};

export default HomePage;
