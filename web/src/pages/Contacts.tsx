import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listContacts, createContact, deleteContact } from "../api";
import type { EmergencyContact } from "../types";

const HELPLINES = [
  { number: "180", label: "Central da Mulher",     icon: "👩" },
  { number: "190", label: "Polícia Militar",        icon: "🚔" },
  { number: "192", label: "SAMU — Emergência Médica", icon: "🚑" },
];

export default function Contacts() {
  const { userId } = useUser();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", relationship: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!userId) return;
    setLoading(true);
    listContacts(userId).then((c) => setContacts(c as EmergencyContact[])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [userId]);

  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.relationship.trim()) {
      setError("Preencha todos os campos."); return;
    }
    if (!userId) return;
    setSaving(true);
    try {
      await createContact(userId, { name: form.name.trim(), phone: form.phone.trim(), relationship: form.relationship.trim() });
      setForm({ name: "", phone: "", relationship: "" });
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message ?? "Erro ao salvar."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!userId) return;
    await deleteContact(userId, id).catch(() => {});
    setContacts((c) => c.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h2 className="section-title">Contatos</h2>

      {/* Linhas de ajuda */}
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, textTransform: "uppercase",
                    letterSpacing: 0.5, marginBottom: 10 }}>Linhas oficiais</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {HELPLINES.map(h => (
            <a key={h.number} href={`tel:${h.number}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", gap: 14,
                                            background: "var(--primary-dim)", borderColor: "var(--primary)" }}>
                <span style={{ fontSize: 28 }}>{h.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: "var(--primary)" }}>{h.number}</p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{h.label}</p>
                </div>
                <span style={{ fontSize: 20 }}>📞</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Meus contatos */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: 0.5 }}>
            Meus contatos ({contacts.length}/5)
          </p>
          {contacts.length < 5 && (
            <button onClick={() => setShowForm(!showForm)} style={{
              background: "var(--primary-dim)", color: "var(--primary)", border: "1px solid var(--primary)",
              borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
            }}>{showForm ? "Cancelar" : "+ Adicionar"}</button>
          )}
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Nome *" value={form.name} onChange={e => set("name", e.target.value)}/>
              <input placeholder="Telefone *" value={form.phone} onChange={e => set("phone", e.target.value)} type="tel"/>
              <input placeholder="Relação (ex: Mãe, Amiga) *" value={form.relationship} onChange={e => set("relationship", e.target.value)}/>
              {error && <p style={{ color: "var(--primary)", fontSize: 13 }}>{error}</p>}
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? <span className="spinner"/> : "Salvar contato"}
              </button>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: "center", padding: 24 }}><span className="spinner"/></div>}

        {!loading && contacts.length === 0 && (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Nenhum contato de emergência cadastrado ainda.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {contacts.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--card-elevated)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                👤
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{c.phone} · {c.relationship}</p>
              </div>
              <button onClick={() => handleDelete(c.id)} style={{
                background: "none", border: "none", color: "var(--text-secondary)",
                cursor: "pointer", fontSize: 18, padding: "4px 8px", flexShrink: 0,
              }}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
