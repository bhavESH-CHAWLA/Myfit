
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Session from "./pages/Session";
import DoctorDashboard from "./pages/DoctorDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session" element={<Session />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;