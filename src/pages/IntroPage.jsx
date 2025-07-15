// src/pages/IntroPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/intro_css.css"; // This file contains your plain CSS for the intro page

const IntroPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate("/login?mode=login");
  };

  const handleSignupClick = () => {
    navigate("/login?mode=signup");
  };

  const handleConnectClick = () => {
    navigate("/login?mode=signup");
  };

  return (
    <div className="main-container">
      {/* Gradient Banner Section */}
      <section className="gradient-banner">
        <header className="header">
          <span className="logo">LMS</span>
          <nav className="navigation">
            <button className="button login" onClick={handleLoginClick}>
              LOGIN
            </button>
            <button className="button signup" onClick={handleSignupClick}>
              SIGN UP
            </button>
          </nav>
        </header>
        <h1 className="catchphrase">
          The World's #1 Teaching and Learning Platform
        </h1>
      </section>

      {/* Content Sections */}
      <section className="content-sections">
        <div className="white-box">
          <p className="box-text">
            LMS solutions for school <br /> and <br /> beyond.
          </p>
          <p className="tagline">
            For Every Learner<br />For Every Teacher
          </p>
        </div>
        <div className="intro-text">
          <p>
            The LMS is built to make teaching and learning easier for everyone, from the littlest learners to college faculty to business leaders. Learn more about how LMS works with your institution.
          </p>
        </div>
        <div className="cta-button">
          <button className="connect-button" onClick={handleConnectClick}>
            LET'S CONNECT
          </button>
        </div>
      </section>
    </div>
  );
};

export default IntroPage;