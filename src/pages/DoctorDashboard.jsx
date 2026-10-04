import { Link } from "react-router-dom";
import "./MyFitPages.css";

function DoctorDashboard() {
  return (
    <div className="doctor-shell">
      <header className="doctor-topbar">
        <div>
          <span className="eyebrow">DOCTOR PORTAL</span>
          <div className="brand-mark">MyFit<span>.</span></div>
        </div>

        <nav className="top-nav">
          <Link to="/dashboard">Patient view</Link>
          <Link to="/session">Live session</Link>
        </nav>
      </header>

      <main className="doctor-content">
        <section className="doctor-header card">
          <div>
            <h1>Clinician view</h1>
            <p>Movement measurements will appear here when session history is available.</p>
          </div>
        </section>

        <section className="clinician-empty">
          <h2>No session data yet</h2>
          <p>Run a movement check to generate pose landmarks and movement measurements.</p>
        </section>
      </main>
    </div>
  );
}

export default DoctorDashboard;
