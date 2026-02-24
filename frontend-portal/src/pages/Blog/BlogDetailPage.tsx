import React, { useEffect, useState } from "react";
import {
  Box, Container, Typography, Chip, Stack, Skeleton, Alert, Button,
  IconButton, TextField, Card, CardContent, Divider, Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const { t, i18n } = useTranslation();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dateLocale = i18n.language === "zh" ? "zh-CN" : "en-US";

  useEffect(() => {
    if (!postId) return;
    Promise.all([apiClient.getBlogPost(postId), apiClient.getComments(postId)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data);
        setComments(commentsRes.data.comments);
      })
      .catch(() => setError(t("blog.loadError")))
      .finally(() => setLoading(false));
  }, [postId, t]);

  const handleDeletePost = async () => {
    if (!postId || !window.confirm(t("blog.deleteConfirm"))) return;
    try {
      await apiClient.deleteBlogPost(postId);
      navigate("/blog");
    } catch {
      setError(t("blog.deleteError"));
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
      setError(t("blog.commentError"));
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
      setError(t("blog.deleteCommentError"));
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
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!post) return null;

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/blog")} sx={{ color: "text.secondary" }}>
            {t("blog.backToBlog")}
          </Button>
          {isAdmin && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton onClick={() => navigate(`/blog/${postId}/edit`)} sx={{ color: "primary.main" }}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={handleDeletePost} sx={{ color: "error.main" }}>
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        <Typography variant="h2" sx={{ mb: 2 }}>{post.title}</Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          {post.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: "primary.dark", color: "primary.light" }} />
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
          {t("blog.by")} {post.author_name} &middot;{" "}
          {new Date(post.created_at).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })}
        </Typography>

        <Box
          sx={{
            lineHeight: 1.8, color: "text.secondary", mb: 6,
            "& h1,& h2,& h3,& h4": { color: "text.primary", mt: 3, mb: 1.5 },
            "& p": { mb: 2 },
            "& ul,& ol": { pl: 3, mb: 2 },
            "& li": { mb: 0.5 },
            "& code": { bgcolor: "rgba(255,255,255,0.06)", px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: "0.9em", fontFamily: "monospace" },
            "& pre": { bgcolor: "rgba(255,255,255,0.04)", p: 2, borderRadius: 1, overflow: "auto", mb: 2 },
            "& pre code": { bgcolor: "transparent", p: 0 },
            "& blockquote": { borderLeft: "3px solid", borderColor: "primary.dark", pl: 2, ml: 0, color: "text.secondary", fontStyle: "italic" },
            "& table": { width: "100%", borderCollapse: "collapse", mb: 2 },
            "& th,& td": { border: "1px solid rgba(255,255,255,0.12)", px: 1.5, py: 1 },
            "& th": { bgcolor: "rgba(255,255,255,0.04)" },
            "& a": { color: "primary.main", textDecoration: "underline" },
            "& img": { maxWidth: "100%", borderRadius: 1 },
            "& hr": { borderColor: "rgba(255,255,255,0.08)", my: 3 },
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 4 }} />

        <Typography variant="h3" sx={{ mb: 3 }}>
          {t("blog.comments")} ({comments.length})
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("blog.noComments")}
          </Typography>
        )}

        <Stack spacing={2} sx={{ mb: 4 }}>
          {comments.map((comment) => (
            <Card key={comment.comment_id} sx={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.dark" }}>
                      {comment.display_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{comment.display_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </Typography>
                    </Box>
                  </Box>
                  {canDeleteComment(comment) && (
                    <IconButton size="small" onClick={() => handleDeleteComment(comment.comment_id)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
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

        {isAuthenticated ? (
          <Box component="form" onSubmit={handleSubmitComment}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <TextField
                placeholder={t("blog.writeComment")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                fullWidth multiline minRows={2} maxRows={6} size="small"
              />
              <Button type="submit" variant="contained" disabled={submitting || !commentText.trim()} sx={{ minWidth: 48, px: 2, height: 40, mt: "4px !important" }}>
                <SendIcon fontSize="small" />
              </Button>
            </Stack>
          </Box>
        ) : (
          <Card sx={{ border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("blog.loginToComment")}
            </Typography>
            <Button component={Link} to="/login" variant="outlined" size="small">
              {t("nav.login")}
            </Button>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default BlogDetailPage;
