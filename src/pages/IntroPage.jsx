// src/pages/IntroPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ColorModeContext } from "../shared-theme/AppTheme";

export default function IntroPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { mode } = React.useContext(ColorModeContext);

  // Navigation items for header / drawer
  const navItems = [
    {
      label: "Features",
      action: () =>
        document
          .getElementById("features")
          ?.scrollIntoView({ behavior: "smooth" })
    },
    {
      label: "Login",
      action: () => navigate("/login?mode=login")
    },
    {
      label: "Sign Up",
      action: () => navigate("/login?mode=signup")
    },
  ];

  // Toggle the mobile drawer
  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  // CTA button under intro
  const handleConnectClick = () => navigate("/login?mode=signup");

  return (
    <>
      {/* 1) Responsive Header */}
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bgcolor:
            mode === "light" ? "#f8fafd" : theme.palette.background.paper,
          backdropFilter: "blur(8px)",
          zIndex: 1000
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            px: 2,
            py: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.5rem" }}>
            GURUKULA LMS
          </Typography>

          {isMobile ? (
            <>
              <IconButton onClick={toggleDrawer(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                  sx: {
                    bgcolor:
                      mode === "light"
                        ? "#f8fafd"
                        : theme.palette.background.paper
                  }
                }}
              >
                <Box
                  sx={{ width: 240 }}
                  role="presentation"
                  onClick={toggleDrawer(false)}
                >
                  <List>
                    {navItems.map(({ label, action }) => (
                      <ListItem key={label} disablePadding>
                        <ListItemButton onClick={action}>
                          <Typography>{label}</Typography>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box>
              {navItems.map(({ label, action }, i) => (
                <Button
                  key={label}
                  onClick={action}
                  variant={i < 2 ? "contained" : "text"}
                  sx={{ ml: i === 0 ? 0 : 1 }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* 2) Spacer for fixed header */}
      <Box sx={{ height: theme.mixins.toolbar.minHeight }} />

      {/* 3) Hero Banner */}
      <Box
        component="section"
        sx={{
          background: "linear-gradient(to right, #f2bcf0, #a9e9fd)",
          minHeight: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: "clamp(2rem, 6vw, 4rem)",
            fontWeight: 700,
            color: "#222"
          }}
        >
          The World’s #1 Teaching & Learning Platform
        </Typography>
      </Box>

      {/* 4) Why Choose LMS? */}
      <Box
        component="section"
        id="features"
        sx={{
          maxWidth: 1200,
          mx: "auto",
          textAlign: "center",
          px: 2,
          py: 6
        }}
      >
        <Typography variant="h4" gutterBottom>
          Why Choose LMS?
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            justifyContent: "center",
            mt: 4
          }}
        >
          {[
            {
              icon: "/icons/classroom.svg",
              title: "Easy Class Management",
              text: "Create classes, enroll students, and assign roles in seconds."
            },
            {
              icon: "/icons/gradebook.svg",
              title: "Built-in Grades & Analytics",
              text: "Grading, track progress, and export reports instantly."
            },
            {
              icon: "/icons/video.svg",
              title: "Secure Video & File Sharing",
              text: "share materials, and keep everything private."
            }
          ].map((f) => (
            <Box key={f.title} sx={{ flex: "1 1 260px", p: 2 }}>
              <Box
                component="img"
                src={f.icon}
                alt={`${f.title} icon`}
                sx={{ width: 64, height: 64, mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                {f.title}
              </Typography>
              <Typography color="text.secondary">{f.text}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 5) About Gurukula LMS */}
      <Box
        component="section"
        id="about"
        sx={{
          maxWidth: 800,
          mx: "auto",
          px: 2,
          py: 6,
          backgroundColor: "#f9f9f9",
          borderRadius: 2
        }}
      >
        <Typography variant="h4" gutterBottom>
          About Gurukula LMS
        </Typography>
        <Typography paragraph>
          Gurukula LMS is an open-source Learning Management System created as a testament to Lahiru Weerasekara’s full-stack development capabilities. Licensed under GPL v3, it provides a free, community-driven platform for teaching and learning online.
        </Typography>
        <Typography paragraph>
          <strong>Mission:</strong> To enable anyone to teach or learn online through a free, accessible platform, and to highlight Lahiru’s proficiency in building end-to-end web applications.
        </Typography>
        <Typography paragraph>
          <strong>Purpose:</strong> Built for students, teachers, and institutions—especially in free-education initiatives—Gurukula LMS leverages open-source tools to keep costs low and invite collaboration from the global community.
        </Typography>
      </Box>

      {/* 6) Tech Stack */}
      <Box
        component="section"
        id="tech-stack"
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: 2,
          py: 6,
          textAlign: "center"
        }}
      >
        <Typography variant="h4" gutterBottom>
          Tech Stack
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
            justifyContent: "center",
            mt: 4
          }}
        >
          {[
            { label: "Backend",     items: "Node.js, Express, PostgreSQL" },
            { label: "Frontend",    items: "React, Material-UI" },
            { label: "Web Server/Storage",    items: "Vercel, Supabase" },
            { label: "Other Tools", items: "Docker, VSCode, PGAdmin4" },
            { label: "License",     items: "GPL v3 (Free & Copyleft)" }
          ].map((t) => (
            <Box key={t.label} sx={{ flex: "1 1 220px", p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t.label}
              </Typography>
              <Typography color="text.secondary">{t.items}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 7) Original Content & CTA */}
      <Box
        component="section"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
          px: 2,
          pb: 6
        }}
      >
        <Box
          sx={{
            background: "#fff4fd",
            borderRadius: 2,
            boxShadow: "10px 10px 25px rgba(207,210,246,0.6)",
            p: 4,
            flex: "1 1 280px",
            transition: "transform .3s ease",
            "&:hover": { transform: "scale(1.05)" }
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Suranna', serif",
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              color: "#849bf7",
              mb: 2
            }}
          >
            LMS solutions for school <br /> and <br /> beyond.
          </Typography>
          <Typography
            sx={{
              fontFamily: "'Tilt Warp', sans-serif",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)"
            }}
          >
            For Every Learner<br />For Every Teacher
          </Typography>
        </Box>

        <Box
          sx={{
            maxWidth: 600,
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
            lineHeight: 1.4,
            color: "#000",
            p: 2,
            flex: "1 1 280px"
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontSize: { xs: "2.1rem", sm: "2.3rem", md: "2.5rem" },
              fontWeight: 500,
              color: "text.primary",
              lineHeight: 1.4
            }}
          >
            The LMS is built to make teaching and learning effortless for everyone—from the littlest learners to college faculty to business leaders.
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 2, fontSize: "0.9rem", color: "text.secondary" }}
          >
            By using Gurukula LMS, you agree to our&nbsp;
            <Button component="a" href="/terms" sx={{ p: 0, textTransform: "none" }}>
              Terms & Conditions
            </Button>
            &nbsp;and&nbsp;
            <Button component="a" href="/privacy" sx={{ p: 0, textTransform: "none" }}>
              Privacy Policy
            </Button>.
          </Typography>
        </Box>

        <Box sx={{
          flex: "1 1 280px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Button
            variant="contained"
            onClick={handleConnectClick}
            sx={{
              borderRadius: 30,
              px: 4,
              py: 1.5,
              backgroundColor: "#8be3ff",
              color: "#000",
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              "&:hover": { backgroundColor: "#6acbe0" }
            }}
          >
            LET’S CONNECT
          </Button>
        </Box>
      </Box>

      {/* 8) Footer */}
      <Box component="footer" sx={{ bgcolor: "#f8f8f8", px: 2, py: 4 }}>
        <Box sx={{
          maxWidth: 1200,
          mx: "auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          fontSize: 0.875,
          color: "text.secondary"
        }}>
          <Box>
            <Button href="/privacy" sx={{ color: "inherit", mr: 2 }}>
              Privacy Policy
            </Button>
            <Button href="/terms" sx={{ color: "inherit", mr: 2 }}>
              Terms of Service
            </Button>
            <Button href="https://github.com/SinRostrO304/Gurukula_LMS-project/" sx={{ color: "inherit", mr: 2 }}>
              GitHub
            </Button>
            <Button href="/contact" sx={{ color: "inherit" }}>
              Contact
            </Button>
          </Box>
          <Typography>© {new Date().getFullYear()} Gurukula LMS</Typography>
        </Box>
      </Box>
    </>
  );
}