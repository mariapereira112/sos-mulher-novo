import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { listPosts, createPost, deletePost } from "../api";
import type { CommunityPost } from "../types";

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default function Community() {
  const { userId, userName } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    listPosts().then((p) => setPosts(p as CommunityPost[])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handlePost = async () => {
    if (!content.trim()) { setError("Escreva algo antes de publicar."); return; }
    if (!userId) return;
    setPosting(true);
    setError("");
    try {
      await createPost(userId, userName || "Usuária", content.trim());
      setContent("");
      load();
    } catch {
      setError("Erro ao publicar. Tente novamente.");
    } finally { setPosting(false); }
  };

  const handleDelete = async (id: number) => {
    await deletePost(id).catch(() => {});
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h2 className="section-title">Comunidade</h2>

      {/* Compose */}
      <div style={{ padding: "0 20px 20px" }}>
        <div className="card">
          <textarea
            rows={3}
            placeholder="Compartilhe sua experiência ou dica de segurança…"
            value={content}
            onChange={e => { setContent(e.target.value); setError(""); }}
            style={{ resize: "none", marginBottom: 10 }}
          />
          {error && <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button className="btn-primary" onClick={handlePost} disabled={posting}>
            {posting ? <span className="spinner"/> : "Publicar"}
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 32 }}><span className="spinner"/></div>}

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "var(--text-secondary)" }}>Nenhuma publicação ainda. Seja a primeira!</p>
        </div>
      )}

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {posts.map((p) => (
          <div key={p.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{p.userName}</p>
                <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>{fmtDate(p.createdAt)}</p>
              </div>
              {p.userId === userId && (
                <button onClick={() => handleDelete(p.id)} style={{
                  background: "none", border: "none", color: "var(--text-secondary)",
                  cursor: "pointer", fontSize: 16, padding: "0 4px",
                }}>🗑</button>
              )}
            </div>
            <p style={{ color: "var(--text)", lineHeight: 1.6, fontSize: 15 }}>{p.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
