import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Layout from "./components/Layout";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Restricted from "./pages/Restricted";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Community from "./pages/Community";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  if (!userId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useUser();
  if (userId) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <UserProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/onboarding" element={<PublicRoute><Onboarding /></PublicRoute>} />
          <Route path="/login"      element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/restricted" element={<Restricted />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/history"   element={<History />} />
            <Route path="/community" element={<Community />} />
            <Route path="/contacts"  element={<Contacts />} />
            <Route path="/profile"   element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </UserProvider>
  );
}
