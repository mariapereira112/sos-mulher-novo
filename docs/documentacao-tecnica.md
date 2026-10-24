# Documentação Técnica — Projeto Integrador I

---

## 1. Identificação do Projeto

**Nome do Projeto:** SOS Mulher — Aplicativo Móvel de Segurança Feminina

**Equipe:**
- [Nome do Integrante 1]
- [Nome do Integrante 2]
- [Nome do Integrante 3]

**Professor Orientador:** [Nome do Professor]

---

## 2. Introdução

A violência contra a mulher é um problema social grave no Brasil. Segundo o Anuário Brasileiro de Segurança Pública (2023), uma mulher é vítima de violência a cada 6 minutos no país. Em situações de perigo iminente, o tempo de resposta pode ser determinante para a segurança da vítima.

O projeto **SOS Mulher** nasce como resposta tecnológica a essa realidade: um aplicativo móvel que permite à usuária acionar um alerta de emergência com rapidez, discrição e eficiência, notificando seus contatos de confiança e enviando sua localização GPS em tempo real.

### 2.1 Visão do Produto

O SOS Mulher é um aplicativo móvel desenvolvido para dispositivos Android e iOS que oferece:

- **Acionamento de emergência simplificado:** um botão SOS de pressão prolongada (5 segundos) que dispara alertas automáticos
- **Notificação de contatos:** envio de localização GPS para contatos cadastrados via mensagem
- **Check-in de segurança:** mecanismo para a usuária informar que está bem, com timer configurável
- **Histórico de alertas:** registro persistente de todos os acionamentos para acompanhamento
- **Comunidade:** espaço de relatos e apoio entre usuárias
- **Segurança por design:** modo discreto, código de coerção e autenticação biométrica

**Objetivo geral:** Fornecer às mulheres uma ferramenta tecnológica acessível, rápida e discreta para situações de risco, reduzindo o tempo de resposta em emergências.

**Objetivos específicos:**
- Implementar acionamento de alerta em menos de 5 segundos
- Enviar localização GPS para até 5 contatos de confiança
- Manter histórico completo de alertas com status de resolução
- Garantir funcionamento offline parcial e acesso rápido à tela de SOS

---

## 3. Requisitos do Sistema

### 3.1 Requisitos Funcionais

---

**Identificador:** RF01 | **Prioridade:** Alta
**Nome:** Cadastro de Usuária
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve permitir o cadastro de novas usuárias com os campos: nome completo, telefone, e-mail, CPF e gênero. O cadastro de usuários do gênero "Homem" deve ser bloqueado com redirecionamento para tela de acesso restrito.

---

**Identificador:** RF02 | **Prioridade:** Alta
**Nome:** Acionamento de Alerta SOS
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve permitir o acionamento de um alerta de emergência por meio de pressão prolongada (5 segundos) no botão SOS. O alerta deve registrar latitude, longitude, data/hora e disparar notificações para todos os contatos de emergência cadastrados.

---

**Identificador:** RF03 | **Prioridade:** Alta
**Nome:** Cadastro de Contatos de Emergência
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve permitir à usuária cadastrar até 5 contatos de emergência com nome, telefone e parentesco/relação. Os contatos devem poder ser adicionados, editados e removidos.

---

**Identificador:** RF04 | **Prioridade:** Alta
**Nome:** Rastreamento de Localização GPS
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** No momento do acionamento SOS, o aplicativo deve capturar a localização GPS da usuária (latitude e longitude) e incluí-la no alerta enviado. O status do GPS deve ser exibido em tempo real na tela principal.

---

**Identificador:** RF05 | **Prioridade:** Alta
**Nome:** Histórico de Alertas
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve manter e exibir um histórico completo de todos os alertas SOS disparados pela usuária, com informações de data/hora, localização, status (pendente, SMS enviado, chamada em andamento, resolvido) e tempo de resposta.

---

**Identificador:** RF06 | **Prioridade:** Média
**Nome:** Check-in de Segurança
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve permitir que a usuária realize um check-in informando que está bem, com duração configurável (15 min, 30 min, 1h, 2h). O check-in deve notificar os contatos de emergência e exibir um temporizador regressivo.

