import { NavLink } from "react-router-dom";

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#F2A93B" strokeWidth="6" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="#49B3A6" strokeWidth="5" />
    </svg>
  );
}

export default function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <BrandMark />
          DoorStep
        </NavLink>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Look up
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Register a home
          </NavLink>
          <NavLink to="/sms-fallback" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            SMS fallback
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
