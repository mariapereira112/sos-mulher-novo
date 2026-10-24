import { Outlet, NavLink, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/history",   icon: "📋", label: "Histórico" },
  { to: "/community", icon: "💬", label: "Comunidade" },
  { to: "/",          icon: "🆘", label: "SOS",       sos: true },
  { to: "/contacts",  icon: "📞", label: "Contatos" },
  { to: "/profile",   icon: "👤", label: "Perfil" },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <>
      <div className="page">
        <Outlet />
      </div>

      <nav className="tab-bar">
        {tabs.map((tab) =>
          tab.sos ? (
            <button
              key={tab.to}
              className="tab-sos-btn"
              onClick={() => navigate("/")}
              title="SOS"
            >
              🚨
            </button>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) => `tab-item${isActive ? " active" : ""}`}
            >
              <span style={{ fontSize: 22 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </>
  );
}
