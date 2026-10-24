import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { createAlert, cancelAlert, listContacts } from "../api";

const HOLD_MS = 1500;

type Phase = "idle" | "holding" | "active" | "cancelled";

export default function Dashboard() {
  const { userId, userName } = useUser();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [alertId, setAlertId] = useState<number | null>(null);
  const [contactCount, setContactCount] = useState(0);
  const [gpsOk] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (userId) listContacts(userId).then((c: any) => setContactCount(c.length)).catch(() => {});
  }, [userId]);

  const animate = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(elapsed / HOLD_MS, 1);
    setProgress(pct);
    if (pct < 1) rafRef.current = requestAnimationFrame(animate);
  }, []);

  const startHold = () => {
    if (phase !== "idle") return;
    setPhase("holding");
    setError("");
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animate);
    holdTimer.current = setTimeout(fireAlert, HOLD_MS);
  };

  const releaseHold = () => {
    if (phase !== "holding") return;
    clearTimeout(holdTimer.current!);
    cancelAnimationFrame(rafRef.current!);
    setPhase("idle");
    setProgress(0);
  };

  const fireAlert = async () => {
    cancelAnimationFrame(rafRef.current!);
    setProgress(1);
    setPhase("active");
    setSuccessMsg("");
    try {
      let lat: number | undefined, lng: number | undefined;
      if (navigator.geolocation) {
        await new Promise<void>((res) =>
          navigator.geolocation.getCurrentPosition(
            (p) => { lat = p.coords.latitude; lng = p.coords.longitude; res(); },
            () => res(), { timeout: 3000 }
          )
        );
      }
      const alert: any = await createAlert(userId!, lat, lng, 30);
      setAlertId(alert.id);
      setSuccessMsg(`🚨 Alerta #${alert.id} disparado! Contatos notificados.`);
    } catch (e: any) {
      setError("Falha ao disparar alerta. Verifique o servidor.");
      setPhase("idle");
      setProgress(0);
    }
  };

  const handleCancel = async () => {
    if (alertId) await cancelAlert(alertId).catch(() => {});
    setPhase("idle");
    setProgress(0);
    setAlertId(null);
    setSuccessMsg("");
  };

  const radius = 70;
  const circ = 2 * Math.PI * radius;

  return (
    <div style={{ padding: "0 20px 20px" }}>
      {/* Header */}
      <div style={{ paddingTop: 56, marginBottom: 28 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Bem-vinda,</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{userName || "Usuária"} 👋</h1>
        <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6,
                      background: "var(--primary-dim)", borderRadius: 20, padding: "4px 12px",
                      border: "1px solid var(--primary)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)" }}/>
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>SOS MULHER</span>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24 }}>{gpsOk ? "📍" : "📵"}</div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>GPS</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: gpsOk ? "var(--success)" : "var(--warning)" }}>
            {gpsOk ? "Ativo" : "Inativo"}
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24 }}>👥</div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Contatos</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: contactCount > 0 ? "var(--success)" : "var(--warning)" }}>
            {contactCount} cadastrado{contactCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* SOS Button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center" }}>
          {phase === "idle" && "Segure o botão por 1,5s para acionar o SOS"}
          {phase === "holding" && "Continue segurando…"}
          {phase === "active" && "🚨 ALERTA ATIVO"}
        </p>

        {/* Ring button */}
        <div
          style={{ position: "relative", cursor: phase === "active" ? "default" : "pointer", userSelect: "none" }}
          onMouseDown={phase === "idle" ? startHold : undefined}
          onMouseUp={phase === "holding" ? releaseHold : undefined}
          onMouseLeave={phase === "holding" ? releaseHold : undefined}
          onTouchStart={phase === "idle" ? startHold : undefined}
          onTouchEnd={phase === "holding" ? releaseHold : undefined}
        >
          <svg width={180} height={180} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={90} cy={90} r={radius} fill="none" stroke="var(--border)" strokeWidth={6}/>
            <circle
              cx={90} cy={90} r={radius} fill="none"
              stroke="var(--primary)" strokeWidth={6}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: phase === "idle" ? "stroke-dashoffset 0.1s" : "none" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: phase === "active" ? "var(--primary)" : "var(--card)",
            borderRadius: "50%", margin: 14,
            boxShadow: phase === "active" ? "0 0 40px var(--primary-glow)" : "0 0 20px rgba(0,0,0,0.5)",
            transition: "background 0.3s, box-shadow 0.3s",
          }}>
            <span style={{ fontSize: 36 }}>🚨</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 4,
                           color: phase === "active" ? "#fff" : "var(--primary)" }}>
              {phase === "active" ? "ATIVO" : "SOS"}
            </span>
          </div>
        </div>

        {phase === "active" && (
          <button onClick={handleCancel} className="btn-danger" style={{ width: 180, padding: "12px 20px" }}>
            Cancelar alerta
          </button>
        )}

        {successMsg && (
          <div className="card" style={{ background: "var(--success-dim)", borderColor: "var(--success)",
                                        textAlign: "center", width: "100%" }}>
            <p style={{ color: "var(--success)", fontSize: 14, fontWeight: 600 }}>{successMsg}</p>
          </div>
        )}
        {error && <p style={{ color: "var(--primary)", fontSize: 14 }}>{error}</p>}
      </div>

      {/* Check-in card */}
      <div className="card">
        <p style={{ fontWeight: 600, marginBottom: 8 }}>✅ Check-in de segurança</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
          Registre sua localização periodicamente para que seus contatos saibam que você está bem.
        </p>
        <button className="btn-ghost" style={{ marginTop: 12, fontSize: 14, padding: "10px 16px" }}>
          Estou bem agora
        </button>
      </div>
    </div>
  );
}