---

**Identificador:** RF07 | **Prioridade:** Média
**Nome:** Feed da Comunidade
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve disponibilizar um feed comunitário onde usuárias podem publicar relatos, dicas de segurança e mensagens de apoio, exibidos em ordem cronológica reversa.

---

**Identificador:** RF08 | **Prioridade:** Média
**Nome:** Configurações Personalizadas
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve permitir à usuária configurar: GPS/localização, câmera e microfone, modo discreto, biometria, alto contraste, texto grande, redução de animações, código de coerção e tempo do temporizador SOS. Todas as configurações devem ser persistidas no banco de dados.

---

**Identificador:** RF09 | **Prioridade:** Média
**Nome:** Recuperação de Conta
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve oferecer mecanismo de recuperação de conta por e-mail cadastrado.

---

**Identificador:** RF10 | **Prioridade:** Baixa
**Nome:** Foto de Perfil
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** A usuária deve poder selecionar, pré-visualizar, confirmar e remover sua foto de perfil. A foto é armazenada como URI base64 no banco de dados.

---

### 3.2 Requisitos Não Funcionais

---

**Identificador:** RNF01 | **Categoria:** Desempenho
**Nome:** Tempo de Resposta do Alerta
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O sistema deve processar e registrar um alerta SOS em no máximo 3 segundos após o acionamento, incluindo persistência no banco de dados e disparo das notificações.

---

**Identificador:** RNF02 | **Categoria:** Usabilidade
**Nome:** Interface Intuitiva e Acessível
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O botão SOS deve ser o elemento visualmente dominante da tela principal. O aplicativo deve suportar alto contraste, texto grande e redução de animações para acessibilidade.

---

**Identificador:** RNF03 | **Categoria:** Segurança
**Nome:** Proteção de Dados Pessoais
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** Dados sensíveis (CPF, senha) devem ser armazenados com hash e nunca expostos em respostas da API. O CPF deve ser exibido apenas mascarado na interface.

---

**Identificador:** RNF04 | **Categoria:** Portabilidade
**Nome:** Multiplataforma
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O aplicativo deve funcionar em dispositivos Android e iOS usando a mesma base de código React Native (Expo).

---

**Identificador:** RNF05 | **Categoria:** Disponibilidade
**Nome:** API REST Disponível
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** A API backend deve manter disponibilidade de 99% durante o horário de uso. Deve responder com mensagens de erro claras em JSON para todas as falhas.

---

**Identificador:** RNF06 | **Categoria:** Manutenibilidade
**Nome:** Arquitetura MVC
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** O backend deve seguir o padrão arquitetural MVC (Model-View-Controller), com separação clara entre modelos (Drizzle ORM), serviços (regras de negócio) e controladores (handlers HTTP).

---

**Identificador:** RNF07 | **Categoria:** Compatibilidade
**Nome:** CORS Aberto para Clientes Móveis
**Data de Criação:** 2024-06-01 | **Autor:** Equipe SOS Mulher
**Descrição:** A API deve aceitar requisições de qualquer origem (CORS configurado), garantindo compatibilidade com emuladores, dispositivos físicos e clientes web.

---

### 3.3 Regras de Negócio

**RN01 — Restrição de Gênero no Cadastro:**
O aplicativo é direcionado exclusivamente a mulheres e pessoas não-binárias. Tentativas de cadastro com gênero "Homem" devem ser bloqueadas pela API (HTTP 403) e o usuário redirecionado para uma tela de "Acesso Restrito". Nenhum registro deve ser criado no banco de dados para esse caso.

**RN02 — Unicidade do CPF:**
Cada CPF deve estar vinculado a apenas uma conta no sistema. Tentativas de cadastro com CPF já registrado devem ser rejeitadas.

**RN03 — Limite de Contatos de Emergência:**
Cada usuária pode cadastrar no máximo 5 contatos de emergência. A interface deve informar o limite e desabilitar o botão de adição ao atingi-lo.

