import React, { useState } from "react";
import {
  Box, Container, Typography, TextField, Button, Alert, Stack, Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import apiClient, { extractErrorMessage } from "../../services/api";

const BlogCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.createBlogPost({ title, summary, content, tags });
      navigate("/blog");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("blogCreate.createError")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h2" sx={{ mb: 4 }}>{t("blogCreate.title")}</Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField label={t("blogCreate.fieldTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            <TextField label={t("blogCreate.fieldSummary")} value={summary} onChange={(e) => setSummary(e.target.value)} required fullWidth multiline rows={2} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TextField
                  label={t("blogCreate.fieldAddTag")}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                  size="small"
                />
                <Button variant="outlined" size="small" onClick={handleAddTag}>{t("blogCreate.addBtn")}</Button>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} size="small" variant="outlined" sx={{ borderColor: "primary.dark", color: "primary.light" }} />
                ))}
              </Stack>
            </Box>
            <TextField label={t("blogCreate.fieldContent")} value={content} onChange={(e) => setContent(e.target.value)} required fullWidth multiline rows={16} />
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? t("blogCreate.publishing") : t("blogCreate.publish")}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/blog")} sx={{ borderColor: "rgba(255,255,255,0.2)" }}>
                {t("blogCreate.cancel")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default BlogCreatePage;
