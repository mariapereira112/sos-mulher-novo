import React, { createContext, useContext, useState, useEffect } from "react";

interface UserContextValue {
  userId: number | null;
  userName: string;
  setSession: (id: number, name: string) => void;
  clearSession: () => void;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  userName: "",
  setSession: () => {},
  clearSession: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(() => {
    const v = localStorage.getItem("userId");
    return v ? Number(v) : null;
  });
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") ?? "");

  const setSession = (id: number, name: string) => {
    localStorage.setItem("userId", String(id));
    localStorage.setItem("userName", name);
    setUserId(id);
    setUserName(name);
  };

  const clearSession = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setUserId(null);
    setUserName("");
  };

  return (
    <UserContext.Provider value={{ userId, userName, setSession, clearSession }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