**RN04 — Escalada do Alerta SOS em Duas Fases:**
- **Fase 1 (imediata):** Ao disparar o SOS, o sistema registra o alerta com status `sms_sent` e notifica todos os contatos por mensagem com a localização GPS.
- **Fase 2 (temporizada):** Após o tempo configurado (padrão: 30 segundos), se não houver resposta, o status muda para `calling_cloud` e é iniciada uma chamada de voz automática.
- **Resolução:** A usuária pode encerrar o alerta a qualquer momento (status `resolved_by_contact`).

**RN05 — Persistência Obrigatória de Configurações:**
Todas as configurações da usuária (GPS, modo discreto, temporizador, etc.) devem ser salvas no banco de dados a cada alteração. Não é permitido uso de armazenamento local (localStorage/AsyncStorage) para configurações.

**RN06 — CPF Mascarado na Interface:**
O CPF nunca deve ser exibido em texto claro na interface. Deve aparecer sempre como `•••.•••.•••-••` e o campo deve estar bloqueado para edição.

**RN07 — Código de Coerção:**
A usuária pode configurar um código de coerção. Quando inserido no campo de acesso, o aplicativo deve aparentar funcionar normalmente mas alertar silenciosamente os contatos de emergência.

---

## 4. Modelagem

### 4.1 Diagrama de Caso de Uso

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   Sistema SOS Mulher                    │
                    │                                                         │
                    │  ┌───────────────┐     ┌───────────────────────────┐   │
          ┌─────┐   │  │  Realizar     │     │  Gerenciar Contatos de    │   │
          │     │──►│  │  Cadastro     │     │  Emergência               │   │
          │     │   │  └───────────────┘     └───────────────────────────┘   │
          │     │   │                                                         │
          │     │   │  ┌───────────────┐     ┌───────────────────────────┐   │
          │     │──►│  │  Acionar SOS  │     │  Visualizar Histórico     │   │
          │     │   │  └───────────────┘     │  de Alertas               │   │
          │     │   │         │              └───────────────────────────┘   │
          │Usu- │   │         ▼                                               │
          │ária │   │  ┌───────────────┐     ┌───────────────────────────┐   │
          │     │   │  │  Notificar    │     │  Realizar Check-in         │   │
          │     │   │  │  Contatos     │     │  de Segurança             │   │
          │     │   │  │  (GPS+SMS)    │     └───────────────────────────┘   │
          │     │   │  └───────────────┘                                      │
          │     │   │                        ┌───────────────────────────┐   │
          │     │──►│                        │  Publicar no Feed         │   │
          │     │   │                        │  Comunitário              │   │
          │     │   │                        └───────────────────────────┘   │
          │     │   │                                                         │
          │     │   │  ┌───────────────┐     ┌───────────────────────────┐   │
          │     │──►│  │  Configurar   │     │  Recuperar Conta          │   │
          └─────┘   │  │  Preferências │     └───────────────────────────┘   │
                    │  └───────────────┘                                      │
                    └─────────────────────────────────────────────────────────┘

Ator: Usuária (mulher ou pessoa não-binária com conta ativa no sistema)
```

**Casos de Uso Principais:**

| Caso de Uso | Ator | Descrição Resumida |
|---|---|---|
| Realizar Cadastro | Usuária | Criar conta com nome, CPF, telefone, e-mail e gênero |
| Acionar SOS | Usuária | Pressionar o botão SOS por 5 segundos para disparar alerta |
| Notificar Contatos | Sistema | Enviar localização GPS para todos os contatos cadastrados |
| Gerenciar Contatos | Usuária | Adicionar, editar e remover contatos de emergência (máx. 5) |
| Visualizar Histórico | Usuária | Ver lista de alertas passados com status e localização |
| Realizar Check-in | Usuária | Informar que está bem por período determinado |
| Publicar no Feed | Usuária | Compartilhar relatos e mensagens na comunidade |
| Configurar Preferências | Usuária | Ajustar GPS, biometria, temporizador, modo discreto etc. |
| Recuperar Conta | Usuária | Recuperar acesso via e-mail cadastrado |

---

### 4.2 Diagrama de Classes

```
┌──────────────────────────────────┐
│           <<Model>>              │
│             User                 │
├──────────────────────────────────┤
│ - id: number                     │
│ - name: string                   │
│ - phone: string                  │
│ - email: string | null           │
│ - cpf: string | null             │
│ - gender: string | null          │
│ - passwordHash: string | null    │
│ - onboardingCompleted: boolean   │
│ - createdAt: Date                │
│ - updatedAt: Date                │
├──────────────────────────────────┤
│ + findById(id): User             │
│ + create(data): User             │
│ + update(id, data): User         │
│ + deleteById(id): void           │
└──────────────┬───────────────────┘
               │ 1
               │
               │ possui
        ┌──────┴───────────────────────────────────────────────┐
        │                                                      │
        │ 0..*                                                 │ 0..1
