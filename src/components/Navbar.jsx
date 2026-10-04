import { useState } from "react";
import { Menu, X } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <a href="/" className="nav-logo">
        MyFit<span>.</span>
      </a>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
          How it works
        </a>

        <a href="#doctors" onClick={() => setMenuOpen(false)}>
          For doctors
        </a>

        <a href="/login" className="nav-login">
          Log in
        </a>
      </div>

      <button
        className="mobile-menu"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
    </nav>
  );
}

export default Navbar;