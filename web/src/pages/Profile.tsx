import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getUser, getSettings, upsertSettings, updateEmail, updatePassword } from "../api";
import type { User, Settings } from "../types";

function Accordion({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="accordion-header" onClick={() => setOpen(!open)}>
        <span style={{ fontWeight: 600 }}>{icon} {title}</span>
        <span style={{ color: "var(--text-secondary)", transition: "transform 0.2s",
                       transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="switch-slider"/>
    </label>
  );
}

export default function Profile() {
  const { userId, userName, clearSession } = useUser();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [emailForm, setEmailForm] = useState({ email: "", error: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", error: "" });

  useEffect(() => {
    if (!userId) return;
    getUser(userId).then(u => setUser(u as User)).catch(() => {});
    getSettings(userId).then(s => setSettings(s as Settings)).catch(() => {});
  }, [userId]);

  const saveSetting = async (key: string, val: unknown) => {
    if (!userId) return;
    const updated: any = await upsertSettings(userId, { [key]: val }).catch(() => null);
    if (updated) setSettings(updated);
  };

  const handleEmailSave = async () => {
    if (!emailForm.email.trim()) { setEmailForm(f => ({ ...f, error: "E-mail obrigatório." })); return; }
    if (!userId) return;
    setSaving(true);
    try {
      await updateEmail(userId, emailForm.email.trim());
      setMsg("E-mail atualizado com sucesso.");
      setEmailForm({ email: "", error: "" });
    } catch (e: any) { setEmailForm(f => ({ ...f, error: e.message })); }
    finally { setSaving(false); }
  };

  const handlePwSave = async () => {
    if (!pwForm.current || !pwForm.next) { setPwForm(f => ({ ...f, error: "Preencha os dois campos." })); return; }
    if (!userId) return;
    setSaving(true);
    try {
      await updatePassword(userId, pwForm.current, pwForm.next);
      setMsg("Senha atualizada com sucesso.");
      setPwForm({ current: "", next: "", error: "" });
    } catch (e: any) { setPwForm(f => ({ ...f, error: e.message })); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { clearSession(); navigate("/login"); };

  return (
    <div style={{ padding: "0 20px 20px" }}>
      <h2 className="section-title" style={{ padding: "24px 0 0" }}>Perfil</h2>

      {/* Avatar card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, marginTop: 8 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--primary-dim)",
                      border: "2px solid var(--primary)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
          👤
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18 }}>{userName || user?.name}</p>
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user?.phone}</p>
          {user?.email && <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.email}</p>}
        </div>
      </div>

      {msg && (
        <div className="card" style={{ background: "var(--success-dim)", borderColor: "var(--success)",
                                       marginBottom: 14, textAlign: "center" }}>
          <p style={{ color: "var(--success)", fontSize: 14 }}>✓ {msg}</p>
        </div>
      )}

      {/* Dados Pessoais */}
      <Accordion title="Dados Pessoais" icon="👤">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Novo e-mail</p>
            <input placeholder="Digite o novo e-mail" value={emailForm.email}
                   onChange={e => setEmailForm(f => ({ ...f, email: e.target.value, error: "" }))}/>
            {emailForm.error && <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 4 }}>{emailForm.error}</p>}
            <button className="btn-primary" style={{ marginTop: 10, fontSize: 14 }}
                    onClick={handleEmailSave} disabled={saving}>
              Salvar e-mail
            </button>
          </div>
          <div className="divider"/>
          <div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>Alterar senha</p>
            <input placeholder="Senha atual" type="password" value={pwForm.current}
                   onChange={e => setPwForm(f => ({ ...f, current: e.target.value, error: "" }))}
                   style={{ marginBottom: 8 }}/>
            <input placeholder="Nova senha" type="password" value={pwForm.next}
                   onChange={e => setPwForm(f => ({ ...f, next: e.target.value, error: "" }))}/>
            {pwForm.error && <p style={{ color: "var(--primary)", fontSize: 13, marginTop: 4 }}>{pwForm.error}</p>}
            <button className="btn-primary" style={{ marginTop: 10, fontSize: 14 }}
                    onClick={handlePwSave} disabled={saving}>
              Salvar senha
            </button>
          </div>
        </div>
      </Accordion>

      {/* Permissões */}
      {settings && (
        <Accordion title="Permissões" icon="🔐">
          <div>
            <div className="switch-row">
              <span style={{ fontSize: 14 }}>📍 GPS / Localização</span>
              <Switch checked={settings.gpsEnabled} onChange={v => saveSetting("gpsEnabled", v)}/>
            </div>
            <div className="divider"/>
            <div className="switch-row">
              <span style={{ fontSize: 14 }}>🔔 Notificações</span>
              <Switch checked={settings.notificationsEnabled} onChange={v => saveSetting("notificationsEnabled", v)}/>
            </div>
            <div className="divider"/>
            <div className="switch-row">
              <span style={{ fontSize: 14 }}>📷 Câmera / Microfone</span>
              <Switch checked={settings.cameraMicEnabled} onChange={v => saveSetting("cameraMicEnabled", v)}/>
            </div>
          </div>
        </Accordion>
      )}

      {/* Segurança Avançada */}
      {settings && (
        <Accordion title="Segurança Avançada" icon="🛡️">
          <div>
            <div className="switch-row">
              <div>
                <p style={{ fontSize: 14 }}>Modo Discreto</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Ativa SOS sem sons ou vibrações</p>
              </div>
              <Switch checked={settings.discreteMode} onChange={v => saveSetting("discreteMode", v)}/>
            </div>
            <div className="divider"/>
            <div className="switch-row">
              <div>
                <p style={{ fontSize: 14 }}>Biometria</p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Desbloqueio por digital/face</p>
              </div>
              <Switch checked={settings.biometricsEnabled} onChange={v => saveSetting("biometricsEnabled", v)}/>
            </div>
            <div className="divider"/>
            <div>
              <p style={{ fontSize: 14, marginBottom: 8 }}>Código de Coerção</p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                Digite este código se estiver sendo forçada — aciona SOS silencioso
              </p>
              <input placeholder="Digite o código secreto" defaultValue={settings.coercionCode ?? ""}
                     onBlur={e => saveSetting("coercionCode", e.target.value)}/>
            </div>
          </div>
        </Accordion>
      )}

      {/* Temporizador SOS */}
      {settings && (
        <Accordion title="Temporizador SOS" icon="⏱️">
          <p style={{ fontSize: 14, marginBottom: 12, color: "var(--text-secondary)" }}>
            Tempo de segurar o botão antes de acionar:
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {[{"label": "1s", "val": "1000"}, {"label": "1,5s", "val": "1500"}, {"label": "3s", "val": "3000"}].map(o => (
              <button key={o.val} onClick={() => saveSetting("sosTimer", o.val)} style={{
                flex: 1, padding: "10px 8px", fontSize: 14, borderRadius: 10,
                background: settings.sosTimer === o.val ? "var(--primary)" : "var(--card-elevated)",
                color: settings.sosTimer === o.val ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${settings.sosTimer === o.val ? "var(--primary)" : "var(--border)"}`,
                cursor: "pointer",
              }}>{o.label}</button>
            ))}
          </div>
        </Accordion>
      )}

      {/* Logout */}
      <button onClick={handleLogout} className="btn-danger"
              style={{ width: "100%", marginTop: 24, padding: "14px 20px" }}>
        🚪 Sair da conta
      </button>
    </div>
  );
}
