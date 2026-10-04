import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import "./MyFitPages.css";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("myfit-user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("myfit-token");

    if (!token) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const data = await response.json();
        if (data.user?.id === "demo-user") {
          throw new Error("Create an account to continue.");
        }
        setUser(data.user);
      } catch {
        localStorage.removeItem("myfit-token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="brand-mark">MyFit<span>.</span></div>

        <nav className="top-nav">
          <Link to="/">Home</Link>
          <Link to="/session">Session</Link>
        </nav>

        <div className="user-pill">
          <div className="avatar">{(user?.name || user?.email || "?").charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.name || "Your account"}</strong>
            <small>{user?.email || "Signed in"}</small>
          </div>
        </div>
      </header>

      <main className="dashboard-content movement-home">
        <section className="hero-card card movement-hero">
          <div>
            <span className="eyebrow">MOVEMENT ANALYSIS</span>
            <h1>Check your movement.</h1>
            <p>Start the camera to detect body landmarks and estimate knee movement in real time.</p>
            <div className="hero-actions">
              <Link to="/session" className="primary-btn dashboard-btn">
                Start movement check
                <PlayCircle size={18} />
              </Link>
            </div>
          </div>
        </section>

        <section className="card movement-empty">
          <h2>{loading ? "Loading your account" : "Movement checks"}</h2>
          <p>No movement checks have been saved yet. Your camera analysis runs in the browser and is not uploaded.</p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;