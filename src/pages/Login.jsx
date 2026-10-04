import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldCheck, HeartPulse, Smartphone } from "lucide-react";
import "./MyFitPages.css";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Your video stays on your device while only movement scores are saved."
  },
  {
    icon: HeartPulse,
    title: "Recovery coach",
    text: "Gentle voice cues adapt to your form in real time."
  },
  {
    icon: Smartphone,
    title: "Anywhere access",
    text: "Continue sessions from your phone, tablet or home setup."
  }
];

const defaultForm = {
  name: "",
  email: "",
  password: "",
};

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(isRegistering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("myfit-token", data.token);
      localStorage.setItem("myfit-user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-container">
        <div className="auth-panel auth-panel-soft">
          <div className="brand-block">
            <div className="brand-mark">MyFit<span>.</span></div>
            <span className="eyebrow">YOUR RECOVERY COMPANION</span>
          </div>

          <h1>{isRegistering ? "Create account" : "Welcome back"}</h1>
          <p className="muted-copy">
            {isRegistering
              ? "Create your account to start your guided rehabilitation plan."
              : "Sign in to continue your guided rehabilitation plan and track progress."}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegistering && (
              <label className="input-field">
                <span>Name</span>
                <div className="input-wrap">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </label>
            )}

            <label className="input-field">
              <span>Email</span>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete={isRegistering ? "email" : "username"}
                  required
                />
              </div>
            </label>

            <label className="input-field">
              <span>Password</span>
              <div className="input-wrap">
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  minLength={isRegistering ? 8 : undefined}
                  required
                />
              </div>
            </label>

            {!isRegistering && (
              <div className="auth-row">
                <label className="checkbox-wrap">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <a href="#">Forgot password?</a>
              </div>
            )}

            {error ? <div className="auth-error">{error}</div> : null}

            <button type="submit" className="primary-btn auth-btn" disabled={loading}>
              {loading ? (isRegistering ? "Creating account..." : "Signing in...") : (isRegistering ? "Create account" : "Sign in")}
            </button>
          </form>

          <div className="auth-footer">
            <span>{isRegistering ? "Already have an account?" : "New here?"}</span>
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setIsRegistering((current) => !current);
                setError("");
              }}
            >
              {isRegistering ? "Sign in" : "Create account"}
            </button>
          </div>
        </div>

        <div className="auth-panel auth-panel-visual">
          <div className="glass-card">
            <span className="mini-label">Today’s plan</span>
            <h2>Mobility + strength</h2>
            <div className="session-badge">3 exercises • 18 minutes</div>

            <div className="mini-chart">
              <span style={{ height: "36%" }} />
              <span style={{ height: "52%" }} />
              <span style={{ height: "74%" }} />
              <span style={{ height: "90%" }} />
              <span style={{ height: "66%" }} />
              <span style={{ height: "92%" }} />
            </div>
          </div>

          <div className="trust-list">
            {trustPoints.map(({ icon: Icon, title, text }) => (
              <div key={title} className="trust-item">
                <div className="trust-icon">
                  <Icon size={16} />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
