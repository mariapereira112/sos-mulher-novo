import { useNavigate } from "react-router-dom";

export default function Restricted() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
      <h2 style={{ fontSize: 26, fontWeight: 700, color: "var(--primary)", marginBottom: 12 }}>Acesso Restrito</h2>
      <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
        Este aplicativo foi desenvolvido exclusivamente para mulheres e pessoas não-binárias em situação de vulnerabilidade.
      </p>
      <button className="btn-ghost" style={{ maxWidth: 200 }} onClick={() => navigate("/onboarding")}>
        Voltar
      </button>
    </div>
  );
}
