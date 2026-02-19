import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Button,
  IconButton,
  TextField,
  Card,
  CardContent,
  Divider,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api";

interface BlogPost {
  post_id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  author_name: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  user_email: string;
  display_name: string;
  content: string;
  created_at: string;
}

const BlogDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    Promise.all([
      apiClient.getBlogPost(postId),
      apiClient.getComments(postId),
    ])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data);
        setComments(commentsRes.data.comments);
      })
      .catch(() => setError("Failed to load blog post."))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDeletePost = async () => {
    if (!postId || !window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.deleteBlogPost(postId);
      navigate("/blog");
    } catch {
      setError("Failed to delete post.");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postId || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiClient.createComment(postId, commentText.trim());
      setComments([...comments, res.data]);
      setCommentText("");
    } catch {
      setError("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;
    try {
      await apiClient.deleteComment(postId, commentId);
      setComments(comments.filter((c) => c.comment_id !== commentId));
    } catch {
      setError("Failed to delete comment.");
    }
  };

  const canDeleteComment = (comment: Comment) =>
    isAdmin || comment.user_id === user?.user_id;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Skeleton variant="text" width="60%" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 4 }} />
        <Skeleton variant="rounded" height={400} sx={{ bgcolor: "rgba(255,255,255,0.04)" }} />
      </Container>
    );
  }

  if (error && !post) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || "Post not found."}</Alert>
      </Container>
    );
  }

  if (!post) return null;

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/blog")} sx={{ color: "text.secondary" }}>
            Back to Blog
          </Button>
          {isAdmin && (
            <IconButton onClick={handleDeletePost} sx={{ color: "error.main" }}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>
          {post.title}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          {post.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ borderColor: "primary.dark", color: "primary.light" }}
            />
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
          By {post.author_name} &middot;{" "}
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>

        <Box
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.8,
            color: "text.secondary",
            mb: 6,
          }}
        >
          {post.content}
        </Box>

        {/* Comments Section */}
        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 4 }} />

        <Typography variant="h3" sx={{ mb: 3 }}>
          Comments ({comments.length})
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No comments yet. Be the first to share your thoughts!
          </Typography>
        )}

        <Stack spacing={2} sx={{ mb: 4 }}>
          {comments.map((comment) => (
            <Card
              key={comment.comment_id}
              sx={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.dark" }}>
                      {comment.display_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {comment.display_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  {canDeleteComment(comment) && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteComment(comment.comment_id)}
                      sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                  {comment.content}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Comment Input */}
        {isAuthenticated ? (
          <Box component="form" onSubmit={handleSubmitComment}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <TextField
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || !commentText.trim()}
                sx={{ minWidth: 48, px: 2, height: 40, mt: "4px !important" }}
              >
                <SendIcon fontSize="small" />
              </Button>
            </Stack>
          </Box>
        ) : (
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Log in to leave a comment
            </Typography>
            <Button component={Link} to="/login" variant="outlined" size="small">
              Login
            </Button>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default BlogDetailPage;