┌───────▼──────────────────────┐        ┌─────────────────────▼──────────────┐
│        <<Model>>             │        │           <<Model>>                │
│     EmergencyContact         │        │             Settings               │
├──────────────────────────────┤        ├────────────────────────────────────┤
│ - id: number                 │        │ - id: number                       │
│ - userId: number             │        │ - userId: number                   │
│ - name: string               │        │ - gpsEnabled: boolean              │
│ - phone: string              │        │ - notificationsEnabled: boolean    │
│ - relationship: string       │        │ - cameraMicEnabled: boolean        │
│ - createdAt: Date            │        │ - discreteMode: boolean            │
├──────────────────────────────┤        │ - biometricsEnabled: boolean       │
│ + findByUserId(uid): []      │        │ - coercionCode: string | null      │
│ + create(data): Contact      │        │ - sosTimer: string                 │
│ + deleteById(id): void       │        │ - photoUrl: string | null          │
└──────────────────────────────┘        │ - highContrast: boolean            │
                                        │ - largeText: boolean               │
        │ 0..*                          │ - reduceMotion: boolean            │
┌───────▼──────────────────────┐        ├────────────────────────────────────┤
│        <<Model>>             │        │ + findByUserId(uid): Settings      │
│           Alert              │        │ + upsert(uid, data): Settings      │
├──────────────────────────────┤        └────────────────────────────────────┘
│ - id: number                 │
│ - userId: number             │
│ - latitude: number | null    │        ┌────────────────────────────────────┐
│ - longitude: number | null   │        │        <<Model>>                   │
│ - status: string             │        │       CommunityPost                │
│ - timerDuration: number      │        ├────────────────────────────────────┤
│ - createdAt: Date            │        │ - id: number                       │
├──────────────────────────────┤        │ - userId: number                   │
│ + findByUserId(uid): []      │        │ - userName: string                 │
│ + create(data): Alert        │        │ - content: string                  │
│ + resolve(id): Alert         │        │ - createdAt: Date                  │
└──────────────────────────────┘        ├────────────────────────────────────┤
                                        │ + findAll(): Post[]                │
                                        │ + create(data): Post               │
                                        └────────────────────────────────────┘

┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│        <<Service>>               │        │        <<Controller>>            │
│         AlertService             │        │       AlertController            │
├──────────────────────────────────┤        ├──────────────────────────────────┤
│ + createAlert(data): Alert       │◄───────│ + createAlert(req, res)          │
│ + notifyContacts(alert): void    │        │ + listUserAlerts(req, res)       │
│ + triggerVoiceCall(id): void     │        │ + resolveAlert(req, res)         │
│ + resolveAlert(id): Alert        │        │ + webhookRespond(req, res)       │
└──────────────────────────────────┘        └──────────────────────────────────┘

