import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "pt-BR" | "en" | "es";

const LANGUAGE_KEY = "@sos_mulher_language";

const strings: Record<Language, Record<string, string>> = {
  "pt-BR": {
    "tabs.history": "Histórico",
    "tabs.community": "Comunidade",
    "tabs.sos": "SOS",
    "tabs.contacts": "Contatos",
    "tabs.profile": "Perfil",
    "profile.title": "Perfil",
    "profile.myData": "Meus Dados",
    "profile.accountAccess": "Conta e Acesso",
    "profile.permissions": "Permissões",
    "profile.accessibility": "Acessibilidade",
    "profile.advancedSecurity": "Segurança Avançada",
    "profile.sosTimer": "Temporizador SOS",
    "profile.rateApp": "Avalie o App",
    "profile.notifications": "Notificações",
    "profile.helpInfo": "Ajuda e Informações",
    "profile.aboutApp": "Sobre o App",
    "profile.logout": "Sair da conta",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Excluir",
    "common.confirm": "Confirmar",
    "common.close": "Fechar",
    "common.loading": "Carregando…",
    "common.error": "Erro",
    "common.success": "Sucesso",
    "common.add": "Adicionar",
    "common.back": "Voltar",
  },
  en: {
    "tabs.history": "History",
    "tabs.community": "Community",
    "tabs.sos": "SOS",
    "tabs.contacts": "Contacts",
    "tabs.profile": "Profile",
    "profile.title": "Profile",
    "profile.myData": "My Data",
    "profile.accountAccess": "Account & Access",
    "profile.permissions": "Permissions",
    "profile.accessibility": "Accessibility",
    "profile.advancedSecurity": "Advanced Security",
    "profile.sosTimer": "SOS Timer",
    "profile.rateApp": "Rate the App",
    "profile.notifications": "Notifications",
    "profile.helpInfo": "Help & Information",
    "profile.aboutApp": "About the App",
    "profile.logout": "Sign out",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.loading": "Loading…",
    "common.error": "Error",
    "common.success": "Success",
    "common.add": "Add",
    "common.back": "Back",
  },
  es: {
    "tabs.history": "Historial",
    "tabs.community": "Comunidad",
    "tabs.sos": "SOS",
    "tabs.contacts": "Contactos",
    "tabs.profile": "Perfil",
    "profile.title": "Perfil",
    "profile.myData": "Mis Datos",
    "profile.accountAccess": "Cuenta y Acceso",
    "profile.permissions": "Permisos",
    "profile.accessibility": "Accesibilidad",
    "profile.advancedSecurity": "Seguridad Avanzada",
    "profile.sosTimer": "Temporizador SOS",
    "profile.rateApp": "Calificar App",
    "profile.notifications": "Notificaciones",
    "profile.helpInfo": "Ayuda e Información",
    "profile.aboutApp": "Sobre la App",
    "profile.logout": "Cerrar sesión",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.confirm": "Confirmar",
    "common.close": "Cerrar",
    "common.loading": "Cargando…",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.add": "Agregar",
    "common.back": "Volver",
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "pt-BR",
  setLanguage: async () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("pt-BR");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored === "pt-BR" || stored === "en" || stored === "es") {
          setLanguageState(stored as Language);
        }
      } catch {}
    })();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string =>
      strings[language]?.[key] ?? strings["pt-BR"][key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
