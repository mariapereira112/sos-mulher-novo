import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listAlerts, resolveAlert } from "../api";
import type { Alert } from "../types";

const STATUS_MAP: Record<Alert["status"], { label: string; cls: string }> = {
  pending:             { label: "Pendente",        cls: "badge-pending" },
  sms_sent:            { label: "SMS Enviado",      cls: "badge-sms" },
  calling_cloud:       { label: "Ligando…",         cls: "badge-calling" },
  resolved_by_contact: { label: "Resolvido",        cls: "badge-resolved" },
  cancelled:           { label: "Cancelado",        cls: "badge-cancelled" },
};

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default function History() {
  const { userId } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!userId) return;
    setLoading(true);
    listAlerts(userId)
      .then((a) => setAlerts(a as Alert[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [userId]);

  const handleResolve = async (id: number) => {
    await resolveAlert(id).catch(() => {});
    load();
  };

  return (
    <div>
      <h2 className="section-title">Histórico de Alertas</h2>

      {loading && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <span className="spinner"/>
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <p style={{ color: "var(--text-secondary)" }}>Nenhum alerta registrado ainda.</p>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>
            Quando você acionar o SOS, o histórico aparecerá aqui.
          </p>
        </div>
      )}

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((a) => {
          const st = STATUS_MAP[a.status] ?? { label: a.status, cls: "badge-pending" };
          return (
            <div key={a.id} className="card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Alerta #{a.id}</span>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
                🕐 {fmtDate(a.createdAt)}
              </p>
              {a.latitude && (
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
                  📍 {a.latitude.toFixed(5)}, {a.longitude?.toFixed(5)}
                </p>
              )}
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                ⏱ Timer: {a.timerDuration}s
              </p>
              {(a.status === "sms_sent" || a.status === "calling_cloud") && (
                <button
                  onClick={() => handleResolve(a.id)}
                  style={{ marginTop: 12, padding: "8px 14px", fontSize: 13, borderRadius: 8,
                           background: "var(--success-dim)", color: "var(--success)",
                           border: "1px solid var(--success)", cursor: "pointer" }}>
                  ✓ Marcar como resolvido
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
