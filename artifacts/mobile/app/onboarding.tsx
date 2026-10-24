import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  useCreateUser,
  useCompleteOnboarding,
  useLoginUser,
  useRecoverAccount,
} from "@workspace/api-client-react";
import { useUser } from "@/context/UserContext";
import { useColors } from "@/hooks/useColors";

// ─── Constants ───────────────────────────────────────────────────────────────
type Mode = "landing" | "terms" | "login" | "register" | "recover";
type Gender = "Mulher" | "Não-binária / Trans / Outra" | "Homem";

const GENDERS: { id: Gender; symbol: string; color: string }[] = [
  { id: "Mulher", symbol: "♀", color: "#ffd60a" },
  { id: "Não-binária / Trans / Outra", symbol: "⚧", color: "#ebebf5" },
];

const SLIDES = [
  {
    tag: "SEGURANÇA PESSOAL",
    title: "SOS Mulher",
    subtitle: "Segurança na palma da sua mão",
    body: "Toque de emergência, localização GPS em tempo real e rede de proteção — tudo gratuito.",
  },
  {
    tag: "REDE DE PROTEÇÃO",
    title: "Contatos alertados",
    subtitle: "Até 5 pessoas de confiança",
    body: "Seus contatos recebem notificação imediata de SOS com sua localização GPS em tempo real.",
  },
  {
    tag: "DISCRIÇÃO TOTAL",
    title: "Modo disfarce",
    subtitle: "Aparência de app comum",
    body: "Ative o modo disfarce para ocultar o app como um bloco de notas. Discreção total quando você precisa.",
  },
];

