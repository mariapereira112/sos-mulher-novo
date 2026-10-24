import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const USER_ID_KEY = "@sos_mulher_user_id";

interface UserContextValue {
  userId: number | null;
  userName: string | null;
  isLoading: boolean;
  setUserSession: (id: number, name: string) => Promise<void>;
  clearSession: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  userName: null,
  isLoading: true,
  setUserSession: async () => {},
  clearSession: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_ID_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { id: number; name: string };
          setUserId(parsed.id);
          setUserName(parsed.name);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setUserSession = useCallback(async (id: number, name: string) => {
    await AsyncStorage.setItem(USER_ID_KEY, JSON.stringify({ id, name }));
    setUserId(id);
    setUserName(name);
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem(USER_ID_KEY);
    setUserId(null);
    setUserName(null);
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, isLoading, setUserSession, clearSession }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
