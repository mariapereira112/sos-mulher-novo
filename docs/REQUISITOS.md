# Requisitos — SOS Mulher

---

## Requisitos Funcionais

### RF01 — Cadastro de Usuária
O sistema deve permitir o cadastro de usuárias com os campos: nome, telefone, e-mail (opcional), CPF (opcional), gênero e senha.

**Critérios de aceitação:**
- CPF deve ser único no sistema
- Gênero "Homem" deve retornar HTTP 403 e nenhum registro deve ser criado
- Senha deve ser armazenada como hash SHA-256 (nunca em texto plano)

---

### RF02 — Autenticação
O sistema deve autenticar usuárias por nome e senha.

**Critérios de aceitação:**
- Busca por nome é case-insensitive
- Senha incorreta retorna HTTP 401 com mensagem em português
- Login bem-sucedido retorna `{userId, userName, phone}` para persistência em AsyncStorage

---

### RF03 — Recuperação de Conta
O sistema deve oferecer recuperação de conta por e-mail cadastrado.

**Critérios de aceitação:**
- `POST /api/auth/recover` recebe `{email}` e retorna token simulado

---

### RF04 — Botão SOS com Pressão Longa
O app deve exibir um botão SOS circular que requer 1,5 segundos de pressão para ser ativado.

**Critérios de aceitação:**
- Feedback háptico durante a pressão
- Soltar antes de 1,5s cancela a ação
- Ao ativar, cria alerta no banco e exibe overlay de emergência

---

### RF05 — Temporizador de Emergência Configurável
O usuário deve poder configurar a duração do temporizador SOS entre: 10s, 30s, 1min, 2min, 5min.

**Critérios de aceitação:**
- Configuração salva na tabela `settings`
- Temporizador exibido em tempo real no overlay de emergência
- Ao chegar a 00:00, escalar automaticamente (RF08)

---

### RF06 — Notificação de Contatos
Ao ativar o SOS, o sistema deve notificar todos os contatos de emergência cadastrados.

**Critérios de aceitação:**
- Notificação simulada via SMS/WhatsApp para cada contato
- Status atualizado para `sms_sent` após o envio
- Registros criados em `alert_notifications`

---

### RF07 — Chamada de Voz Automática via Twilio
Quando o temporizador SOS atingir 00:00, o sistema deve disparar uma chamada de voz automatizada.

**Critérios de aceitação:**
- `POST /api/alerts/trigger-voice` deve ser chamado
- Status do alerta atualizado para `voice_call_dispatched` imediatamente
- Se credenciais Twilio configuradas: ligação real com TTS em português
- Se não configurado: fallback gracioso com status atualizado
- App abre discador nativo (`tel:190`) simultaneamente

---

### RF08 — Escalada Progressiva de Emergência
O sistema deve escalar o alerta em fases:

| Fase | Gatilho | Status |
|------|---------|--------|
| 1 | Botão SOS ativado | `sms_sent` |
| 2 | Após `timerDuration` s | `calling_cloud` |
| 3 | Timer chega a 00:00 | `voice_call_dispatched` |
| 4 | Contato responde "1" | `resolved_by_contact` |

---

### RF09 — Gestão de Contatos de Emergência
O app deve permitir adicionar, visualizar e remover contatos de emergência.

**Critérios de aceitação:**
- Máximo de 5 contatos por usuária
- Campos: nome, telefone, relacionamento
- Contatos exibidos na aba "Contatos" com botão de remoção

---

### RF10 — Linhas de Apoio Oficiais
O app deve exibir os números oficiais de apoio à mulher na aba "Contatos".

**Critérios de aceitação:**
- Central de Atendimento à Mulher: 180
- Polícia Militar: 190
- SAMU: 192

---

### RF11 — Centros de Referência Geolocalizados
O app deve exibir CRAMs (Centros de Referência de Atendimento à Mulher) ordenados por distância.

**Critérios de aceitação:**
- 12 CRAMs cadastrados com coordenadas GPS reais
- Distância calculada via Haversine se permissão de localização concedida
- Distância exibida em km

---

### RF12 — Feed Comunitário
O app deve exibir um feed de publicações da comunidade.

**Critérios de aceitação:**
- Publicações exibidas em ordem cronológica inversa
- Usuária autenticada pode criar novas publicações (mínimo 5 caracteres)
- Exibe nome da autora e data/hora

---

### RF13 — Histórico de Alertas
O app deve exibir o histórico completo de alertas SOS da usuária.

