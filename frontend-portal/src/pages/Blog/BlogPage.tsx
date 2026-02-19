import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";

interface BlogPost {
  post_id: string;
  title: string;
  summary: string;
  tags: string[];
  author_name: string;
  created_at: string;
}

const BlogPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getBlogPosts()
      .then((res) => setPosts(res.data.posts))
      .catch(() => setError("Failed to load blog posts."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h2">Blog</Typography>
          {isAdmin && (
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/blog/new")}
            >
              New Post
            </Button>
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          Technical writeups, reflections, and deep dives.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={140}
                sx={{ mb: 3, bgcolor: "rgba(255,255,255,0.04)" }}
              />
            ))
          : posts.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No blog posts yet.
                </Typography>
              </Box>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.post_id}
                  sx={{
                    mb: 3,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                    "&:hover": { borderColor: "primary.dark" },
                  }}
                  onClick={() => navigate(`/blog/${post.post_id}`)}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {post.summary}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      {post.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: "primary.dark", color: "primary.light" }}
                        />
                      ))}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: "auto !important" }}>
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
      </Container>
    </Box>
  );
};

export default BlogPage;