┌──────────────────────────────────┐        ┌──────────────────────────────────┐
│        <<Service>>               │        │        <<Controller>>            │
│          AuthService             │        │        AuthController            │
├──────────────────────────────────┤        ├──────────────────────────────────┤
│ + recoverAccount(email): token   │◄───────│ + recoverAccount(req, res)       │
└──────────────────────────────────┘        └──────────────────────────────────┘
```

---

## 5. Prototipação

O protótipo de alta fidelidade foi desenvolvido diretamente em código React Native com Expo, constituindo o próprio produto final. As telas implementadas são:

### Tela 1 — Onboarding (3 etapas)
- **Etapa 1:** Apresentação do aplicativo com logo e proposta de valor
- **Etapa 2:** Aviso legal e termos de uso
- **Etapa 3:** Formulário de cadastro com nome, telefone, e-mail, CPF e seletor de gênero (Mulher / Não-binária / Homem)

### Tela 2 — SOS Dashboard (tela principal)
- Saudação personalizada com nome da usuária
- Indicadores de status: GPS ativo/inativo e quantidade de contatos cadastrados
- **Botão SOS** central com animação de radar e efeito glow vermelho — acionado por pressão de 5 segundos
- Accordion de check-in de segurança com opções de duração
- Modal explicativo "Como funciona o SOS Mulher?" com passo a passo

### Tela 3 — Histórico de Alertas
- Lista de alertas em cards com status colorido (pendente, SMS enviado, chamada ativa, resolvido)
- Informações de GPS, temporizador e notificação WhatsApp por card

### Tela 4 — Comunidade
- Feed de publicações em ordem cronológica reversa
- Cards de recursos de apoio (CRAM, DEAM, Casa Abrigo) com botões de ligar e ver no mapa

### Tela 5 — Contatos de Emergência
- Lista de contatos de confiança com opções de ligar e remover
- Seção de linhas oficiais: Central da Mulher (180), Polícia (190), SAMU (192)

### Tela 6 — Perfil
- Card de perfil com foto, nome, telefone, e-mail e gênero
- 4 acordeões:
  - **Meus Dados:** edição de nome, telefone e e-mail
  - **Permissões:** GPS, câmera/microfone, notificações
  - **Segurança Avançada:** biometria, modo discreto, código de coerção
  - **Temporizador SOS:** configuração do tempo de acionamento

### Tela 7 — Acesso Restrito
- Exibida quando um usuário do gênero "Homem" tenta se cadastrar

---

## 6. Banco de Dados

### Modelo Entidade-Relacionamento (MER)

**Entidades e Atributos:**

**USERS (Usuárias)**
```
USERS {
  id          SERIAL PK
  name        TEXT NOT NULL
  phone       TEXT NOT NULL
  email       TEXT
  cpf         TEXT UNIQUE
  gender      TEXT
  password_hash TEXT
  onboarding_completed BOOLEAN DEFAULT false
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
}
```

**EMERGENCY_CONTACTS (Contatos de Emergência)**
```
EMERGENCY_CONTACTS {
  id           SERIAL PK
  user_id      INTEGER FK → USERS(id) ON DELETE CASCADE
  name         TEXT NOT NULL
  phone        TEXT NOT NULL
  relationship TEXT NOT NULL
  created_at   TIMESTAMP
}
```

**ALERTS (Alertas SOS)**
```
ALERTS {
  id             SERIAL PK
  user_id        INTEGER FK → USERS(id) ON DELETE CASCADE
  latitude       DOUBLE PRECISION
  longitude      DOUBLE PRECISION
  status         TEXT DEFAULT 'pending'
  timer_duration INTEGER DEFAULT 30
  created_at     TIMESTAMP
}
```

**SETTINGS (Configurações)**
```
SETTINGS {
  id                     SERIAL PK
  user_id                INTEGER FK → USERS(id)
  gps_enabled            BOOLEAN DEFAULT true
  notifications_enabled  BOOLEAN DEFAULT true
  camera_mic_enabled     BOOLEAN DEFAULT false
  discrete_mode          BOOLEAN DEFAULT false
  biometrics_enabled     BOOLEAN DEFAULT false
  coercion_code          TEXT
  sos_timer              TEXT DEFAULT '30'
  photo_url              TEXT
  high_contrast          BOOLEAN DEFAULT false
  large_text             BOOLEAN DEFAULT false
  reduce_motion          BOOLEAN DEFAULT false
  created_at             TIMESTAMP
  updated_at             TIMESTAMP
}
```

**COMMUNITY_POSTS (Publicações da Comunidade)**
```
COMMUNITY_POSTS {
  id         SERIAL PK
  user_id    INTEGER FK → USERS(id) ON DELETE CASCADE
  user_name  TEXT NOT NULL
  content    TEXT NOT NULL
  created_at TIMESTAMP
}
```

### Diagrama de Relacionamento (DER)

```
┌─────────────┐         ┌──────────────────────┐
│   USERS     │──────1──┤ EMERGENCY_CONTACTS   │
│  (Usuárias) │  possui │ (Contatos Emergência)│
└──────┬──────┘  0..*   └──────────────────────┘
       │
       │ 1           ┌──────────────────────┐
       ├─────────────┤       ALERTS         │
       │ gera 0..*   │   (Alertas SOS)      │
       │             └──────────────────────┘
       │
       │ 1           ┌──────────────────────┐
       ├─────────────┤      SETTINGS        │
       │ tem 0..1    │   (Configurações)    │
       │             └──────────────────────┘
       │
       │ 1           ┌──────────────────────┐
       └─────────────┤  COMMUNITY_POSTS     │
         publica 0..*│ (Feed Comunidade)    │
                     └──────────────────────┘
