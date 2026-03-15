import { Link, NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/careers", label: "Careers" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/dashboard", label: "Dashboard" }
];

export default function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="container row-between">
          <Link to="/" className="brand">Rababa Games</Link>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="container content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container row-between">
          <p>Rababa Games</p>
          <p>Story-rich games, built for long-term play.</p>
        </div>
      </footer>
    </div>
  );
}
