import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { useUser } from "../context/UserContext";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useUser();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError("Preencha e-mail/nome e senha."); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await login(identifier.trim(), password);
      setSession(res.userId, res.userName);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Erro ao fazer login.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
                  justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🛡️</div>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>SOS Mulher</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>Acesse sua conta</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          placeholder="E-mail ou nome de usuária"
          value={identifier}
          onChange={e => { setIdentifier(e.target.value); setError(""); }}
        />
        <input
          placeholder="Senha"
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        {error && <p style={{ color: "var(--primary)", fontSize: 14 }}>⚠ {error}</p>}
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? <span className="spinner"/> : "Entrar"}
        </button>
        <div className="divider" />
        <button className="btn-ghost" onClick={() => navigate("/onboarding")}>
          Criar nova conta
        </button>
      </div>
    </div>
  );
}
