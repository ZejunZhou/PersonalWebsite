import React from "react";
import { Box, Container, Typography, IconButton, Stack } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        py: 4, mt: "auto",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10, 14, 26, 0.9)",
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} {t("footer.builtWith")}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton href="https://github.com/zhouzejun" target="_blank" size="small" sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
              <FontAwesomeIcon icon={faGithub} />
            </IconButton>
            <IconButton href="https://linkedin.com/in/zhouzejun" target="_blank" size="small" sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
              <FontAwesomeIcon icon={faLinkedin} />
            </IconButton>
            <IconButton href="mailto:zhouzejun1147@gmail.com" size="small" sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
              <FontAwesomeIcon icon={faEnvelope} />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
