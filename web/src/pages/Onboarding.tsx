import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, completeOnboarding } from "../api";
import { useUser } from "../context/UserContext";

const GENDERS = ["Mulher", "Não-binária", "Homem"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setSession } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", phone: "", cpf: "", email: "",
    gender: "", password: "",
  });

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  }

  async function handleRegister() {
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Nome e telefone são obrigatórios."); return;
    }
    if (!form.gender) { setError("Selecione seu gênero."); return; }
    setLoading(true);
    try {
      const user: any = await createUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        gender: form.gender,
        password: form.password || undefined,
      });

      if (user?.error === "restricted") { navigate("/restricted"); return; }

      await completeOnboarding(user.id);
      setSession(user.id, user.name);
      navigate("/");
    } catch (err: any) {
      if (err?.status === 403) { navigate("/restricted"); return; }
      setError(err.message ?? "Erro ao criar conta.");
    } finally { setLoading(false); }
  }

  const steps = [
    // Step 0 — Intro
    <div key="intro" className="onboarding-wrap">
      <div className="progress-bar">
        {[0,1,2].map(i => <div key={i} className={`progress-dot ${i <= step ? "active" : ""}`}/>)}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 24, textAlign: "center" }}>🛡️</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, marginBottom: 16, textAlign: "center" }}>
          SOS Mulher
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 16, lineHeight: 1.6, textAlign: "center", marginBottom: 40 }}>
          Um botão de emergência inteligente que alerta seus contatos e registra cada ocorrência com segurança.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn-primary" onClick={() => setStep(1)}>Começar →</button>
        <button className="btn-ghost" onClick={() => navigate("/login")}>Já tenho conta</button>
      </div>
    </div>,

    // Step 1 — Aviso
    <div key="aviso" className="onboarding-wrap">
      <div className="progress-bar">
        {[0,1,2].map(i => <div key={i} className={`progress-dot ${i <= step ? "active" : ""}`}/>)}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 24, textAlign: "center" }}>⚠️</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>Aviso importante</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>
            Este aplicativo foi desenvolvido para situações de emergência real. O acionamento indevido do SOS 
            pode causar preocupação desnecessária nas pessoas que você ama.
          </p>
        </div>
        <div className="card" style={{ background: "var(--primary-dim)", borderColor: "var(--primary)" }}>
          <p style={{ color: "var(--primary)", lineHeight: 1.7, fontSize: 15, fontWeight: 500 }}>
            Em situação de perigo imediato, acione também o <strong>190</strong> (Polícia) 
            ou <strong>180</strong> (Central da Mulher).
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn-primary" onClick={() => setStep(2)}>Li e entendi →</button>
        <button className="btn-ghost" onClick={() => setStep(0)}>Voltar</button>
      </div>
    </div>,

    // Step 2 — Cadastro
    <div key="cadastro" className="onboarding-wrap">
      <div className="progress-bar">
        {[0,1,2].map(i => <div key={i} className={`progress-dot ${i <= step ? "active" : ""}`}/>)}
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Crie sua conta</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Seus dados ficam salvos localmente no banco de dados.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <input placeholder="Nome completo *" value={form.name} onChange={e => set("name", e.target.value)} />
        <input placeholder="Telefone *" value={form.phone} onChange={e => set("phone", e.target.value)} type="tel" />
        <input placeholder="CPF (opcional)" value={form.cpf} onChange={e => set("cpf", e.target.value)} />
        <input placeholder="E-mail (opcional)" value={form.email} onChange={e => set("email", e.target.value)} type="email" />
        <input placeholder="Senha (opcional)" value={form.password} onChange={e => set("password", e.target.value)} type="password" />
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 10 }}>Gênero *</p>
          <div style={{ display: "flex", gap: 8 }}>
            {GENDERS.map(g => (
              <button key={g} onClick={() => set("gender", g)} style={{
                flex: 1, padding: "10px 8px", fontSize: 13, borderRadius: 10,
                background: form.gender === g ? "var(--primary)" : "var(--card-elevated)",
                color: form.gender === g ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${form.gender === g ? "var(--primary)" : "var(--border)"}`,
              }}>{g}</button>
            ))}
          </div>
        </div>
        {error && <p style={{ color: "var(--primary)", fontSize: 14 }}>⚠ {error}</p>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <button className="btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? <span className="spinner"/> : "Criar conta e entrar →"}
        </button>
        <button className="btn-ghost" onClick={() => setStep(1)}>Voltar</button>
      </div>
    </div>,
  ];

  return <>{steps[step]}</>;
}