**Critérios de aceitação:**
- Listagem via `GET /api/alerts/user/:userId`
- Exibe status com badge colorido, data/hora e duração do temporizador
- Ordenado por data decrescente

---

### RF14 — Check-in de Segurança
O app deve permitir que a usuária registre check-ins de segurança com duração definida.

**Critérios de aceitação:**
- Durações disponíveis: 30min, 1h, 2h, 4h, 8h
- Temporizador visual no dashboard durante check-in ativo
- Registro salvo em `feedbacks`

---

### RF15 — Perfil com Foto
O app deve permitir alterar e remover a foto de perfil.

**Critérios de aceitação:**
- Seleção via galeria com edição 1:1
- Salva URL em `settings.photo_url` via upsert
- Botão "Remover foto" visível somente quando foto definida

---

### RF16 — Modo Disfarce (Código de Coerção)
O app deve suportar um código secreto que simula uma tela diferente para enganar agressores.

**Critérios de aceitação:**
- Código configurável em "Segurança Avançada" no perfil
- Salvo em `settings.coercion_code`

---

### RF17 — Registro de Ocorrências
O app deve permitir o registro de ocorrências/denúncias de violência.

**Critérios de aceitação:**
- Campos: narrativa, CPF, nome completo, testemunhas, anexos e áudio
- Dados salvos em `incidents`

---

## Requisitos Não Funcionais

### RNF01 — Segurança
O sistema deve proteger dados sensíveis das usuárias.

- Senhas armazenadas como hash SHA-256 (nunca em texto plano)
- CPF protegido e mascarado na interface ("•••.•••.•••-••")
- Comunicação deve ser feita via HTTPS em produção
- Variáveis sensíveis (Twilio, DB) configuradas via variáveis de ambiente

---

### RNF02 — Desempenho
O sistema deve responder às requisições em tempo aceitável.

- Respostas da API: < 500ms em condições normais
- Build do app: sem erros de TypeScript
- Bundling Metro: < 2 segundos para hot reload

---

### RNF03 — Disponibilidade
O sistema deve estar disponível continuamente, especialmente em emergências.

- Alvo: 99,9% de uptime para a API
- Fallback gracioso: se Twilio indisponível, status é atualizado sem erro para o usuário

---

### RNF04 — Usabilidade
O app deve ser intuitivo e confiável em situações de estresse.

- Tema escuro permanente nas telas normais (tokens em `constants/colors.ts`)
- Tema claro de alto contraste na tela de emergência ativa (fundo `#F8FAFC`, texto `#0F172A`)
- Feedback háptico em ações críticas
- Acessibilidade: `accessibilityLabel`, `accessibilityRole` em todos os controles interativos

---

### RNF05 — Compatibilidade
O app deve funcionar nos sistemas operacionais mobile mais populares.

- iOS 13+
- Android 10+
- Web (Expo Web / React Native Web) para demonstração

---

### RNF06 — Escalabilidade
O backend deve suportar crescimento de usuárias sem refatoração.

- PostgreSQL com chaves estrangeiras e cascade delete
- Drizzle ORM para queries tipadas e migrations versionadas
- Arquitetura MVC: Models → Services → Controllers → Routes

---

### RNF07 — Manutenibilidade
O código deve ser de fácil manutenção e extensão.

- Contrato API-first via OpenAPI 3.0 (`lib/api-spec/openapi.yaml`)
- Geração automática de hooks React Query e schemas Zod via Orval
- TypeScript strict em todos os pacotes
- Monorepo pnpm com workspaces para separação clara de responsabilidades

---

### RNF08 — Portabilidade
O projeto deve funcionar em qualquer ambiente com PostgreSQL.

- Sem dependências hard-coded de plataforma
- Todas as configurações via variáveis de ambiente (`DATABASE_URL`, `TWILIO_*`, etc.)
- Schema gerenciado por Drizzle ORM (compatível com qualquer PostgreSQL 13+)

---

### RNF09 — Privacidade
O sistema deve respeitar a privacidade das usuárias.

- Dados pessoais armazenados somente no banco da instituição
- CPF não exibido em texto claro na interface
- Localização GPS capturada somente durante alertas ativos (com permissão explícita)

---

## Resumo dos Requisitos

| Categoria | Quantidade |
|-----------|-----------|
| Requisitos Funcionais | 17 |
| Requisitos Não Funcionais | 9 |
| **Total** | **26** |