```

**Cardinalidades:**
- Uma usuária **possui** zero ou muitos contatos de emergência (1:N)
- Uma usuária **gera** zero ou muitos alertas SOS (1:N)
- Uma usuária **tem** zero ou uma configuração (1:1)
- Uma usuária **publica** zero ou muitas postagens (1:N)

---

## 7. Implementação

### 7.1 Estrutura das Classes

O projeto segue o padrão **MVC (Model-View-Controller)** com a seguinte organização:

```
sos-mulher/
│
├── artifacts/
│   ├── api-server/src/         ← Backend Node.js + Express
│   │   ├── models/
│   │   │   ├── UserModel.ts    ← CRUD de usuárias
│   │   │   └── AlertModel.ts   ← CRUD de alertas
│   │   ├── services/
│   │   │   ├── AuthService.ts  ← Lógica de autenticação e recuperação
│   │   │   └── AlertService.ts ← Lógica de notificação e escalada
│   │   ├── controllers/
│   │   │   ├── authController.ts      ← POST /api/auth/recover
│   │   │   ├── alertController.ts     ← POST/GET/PUT /api/alerts
│   │   │   ├── contactsController.ts  ← CRUD /api/users/:id/contacts
│   │   │   ├── postsController.ts     ← CRUD /api/posts
│   │   │   └── settingsController.ts  ← GET/PUT /api/users/:id/settings
│   │   └── routes/
│   │       ├── auth.ts, users.ts, alerts.ts,
│   │       ├── contacts.ts, posts.ts, settings.ts
│   │       └── index.ts        ← Roteador principal
│   │
│   └── mobile/app/             ← Frontend React Native (Expo Router)
│       ├── onboarding.tsx      ← Tela de cadastro (3 etapas)
│       ├── restricted.tsx      ← Tela de acesso restrito
│       └── (tabs)/
│           ├── index.tsx       ← SOS Dashboard (tela principal)
│           ├── history.tsx     ← Histórico de alertas
│           ├── community.tsx   ← Feed comunitário
│           ├── contacts.tsx    ← Contatos de emergência
│           └── profile.tsx     ← Perfil e configurações
│
└── lib/
    ├── db/src/schema/          ← Schemas do banco (Drizzle ORM)
    │   ├── users.ts
    │   ├── alerts.ts
    │   ├── emergencyContacts.ts
    │   ├── settings.ts
    │   └── communityPosts.ts
    └── api-spec/openapi.yaml   ← Contrato da API (OpenAPI 3.0)
