# Casos de Uso — SOS Mulher

## Atores

| Ator | Descrição |
|------|-----------|
| **Usuária** | Mulher cadastrada que usa o aplicativo |
| **Sistema** | Backend Express + PostgreSQL |
| **Twilio** | Serviço externo de chamadas de voz |
| **Contato de Emergência** | Pessoa designada pela usuária para ser notificada |

---

## UC01 — Cadastro de Conta

**Ator principal:** Usuária  
**Pré-condição:** Usuária não possui conta cadastrada  
**Pós-condição:** Conta criada, onboarding marcado como incompleto

**Fluxo principal:**
1. Usuária abre o app e acessa a tela de cadastro
2. Preenche: nome, telefone, e-mail (opcional), CPF (opcional), gênero, senha
3. Aceita os Termos de Uso
4. Sistema valida os dados (CPF único, gênero permitido)
5. Sistema salva a usuária com `password_hash` (SHA-256)
6. App redireciona para o dashboard

**Fluxo alternativo — Gênero "Homem":**
- No passo 4, sistema retorna HTTP 403
- App exibe tela "Acesso Restrito"
- Nenhum registro é criado no banco

---

## UC02 — Login

**Ator principal:** Usuária  
**Pré-condição:** Usuária possui conta cadastrada  
**Pós-condição:** Sessão iniciada, `userId` e `userName` salvos em AsyncStorage

**Fluxo principal:**
1. Usuária acessa a tela de login
2. Informa nome e senha
3. Sistema busca usuária por nome (case-insensitive)
4. Sistema verifica o hash da senha
5. Sistema retorna `{userId, userName, phone}`
6. App salva sessão e redireciona para o dashboard

**Fluxo alternativo — Credenciais inválidas:**
- Senha incorreta → HTTP 401 + mensagem "Senha incorreta"
- Usuária não encontrada → HTTP 404

---

## UC03 — Ativação do SOS

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada, pelo menos 1 contato cadastrado (recomendado)  
**Pós-condição:** Alerta registrado no banco, contatos notificados, temporizador iniciado

**Fluxo principal:**
1. Usuária pressiona e mantém o botão SOS por 1,5 segundos
2. Sistema recebe `POST /api/alerts` com userId, coordenadas GPS e duração
3. Sistema cria registro em `alerts` com status `pending`
4. Sistema simula envio de SMS/WhatsApp para todos os contatos
5. Status atualizado para `sms_sent`
6. App exibe tela de emergência ativa com temporizador e dados GPS
7. Após `timerDuration` segundos, sistema escalona para `calling_cloud`

**Fluxo alternativo — Temporizador chega a 00:00:**
- App dispara `POST /api/alerts/trigger-voice`
- Backend atualiza status para `voice_call_dispatched`
- Twilio realiza chamada de voz com mensagem TTS
- App abre discador nativo (`tel:190`) simultaneamente

---

## UC04 — Cancelar Alerta SOS

**Ator principal:** Usuária  
**Pré-condição:** Alerta ativo em andamento  
**Pós-condição:** Alerta resolvido, status `resolved_by_contact`, overlay fechado

**Fluxo principal:**
1. Usuária toca "Cancelar alerta (estou segura)"
2. App exibe painel de confirmação "Você está segura?"
3. Usuária confirma "Sim, estou segura"
4. Sistema recebe `PUT /api/alerts/:id/resolve`
5. Status atualizado para `resolved_by_contact`
6. App fecha overlay e retorna ao dashboard

---

## UC05 — Gerenciar Contatos de Emergência

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Contato adicionado, editado ou removido

**Fluxo principal (adicionar):**
1. Usuária acessa a aba "Contatos"
2. Toca em "Adicionar Contato"
3. Preenche nome, telefone e grau de relacionamento
4. Sistema salva em `emergency_contacts`

**Restrição:** Máximo de 5 contatos por usuária

---

## UC06 — Check-in de Segurança

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Check-in registrado como feedback

**Fluxo principal:**
1. Usuária expande o acordeão "Check-in de segurança" no dashboard
2. Seleciona duração (30 min, 1h, 2h, 4h, 8h)
3. Sistema registra `check-in:safe:Xmin` em `feedbacks`
4. Temporizador visual exibido no dashboard

---

## UC07 — Publicar no Feed Comunitário

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Publicação visível no feed para todas as usuárias

**Fluxo principal:**
1. Usuária acessa aba "Comunidade"
2. Digita conteúdo (mínimo 5 caracteres)
3. Sistema salva em `community_posts`
4. Publicação aparece no feed em ordem cronológica inversa

---

## UC08 — Registrar Ocorrência / Denúncia

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Ocorrência registrada em `incidents`

**Fluxo principal:**
1. Usuária acessa a seção de denúncia no perfil
2. Preenche narrativa detalhada
3. Opcionalmente adiciona anexos ou áudio
4. Sistema salva em `incidents`

---

## UC09 — Visualizar Histórico de Alertas

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Lista de alertas exibida com status atualizado

**Fluxo principal:**
1. Usuária acessa aba "Histórico"
2. Sistema busca `GET /api/alerts/user/:userId`
3. App exibe lista com status, data/hora e localização de cada alerta

---

## UC10 — Configurar Perfil e Segurança

**Ator principal:** Usuária  
**Pré-condição:** Usuária autenticada  
**Pós-condição:** Configurações salvas na tabela `settings`

**Fluxo principal:**
1. Usuária acessa aba "Perfil"
2. Edita dados pessoais (nome, telefone, e-mail)
3. Configura permissões (GPS, câmera, notificações)
4. Configura segurança avançada (biometria, modo disfarce, código de coerção)
5. Configura temporizador SOS
6. Cada alteração dispara `PUT /api/users/:userId/settings` (upsert)

---

## UC11 — Localizar Centros de Apoio

**Ator principal:** Usuária  
**Pré-condição:** Permissão de localização concedida (opcional)  
**Pós-condição:** Lista de CRAMs ordenada por distância

**Fluxo principal:**
1. Usuária acessa aba "Contatos"
2. App solicita permissão de localização
3. App calcula distância Haversine para 12 CRAMs cadastrados
4. Lista exibida em ordem crescente de distância com km indicado

---

## UC12 — Recuperação de Conta

**Ator principal:** Usuária  
**Pré-condição:** Conta cadastrada com e-mail  
**Pós-condição:** Token de recuperação simulado retornado

**Fluxo principal:**
1. Usuária toca "Redefinir senha" na tela de login
2. Informa e-mail cadastrado
3. Sistema envia `POST /api/auth/recover`
4. Sistema retorna token simulado

---

## Diagrama de Casos de Uso (Textual)

```
+----------------------------------------------------------+
|                     SOS MULHER                           |
|                                                          |
|  [Usuária] ──► UC01 Cadastro                            |
|            ──► UC02 Login                               |
|            ──► UC03 Ativar SOS ────► [Twilio]           |
|            ──► UC04 Cancelar SOS                        |
|            ──► UC05 Gerenciar Contatos                  |
|            ──► UC06 Check-in de Segurança               |
|            ──► UC07 Publicar no Feed                    |
|            ──► UC08 Registrar Ocorrência                |
|            ──► UC09 Ver Histórico                       |
|            ──► UC10 Configurar Perfil                   |
|            ──► UC11 Localizar Centros de Apoio          |
|            ──► UC12 Recuperar Conta                     |
|                                                          |
|  [Contato] ◄── UC03 (notificado via SMS/WhatsApp)       |
|  [Twilio]  ◄── UC03 (chamada de voz ao expirar timer)   |
+----------------------------------------------------------+
```
