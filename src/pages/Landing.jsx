import Navbar from "../components/Navbar";
import {
  Languages,
  ShieldCheck,
  HeartPulse,
  ArrowRight
} from "lucide-react";

import "./Landing.css";

function HeroIllustration() {
  return (
    <div className="hero-illustration">
      <div className="sun-circle circle-one"></div>
      <div className="sun-circle circle-two"></div>
      <div className="sun-circle circle-three"></div>

      <div className="sun"></div>

      <svg
        className="human-figure"
        viewBox="0 0 220 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="110" cy="45" r="17" stroke="#12303A" strokeWidth="6" />

        <path
          d="M110 62 V165"
          stroke="#12303A"
          strokeWidth="7"
          strokeLinecap="round"
        />

        <path
          d="M110 88 L65 120 L155 120 L110 88"
          stroke="#12303A"
          strokeWidth="7"
          strokeLinejoin="round"
        />

        <path
          d="M110 165 L70 250"
          stroke="#12303A"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d="M110 165 L150 250"
          stroke="#12303A"
          strokeWidth="8"
          strokeLinecap="round"
        />

        <path
          d="M110 165 L110 250"
          stroke="#12303A"
          strokeWidth="7"
        />

        <circle cx="65" cy="120" r="7" fill="#9DBFB3" />
        <circle cx="155" cy="120" r="7" fill="#9DBFB3" />
      </svg>

      <div className="illustration-ground"></div>
    </div>
  );
}

function Landing() {
  return (
    <div className="landing-page">

      <Navbar />

      <main>

        {/* HERO SECTION */}

        <section className="hero-section">

          <div className="hero-content">

            <span className="hero-tag">
              YOUR PERSONAL RECOVERY COMPANION
            </span>

            <h1>
              Heal at your own pace,
              <br />
              with a guide in every
              <br />
              <span>session.</span>
            </h1>

            <p className="hero-description">
              MyFit watches your form through your camera and
              coaches you gently in English, Hindi or Punjabi.
            </p>

            <div className="hero-buttons">

              <a href="/login" className="primary-btn">
                Start your first session
                <ArrowRight size={18} />
              </a>

              <a href="#how-it-works" className="secondary-btn">
                See how it works
              </a>

            </div>

          </div>

          <div className="hero-visual">
            <HeroIllustration />
          </div>

        </section>

        {/* FEATURES SECTION */}

        <section className="features-section" id="how-it-works">

          <div className="feature-card">

            <div className="feature-icon">
              <Languages />
            </div>

            <div>
              <h3>Coaching in your language</h3>
              <p>
                Voice and text cues in English, Hindi and Punjabi.
              </p>
            </div>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              <ShieldCheck />
            </div>

            <div>
              <h3>Your privacy comes first</h3>
              <p>
                Only joint angles and scores are saved.
                Your video stays on your device.
              </p>
            </div>

          </div>

          <div className="feature-card" id="doctors">

            <div className="feature-icon">
              <HeartPulse />
            </div>

            <div>
              <h3>Your doctor stays connected</h3>
              <p>
                Progress and feedback in one place.
              </p>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Landing;