```

**Endpoints da API REST:**

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/recover | Recuperação de conta por e-mail |
| POST | /api/users | Criar nova usuária |
| GET | /api/users/:id | Buscar usuária por ID |
| PATCH | /api/users/:id | Atualizar dados da usuária |
| POST | /api/users/:id/complete-onboarding | Marcar onboarding como concluído |
| GET | /api/users/:id/contacts | Listar contatos de emergência |
| POST | /api/users/:id/contacts | Adicionar contato de emergência |
| DELETE | /api/users/:id/contacts/:cid | Remover contato de emergência |
| POST | /api/alerts | Criar alerta SOS (Fase 1) |
| GET | /api/alerts/user/:id | Listar alertas da usuária |
| PUT | /api/alerts/:id/resolve | Resolver alerta manualmente |
| PUT | /api/alerts/:id/webhook/respond | Resolver alerta via webhook de voz |
| GET | /api/posts | Listar publicações da comunidade |
| POST | /api/posts | Criar publicação |
| GET | /api/users/:id/settings | Buscar configurações |
| PUT | /api/users/:id/settings | Salvar/atualizar configurações |

> **Código-fonte completo:** [Link do repositório GitHub — inserir aqui]

---

### 7.2 Imagem do Projeto

*Inserir capturas de tela do aplicativo em funcionamento:*

**Tela 1 — SOS Dashboard**
[Inserir screenshot da tela principal com botão SOS]

**Tela 2 — Acionamento SOS Ativo**
[Inserir screenshot da tela de alerta ativo com contagem regressiva]

**Tela 3 — Histórico de Alertas**
[Inserir screenshot da tela de histórico]

**Tela 4 — Contatos de Emergência**
[Inserir screenshot da tela de contatos]

**Tela 5 — Perfil e Configurações**
[Inserir screenshot da tela de perfil]

---

## 8. Conclusão

O projeto **SOS Mulher** demonstra como a tecnologia pode ser aplicada diretamente na proteção de grupos vulneráveis. Ao longo do desenvolvimento, a equipe enfrentou e superou desafios técnicos relevantes:

**Desafios técnicos superados:**
- Implementação de gestos de pressão prolongada com feedback visual (barra de progresso animada) usando React Native Gesture Handler e Reanimated
- Arquitetura contract-first com OpenAPI 3.0 → geração automática de hooks React Query e schemas Zod via Orval
- Persistência de dados em banco PostgreSQL com Drizzle ORM, sem ORM tradicional, usando migrações controladas por schema
- Sistema de escalonamento de alertas em duas fases com temporização configurável por usuária
- Suporte a foto de perfil em base64 com limite de payload de 10 MB no servidor

**Aprendizados:**
- A separação em camadas MVC facilita a manutenção e o teste de cada componente isoladamente
- O contrato OpenAPI como fonte de verdade elimina inconsistências entre frontend e backend
- Design orientado à segurança exige pensar em experiência do usuário em cenários de estresse extremo

**Trabalhos futuros:**
- Integração real com Twilio para envio de SMS e chamadas de voz
- Notificações push nativas (Firebase Cloud Messaging)
- Modo offline com sincronização posterior
- Autenticação com biometria nativa (FaceID / Impressão digital)
- Publicação nas lojas App Store e Google Play

---

## 9. Referências

1. **Anuário Brasileiro de Segurança Pública 2023.** Fórum Brasileiro de Segurança Pública. Disponível em: https://forumseguranca.org.br/anuario-brasileiro-seguranca-publica/

2. **Lei Maria da Penha (Lei nº 11.340/2006).** Presidência da República. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm

3. **React Native Documentation.** Meta Platforms. Disponível em: https://reactnative.dev/docs/getting-started

4. **Expo Documentation.** Expo Dev. Disponível em: https://docs.expo.dev/

5. **Express.js Documentation.** OpenJS Foundation. Disponível em: https://expressjs.com/

6. **Drizzle ORM Documentation.** Drizzle Team. Disponível em: https://orm.drizzle.team/docs/overview

7. **OpenAPI Specification 3.0.** OpenAPI Initiative. Disponível em: https://spec.openapis.org/oas/v3.0.3

8. **PostgreSQL Documentation.** The PostgreSQL Global Development Group. Disponível em: https://www.postgresql.org/docs/

9. **TanStack Query Documentation.** TanStack. Disponível em: https://tanstack.com/query/latest/docs/react/overview

10. **Zod Documentation.** Colin McDonnell. Disponível em: https://zod.dev/

---

*Documento elaborado pela equipe do Projeto Integrador I — [Nome da Instituição]*
*Data de entrega: [Inserir data]*
