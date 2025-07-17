// src/pages/IntroPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function IntroPage() {
  const navigate = useNavigate();

  const handleLoginClick  = () => navigate("/login?mode=login");
  const handleSignupClick = () => navigate("/login?mode=signup");
  const handleConnectClick= () => navigate("/login?mode=signup");

  // Smooth‐scroll to features
  const scrollTo = (id) => () => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Fixed header */}
      <Box
        component="header"
        sx={{
          position: "fixed", top: 0, left: 0, right: 0,
          bgcolor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 10
        }}
      >
        <Box
          sx={{
            maxWidth: 1200, mx: "auto",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 2, py: 1
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: "1.5rem" }}>
            GURUKULA LMS
          </Typography>
          <Box>
            <Button onClick={handleLoginClick}>Login</Button>
            <Button onClick={handleSignupClick} sx={{ ml: 1 }}>
              Sign Up
            </Button>
            <Button onClick={scrollTo("features")} sx={{ ml: 1 }}>
              Features
            </Button>
            <Button onClick={() => navigate("/docs")} sx={{ ml: 1 }}>
              Docs
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ pt: 8 }}> {/* push below fixed header */}
        {/* Hero banner */}
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

        {/* Why Choose LMS? */}
        <Box
          component="section"
          id="features"
          sx={{
            maxWidth: 1200, mx: "auto",
            textAlign: "center",
            px: 2, py: 6
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
                text: "Automate grading, track progress, and export reports instantly."
              },
              {
                icon: "/icons/video.svg",
                title: "Secure Video & File Sharing",
                text: "Host live lessons, share materials, and keep everything private."
              }
            ].map((f) => (
              <Box key={f.title} sx={{ flex: "1 1 260px", p: 2 }}>
                <Box
                  component="img"
                  src={f.icon}
                  alt=""
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

        {/* About Gurukula LMS */}
        <Box
          component="section"
          id="about"
          sx={{
            maxWidth: 800, mx: "auto",
            px: 2, py: 6,
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

        {/* Tech Stack */}
        <Box
          component="section"
          id="tech-stack"
          sx={{
            maxWidth: 1200, mx: "auto",
            px: 2, py: 6,
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
              {
                label: "Backend",
                items: "Node.js, Express, PostgreSQL"
              },
              {
                label: "Frontend",
                items: "React, Material-UI"
              },
              {
                label: "Other Tools",
                items: "Docker, Cloudflare R2, Vercel"
              },
              {
                label: "License",
                items: "GPL v3 (Free & Copyleft)"
              }
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

        {/* Original intro content & CTA */}
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
            <Typography>
              The LMS is built to make teaching and learning easier for
              everyone, from the littlest learners to college faculty to
              business leaders. Learn more about how LMS works with your
              institution.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "1 1 280px"
            }}
          >
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

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            background: "#f8f8f8",
            px: 2,
            py: 4,
            mt: 4
          }}
        >
          <Box
            sx={{
              maxWidth: 1200,
              mx: "auto",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              fontSize: 0.875,
              color: "text.secondary"
            }}
          >
            <Box>
              <Button href="/privacy" sx={{ color: "inherit", mr: 2 }}>
                Privacy Policy
              </Button>
              <Button href="/terms" sx={{ color: "inherit", mr: 2 }}>
                Terms of Service
              </Button>
              <Button href="https://github.com/your-repo" sx={{ color: "inherit", mr: 2 }}>
                GitHub
              </Button>
              <Button href="/contact" sx={{ color: "inherit" }}>
                Contact
              </Button>
            </Box>
            <Typography>© {new Date().getFullYear()} Gurukula LMS</Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}