const TERMS_TEXT = [
  {
    num: "1",
    title: "Finalidade do Aplicativo",
    body: "O SOS Mulher é um aplicativo de segurança pessoal voltado exclusivamente para mulheres e pessoas em situação de vulnerabilidade. Seu propósito é facilitar o acionamento de ajuda emergencial e a comunicação com contatos de confiança.",
  },
  {
    num: "2",
    title: "Coleta de Dados",
    body: "Coletamos nome, telefone, e-mail, CPF (opcional) e localização GPS somente para fins de funcionamento do serviço de emergência. Seus dados não são comercializados.",
  },
  {
    num: "3",
    title: "Uso responsável",
    body: "O uso inadequado do botão SOS pode sobrecarregar os contatos de emergência e os serviços de segurança. Utilize apenas em situações reais de risco.",
  },
  {
    num: "4",
    title: "Privacidade e senha",
    body: "Sua senha é armazenada de forma criptografada e nunca é acessível por terceiros. Em caso de esquecimento, use a opção \"Redefinir senha\" na tela inicial.",
  },
  {
    num: "5",
    title: "Limitações",
    body: "O aplicativo depende de conexão com a internet e permissão de GPS. Não garantimos funcionamento sem essas condições. Em emergências graves, acione sempre o 190 (Polícia) ou 180 (Central da Mulher).",
  },
  {
    num: "6",
    title: "Aceitação",
    body: "Ao continuar, você confirma que é maior de 18 anos, leu e aceitou estes termos, e que utilizará o aplicativo de forma responsável.",
  },
];

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const COLORS = ["#e63946", "#ff9f0a", "#30d158"];
  const LABELS = ["Fraca", "Média", "Forte"];
  return {
    score,
    color: score > 0 ? COLORS[score - 1]! : "#3a3a3c",
    label: score > 0 ? LABELS[score - 1]! : "",
    checks,
  };
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, color, label, checks } = getStrength(password);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: score > i ? color : "#3a3a3c",
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {label ? (
          <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color }}>
            {label}
          </Text>
        ) : null}
        {(["length", "number", "symbol"] as const).map((k) => (
          <Text
            key={k}
            style={{
              fontSize: 12,
              fontFamily: "Inter_400Regular",
              color: checks[k] ? "#30d158" : "#636366",
            }}
          >
            {k === "length" ? "8+ caracteres" : k === "number" ? "número" : "símbolo"}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setUserSession } = useUser();

  const [mode, setMode] = useState<Mode>("landing");
  const [slide, setSlide] = useState(0);

  // Register fields
  const [gender, setGender] = useState<Gender>("Mulher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [regError, setRegError] = useState("");

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Recover fields
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverMsg, setRecoverMsg] = useState("");
  const [recoverError, setRecoverError] = useState("");

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const cpfRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmPwRef = useRef<TextInput>(null);
  const loginPwRef = useRef<TextInput>(null);

  const createUser = useCreateUser();
  const completeOnboarding = useCompleteOnboarding();
  const loginUser = useLoginUser();
  const recoverAccount = useRecoverAccount();

  const topPad = insets.top > 0 ? insets.top : Platform.OS === "web" ? 44 : 24;
  const botPad = insets.bottom > 0 ? insets.bottom : Platform.OS === "web" ? 24 : 16;

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function goMode(m: Mode) {
    Haptics.selectionAsync();
    setMode(m);
    setRegError("");
    setLoginError("");
    setTermsError("");
    setRecoverMsg("");
    setRecoverError("");
  }

  function nextSlide() {
    Haptics.selectionAsync();
    setSlide((s) => (s + 1) % SLIDES.length);
  }

  async function handleRegister() {
    if (!name.trim() || !phone.trim() || !password.trim()) {
      setRegError("Preencha nome, telefone e senha.");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 11) {
      setRegError("Informe celular com DDD (11 dígitos). Ex: (11) 99999-9999");
      return;
    }
    if (password.length < 8) {
      setRegError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setRegError("As senhas não coincidem.");
      return;
    }
    if (gender === "Homem") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.replace("/restricted");
      return;
    }
    setRegError("");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const user = await createUser.mutateAsync({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          cpf: cpf.trim() || undefined,
          gender,
          password: password.trim(),
        },
      });
      await completeOnboarding.mutateAsync({ userId: user.id });
      await setUserSession(user.id, user.name);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      if (apiErr?.response?.data?.error === "restricted") {
        router.replace("/restricted");
        return;
      }
      setRegError("Erro ao criar conta. Tente novamente.");
    }
  }

  async function handleLogin() {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError("Preencha e-mail/nome e senha.");
      return;
    }
    setLoginError("");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await loginUser.mutateAsync({
        data: { identifier: loginIdentifier.trim(), password: loginPassword.trim() },
      });
      await setUserSession(result.userId, result.userName);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr?.response?.data?.error ?? "Nome ou senha incorretos.";
      setLoginError(msg);
    }
  }

  async function handleRecover() {
    if (!recoverEmail.trim()) {
      setRecoverError("Informe seu e-mail cadastrado.");
      return;
    }
    setRecoverError("");
    try {
      await recoverAccount.mutateAsync({ data: { email: recoverEmail.trim() } });
      setRecoverMsg(
        "E-mail de redefinição enviado! Verifique sua caixa de entrada. Se não aparecer, cheque o spam."
      );
    } catch {
      setRecoverError("E-mail não encontrado. Verifique o endereço ou crie uma nova conta.");
    }
  }

  const isRegLoading = createUser.isPending || completeOnboarding.isPending;

  // ─── Render helpers ──────────────────────────────────────────────────────────
  function renderLanding() {
    const slide2 = SLIDES[slide]!;
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          {/* Top badge */}
          <View style={s.topBadge}>
            <View style={s.topBadgeIcon}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
            </View>
            <Text style={s.topBadgeText}>SOS Mulher</Text>
          </View>

          {/* Hero card */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={s.heroCard}>
              <Ionicons name="shield-checkmark-outline" size={72} color="#e63946" />
            </View>

            <Text style={s.slideTag}>{slide2.tag}</Text>
            <Text style={s.slideTitle}>{slide2.title}</Text>
            <Text style={s.slideSubtitle}>{slide2.subtitle}</Text>
            <Text style={s.slideBody}>{slide2.body}</Text>

            {/* Dots */}
            <View style={s.dotsRow}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[s.dot, i === slide && s.dotActive]} />
              ))}
            </View>

            <Pressable onPress={nextSlide} style={s.nextLink}>
              <Text style={s.nextLinkText}>Próximo</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom buttons */}
        <View style={[s.bottomArea, { paddingBottom: botPad + 20 }]}>
          <Pressable
            style={s.primaryBtn}
            onPress={() => goMode("terms")}
            accessibilityRole="button"
            accessibilityLabel="Fazer cadastro"
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.primaryBtnText}>Fazer cadastro</Text>
          </Pressable>
          <Pressable
            style={s.secondaryBtn}
            onPress={() => goMode("login")}
            accessibilityRole="button"
            accessibilityLabel="Já tenho cadastro"
          >
            <Text style={s.secondaryBtnText}>Já tenho cadastro</Text>
          </Pressable>
          <Pressable onPress={() => goMode("recover")} style={s.textLink}>
            <Text style={s.textLinkText}>Redefinir senha</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  function renderTerms() {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
        <View style={[s.screenHeader, { paddingHorizontal: 24 }]}>
          <Pressable onPress={() => goMode("landing")} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={s.backBtnText}>Voltar</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text style={s.screenLabel}>TERMOS DE USO</Text>
          <Text style={s.screenTitle}>Leia com atenção</Text>
          <Text style={[s.slideBody, { marginBottom: 20, textAlign: "left" }]}>
            Antes de criar sua conta no SOS Mulher, leia nossos termos de uso completos.
          </Text>
          {TERMS_TEXT.map((section) => (
            <View key={section.num} style={{ marginBottom: 18 }}>
              <Text style={s.termsSectionTitle}>
                {section.num}. {section.title}
              </Text>
              <Text style={s.termsSectionBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Sticky bottom */}
        <View style={[s.bottomArea, { paddingBottom: botPad + 16 }]}>
          {termsError ? <Text style={s.errorText}>{termsError}</Text> : null}
          <Pressable
            style={s.checkRow}
            onPress={() => {
              Haptics.selectionAsync();
              setTermsAccepted((v) => !v);
              setTermsError("");
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: termsAccepted }}
          >
            <View style={[s.checkBox, termsAccepted && s.checkBoxActive]}>
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkLabel}>
              Li e aceito os{" "}
              <Text style={s.checkBold}>Termos de Uso</Text>
              {" "}e confirmo que sou maior de 18 anos.
            </Text>
          </Pressable>
          <Pressable
            style={[s.primaryBtn, { marginTop: 12 }]}
            onPress={() => {
              if (!termsAccepted) {
                setTermsError("Aceite os termos para continuar.");
                return;
              }
              goMode("register");
            }}
            accessibilityRole="button"
            accessibilityLabel="Aceitar e continuar"
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.primaryBtnText}>Aceitar e continuar</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  function renderLogin() {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1, paddingHorizontal: 24 }}>
        <Pressable onPress={() => goMode("landing")} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={18} color="#fff" />
          <Text style={s.backBtnText}>Voltar</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 16 }}>
          <Text style={s.screenLabel}>ACESSO</Text>
          <Text style={s.screenTitle}>Entrar na conta</Text>
          <Text style={[s.slideSubtitle, { textAlign: "left", marginBottom: 28 }]}>
            Use seu e-mail ou nome completo e a senha cadastrados
          </Text>

          {/* Identifier field */}
          <View style={s.fieldLabelRow}>
            <Ionicons name="mail-outline" size={14} color="#636366" />
            <Text style={s.fieldLabel}>E-MAIL OU NOME COMPLETO</Text>
            <Text style={s.required}> *</Text>
          </View>
          <TextInput
            style={[s.input, loginIdentifier.length > 0 && s.inputActive]}
            placeholder="exemplo@email.com ou Nome completo"
            placeholderTextColor="#636366"
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => loginPwRef.current?.focus()}
            autoFocus
          />

          {/* Password field */}
          <View style={s.fieldLabelRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#636366" />
            <Text style={s.fieldLabel}>SENHA</Text>
            <Text style={s.required}> *</Text>
          </View>
          <View style={[s.inputWrap, loginPassword.length > 0 && s.inputActive]}>
            <TextInput
              ref={loginPwRef}
              style={[s.input, { marginBottom: 0, borderWidth: 0, flex: 1 }]}
              placeholder="Sua senha"
              placeholderTextColor="#636366"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry={!showLoginPw}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowLoginPw((v) => !v)} style={s.eyeBtn} accessibilityRole="button" accessibilityLabel={showLoginPw ? "Ocultar senha" : "Mostrar senha"}>
              <Ionicons name={showLoginPw ? "eye-off-outline" : "eye-outline"} size={20} color="#636366" />
            </Pressable>
          </View>

          {loginError ? <Text style={s.errorText}>{loginError}</Text> : null}
        </View>

        <View style={[s.bottomArea, { paddingBottom: botPad + 20 }]}>
          <Pressable
            style={[s.primaryBtn, loginUser.isPending && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loginUser.isPending}
            accessibilityRole="button"
            accessibilityLabel="Entrar no app"
          >
            {loginUser.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
                <Text style={s.primaryBtnText}>Entrar no app</Text>
              </>
            )}
          </Pressable>
          <Pressable onPress={() => goMode("terms")} style={s.textLink}>
            <Text style={s.textLinkText}>Não tenho cadastro — criar agora</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  function renderRegister() {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24 }}>
          <Pressable onPress={() => goMode("terms")} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="chevron-back" size={18} color="#fff" />
            <Text style={s.backBtnText}>Voltar</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 24 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Gender */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="heart-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>VOCÊ SE IDENTIFICA COMO</Text>
              <Text style={s.required}> *</Text>
            </View>
            <View style={s.genderRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g.id}
                  style={[s.genderCard, gender === g.id && s.genderCardActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setGender(g.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: gender === g.id }}
                  accessibilityLabel={g.id}
                >
                  <Text style={[s.genderSymbol, { color: gender === g.id ? g.color : "#636366" }]}>
                    {g.symbol}
                  </Text>
                  <Text style={[s.genderLabel, gender === g.id && s.genderLabelActive]}>
                    {g.id}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Name */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="person-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>NOME COMPLETO</Text>
              <Text style={s.required}> *</Text>
            </View>
            <TextInput
              style={[s.input, name.length > 0 && s.inputActive]}
              placeholder="Seu nome completo"
              placeholderTextColor="#636366"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            {/* Email */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="mail-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>E-MAIL</Text>
              <Text style={s.required}> *</Text>
              <Text style={s.fieldHint}> — para recuperar a conta</Text>
            </View>
            <TextInput
              ref={emailRef}
              style={[s.input, email.length > 0 && s.inputActive]}
              placeholder="seu@email.com"
              placeholderTextColor="#636366"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />

            {/* Phone */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="call-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>CELULAR / WHATSAPP COM DDD</Text>
              <Text style={s.required}> *</Text>
            </View>
            <TextInput
              ref={phoneRef}
              style={[s.input, phone.length > 0 && s.inputActive]}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#636366"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => cpfRef.current?.focus()}
            />

            {/* CPF */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="card-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>CPF</Text>
              <Text style={s.fieldHint}> (opcional)</Text>
            </View>
            <TextInput
              ref={cpfRef}
              style={[s.input, cpf.length > 0 && s.inputActive]}
              placeholder="000.000.000-00"
              placeholderTextColor="#636366"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
              returnKeyType="next"
              onSubmitEditing={() => pwRef.current?.focus()}
            />

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>ACESSO AO APP</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Password */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="lock-closed-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>CRIAR SENHA</Text>
              <Text style={s.required}> *</Text>
            </View>
            <View style={[s.inputWrap, password.length > 0 && s.inputActive]}>
              <TextInput
                ref={pwRef}
                style={[s.input, { marginBottom: 0, borderWidth: 0, flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor="#636366"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                returnKeyType="next"
                onSubmitEditing={() => confirmPwRef.current?.focus()}
              />
              <Pressable onPress={() => setShowPw((v) => !v)} style={s.eyeBtn} accessibilityRole="button" accessibilityLabel={showPw ? "Ocultar senha" : "Mostrar senha"}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color="#636366" />
              </Pressable>
            </View>
            <PasswordStrengthBar password={password} />

            {/* Confirm password */}
            <View style={s.fieldLabelRow}>
              <Ionicons name="lock-closed-outline" size={14} color="#636366" />
              <Text style={s.fieldLabel}>CONFIRMAR SENHA</Text>
              <Text style={s.required}> *</Text>
            </View>
            <View style={[s.inputWrap, confirmPassword.length > 0 && s.inputActive]}>
              <TextInput
                ref={confirmPwRef}
                style={[s.input, { marginBottom: 0, borderWidth: 0, flex: 1 }]}
                placeholder="Repita a senha"
                placeholderTextColor="#636366"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPw}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              <Pressable onPress={() => setShowConfirmPw((v) => !v)} style={s.eyeBtn} accessibilityRole="button" accessibilityLabel={showConfirmPw ? "Ocultar confirmação" : "Mostrar confirmação"}>
                <Ionicons name={showConfirmPw ? "eye-off-outline" : "eye-outline"} size={20} color="#636366" />
              </Pressable>
            </View>

          </ScrollView>
          <View style={[s.bottomArea, { paddingBottom: botPad + 20 }]}>
            {regError ? <Text style={s.errorText}>{regError}</Text> : null}
            <Pressable
              style={[s.primaryBtn, isRegLoading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isRegLoading}
              accessibilityRole="button"
              accessibilityLabel="Criar minha conta"
            >
              {isRegLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={s.primaryBtnText}>Criar minha conta</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  function renderRecover() {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1, paddingHorizontal: 24 }}>
        <Pressable onPress={() => goMode("landing")} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={18} color="#fff" />
          <Text style={s.backBtnText}>Voltar</Text>
        </Pressable>

        <View style={{ flex: 1, justifyContent: "flex-start", paddingTop: 16 }}>
          <Text style={s.screenLabel}>SEGURANÇA</Text>
          <Text style={s.screenTitle}>Redefinir senha</Text>
          <Text style={[s.slideSubtitle, { textAlign: "left", marginBottom: 28 }]}>
            Informe o e-mail cadastrado para receber o link de redefinição.
          </Text>

          <View style={s.fieldLabelRow}>
            <Ionicons name="mail-outline" size={14} color="#636366" />
            <Text style={s.fieldLabel}>E-MAIL CADASTRADO</Text>
            <Text style={s.required}> *</Text>
          </View>
          <TextInput
            style={[s.input, recoverEmail.length > 0 && s.inputActive]}
            placeholder="seu@email.com"
            placeholderTextColor="#636366"
            value={recoverEmail}
            onChangeText={setRecoverEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleRecover}
            autoFocus
          />

          {recoverError ? <Text style={s.errorText}>{recoverError}</Text> : null}
          {recoverMsg ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#30d158" />
              <Text style={s.successText}>{recoverMsg}</Text>
            </View>
          ) : null}
        </View>

        <View style={[s.bottomArea, { paddingBottom: botPad + 20 }]}>
          <Pressable
            style={[s.primaryBtn, recoverAccount.isPending && { opacity: 0.7 }]}
            onPress={handleRecover}
            disabled={recoverAccount.isPending || !!recoverMsg}
            accessibilityRole="button"
            accessibilityLabel="Recuperar acesso"
          >
            {recoverAccount.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="mail" size={20} color="#fff" />
                <Text style={s.primaryBtnText}>
                  {recoverMsg ? "E-mail enviado ✓" : "Recuperar acesso"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ─── Root render ─────────────────────────────────────────────────────────────
  return (
    <View
      style={[
        s.root,
        { paddingTop: topPad + 12 },
      ]}
    >
      {mode === "landing" && renderLanding()}
      {mode === "terms" && renderTerms()}
      {mode === "login" && renderLogin()}
      {mode === "register" && renderRegister()}
      {mode === "recover" && renderRecover()}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#111113",
  },

  // Top badge (landing)
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  topBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
  },
  topBadgeText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Hero card
  heroCard: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "#1c1c1e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2c2c2e",
  },

  // Slide text
  slideTag: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#e63946",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  slideTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#ebebf5cc",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  slideBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // Dots
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3a3a3c",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#e63946",
  },

  // Next link
  nextLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  nextLinkText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#ebebf599",
    textDecorationLine: "underline",
    textAlign: "center",
  },

  // Bottom action area
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: "#e63946",
    borderRadius: 50,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: "#1c1c1e",
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3a3a3c",
  },
  secondaryBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  textLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  textLinkText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#8e8e93",
    textDecorationLine: "underline",
  },

  // Back button
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },

  // Screen header labels
  screenLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#e63946",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 8,
  },
  screenHeader: {
    paddingTop: 4,
  },

  // Terms
  termsSectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 6,
  },
  termsSectionBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#ebebf5cc",
    lineHeight: 22,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#636366",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkBoxActive: {
    backgroundColor: "#e63946",
    borderColor: "#e63946",
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#ebebf5cc",
    lineHeight: 21,
  },
  checkBold: {
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },

  // Field labels
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#8e8e93",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  required: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#e63946",
  },
  fieldHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#636366",
  },

  // Inputs
  input: {
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#3a3a3c",
    marginBottom: 16,
  },
  inputActive: {
    borderColor: "#e63946",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3a3a3c",
    marginBottom: 16,
    paddingRight: 14,
    overflow: "hidden",
  },
  eyeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  // Gender cards
  genderRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  genderCard: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#3a3a3c",
  },
  genderCardActive: {
    borderColor: "#e63946",
    backgroundColor: "#e6394612",
  },
  genderSymbol: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  genderLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 15,
  },
  genderLabelActive: {
    color: "#e63946",
    fontFamily: "Inter_700Bold",
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#3a3a3c",
  },
  dividerText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#636366",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Error/success
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#e63946",
    textAlign: "center",
    marginBottom: 8,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#30d15815",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#30d15840",
    marginBottom: 12,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#30d158",
    lineHeight: 20,
  },
});
