const BASE = "http://localhost:8080/api";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error ?? "Erro desconhecido"), { status: res.status, data });
  return data as T;
}

// ── Usuários ──────────────────────────────────────────────────────────────────
export const createUser = (body: {
  name: string; phone: string; email?: string;
  cpf?: string; gender?: string; password?: string;
}) => req("POST", "/users", body);

export const getUser = (id: number) => req("GET", `/users/${id}`);

export const updateUser = (id: number, body: Partial<{ name: string; phone: string; email: string; cpf: string; gender: string }>) =>
  req("PATCH", `/users/${id}`, body);

export const completeOnboarding = (id: number) => req("POST", `/users/${id}/complete-onboarding`, {});

export const updateEmail = (userId: number, email: string) =>
  req("PUT", "/users/update-email", { userId, email });

export const updatePassword = (userId: number, currentPassword: string, newPassword: string) =>
  req("PUT", "/users/update-password", { userId, currentPassword, newPassword });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (identifier: string, password: string) =>
  req<{ userId: number; userName: string; phone: string }>("POST", "/auth/login", { identifier, password });

export const recoverAccount = (email: string) => req("POST", "/auth/recover", { email });

// ── Alertas ───────────────────────────────────────────────────────────────────
export const createAlert = (userId: number, latitude?: number, longitude?: number, timerDuration = 30) =>
  req("POST", "/alerts", { userId, latitude, longitude, timerDuration });

export const listAlerts = (userId: number) => req("GET", `/alerts/user/${userId}`);

export const resolveAlert = (alertId: number) => req("PUT", `/alerts/${alertId}/resolve`, {});

export const cancelAlert = (alertId: number) => req("POST", `/alerts/${alertId}/cancel`, {});

// ── Contatos ──────────────────────────────────────────────────────────────────
export const listContacts = (userId: number) => req("GET", `/users/${userId}/contacts`);

export const createContact = (userId: number, body: { name: string; phone: string; relationship: string }) =>
  req("POST", `/users/${userId}/contacts`, body);

export const deleteContact = (userId: number, contactId: number) =>
  req("DELETE", `/users/${userId}/contacts/${contactId}`);

// ── Posts ──────────────────────────────────────────────────────────────────────
export const listPosts = () => req("GET", "/posts");

export const createPost = (userId: number, userName: string, content: string) =>
  req("POST", "/posts", { userId, userName, content });

export const deletePost = (postId: number) => req("DELETE", `/posts/${postId}`);

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = (userId: number) => req("GET", `/users/${userId}/settings`);

export const upsertSettings = (userId: number, body: Record<string, unknown>) =>
  req("PUT", `/users/${userId}/settings`, body);
