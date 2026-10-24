# MER — Modelo Entidade-Relacionamento
## SOS Mulher

---

## Entidades

### 1. USERS (Usuárias)
Armazena as usuárias cadastradas no sistema.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| name | text | NOT NULL | Nome completo |
| phone | text | NOT NULL | Número de telefone |
| email | text | | Endereço de e-mail |
| cpf | text | UNIQUE | CPF da usuária |
| gender | text | | Gênero (Mulher / Não-binária / Homem) |
| password_hash | text | | Hash SHA-256 da senha |
| onboarding_completed | boolean | NOT NULL, DEFAULT false | Onboarding concluído |
| created_at | timestamp | NOT NULL | Data de criação |
| updated_at | timestamp | NOT NULL | Data da última atualização |

**Regra de negócio:** Usuárias com `gender = 'Homem'` recebem HTTP 403 e são redirecionadas para a tela de acesso restrito.

---

### 2. SETTINGS (Configurações)
Configurações personalizadas por usuária, persistidas no banco.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| gps_enabled | boolean | NOT NULL, DEFAULT true | GPS habilitado |
| notifications_enabled | boolean | NOT NULL, DEFAULT true | Notificações habilitadas |
| camera_mic_enabled | boolean | NOT NULL, DEFAULT false | Câmera e microfone habilitados |
| discrete_mode | boolean | NOT NULL, DEFAULT false | Modo discreto ativado |
| biometrics_enabled | boolean | NOT NULL, DEFAULT false | Biometria habilitada |
| coercion_code | text | | Código de coerção (modo disfarce) |
| sos_timer | text | NOT NULL, DEFAULT '1500' | Duração do temporizador SOS em segundos |
| photo_url | text | | URL da foto de perfil |
| high_contrast | boolean | NOT NULL, DEFAULT false | Alto contraste |
| large_text | boolean | NOT NULL, DEFAULT false | Texto grande |
| reduce_motion | boolean | NOT NULL, DEFAULT false | Reduzir animações |
| created_at | timestamp | NOT NULL | Data de criação |
| updated_at | timestamp | NOT NULL | Data da última atualização |

**Relacionamento:** Cada usuária possui exatamente uma linha de configurações (1:1). Criada automaticamente no cadastro via upsert.

---

### 3. EMERGENCY_CONTACTS (Contatos de Emergência)
Contatos pessoais de emergência cadastrados pela usuária (máximo 5).

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| name | text | NOT NULL | Nome do contato |
| phone | text | NOT NULL | Telefone do contato |
| relationship | text | NOT NULL | Grau de relacionamento |
| created_at | timestamp | NOT NULL | Data de criação |

**Relacionamento:** Uma usuária pode ter zero ou muitos contatos (1:N). Deleção em cascata.

---

### 4. ALERTS (Alertas / SOS)
Registro de cada ativação do botão SOS.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| latitude | doublePrecision | | Latitude no momento do SOS |
| longitude | doublePrecision | | Longitude no momento do SOS |
| status | text | NOT NULL, DEFAULT 'pending' | Estado do alerta |
| timer_duration | integer | NOT NULL, DEFAULT 30 | Duração do temporizador (segundos) |
| created_at | timestamp | NOT NULL | Data de criação do alerta |

**Relacionamento:** Uma usuária pode ter zero ou muitos alertas (1:N). Deleção em cascata.

---

### 5. ALERT_NOTIFICATIONS (Notificações do Alerta)
Rastreia cada notificação enviada a cada contato para cada alerta.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| alert_id | integer | FK → ALERTS, NOT NULL | Referência ao alerta |
| contact_id | integer | FK → EMERGENCY_CONTACTS, NOT NULL | Referência ao contato |
| channel | text | NOT NULL | Canal de envio (sms/whatsapp/voice) |
| response_digit | text | | Dígito de resposta do contato |
| sent_at | timestamp | NOT NULL | Data/hora do envio |

**Relacionamento:** Um alerta pode ter muitas notificações (1:N). Um contato pode receber muitas notificações (1:N). Deleção em cascata.

---

### 6. COMMUNITY_POSTS (Publicações da Comunidade)
Publicações no feed comunitário.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| user_name | text | NOT NULL | Nome da autora (desnormalizado) |
| content | text | NOT NULL | Conteúdo da publicação |
| created_at | timestamp | NOT NULL | Data de criação |

---

### 7. FEEDBACKS (Avaliações / Check-ins)
Mensagens de feedback e registros de check-in de segurança.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| message | text | NOT NULL | Conteúdo da mensagem |
| created_at | timestamp | NOT NULL | Data de criação |

**Usos:** Avaliações do app (formato `rating:N`) e check-ins de segurança (formato `check-in:safe:Xmin`).

---

### 8. INCIDENTS (Ocorrências / Denúncias)
Registro detalhado de ocorrências/denúncias de violência.

| Atributo | Tipo | Restrição | Descrição |
|----------|------|-----------|-----------|
| id | serial | PK, NOT NULL | Identificador único |
| user_id | integer | FK → USERS, NOT NULL | Referência à usuária |
| nome_completo | text | NOT NULL | Nome completo para o registro |
| cpf | text | | CPF para o registro |
| narrative | text | NOT NULL | Narrativa detalhada da ocorrência |
| attachments | jsonb | DEFAULT [] | URLs de anexos (imagens/documentos) |
| audio_url | text | | URL do áudio gravado |
| witnesses | jsonb | DEFAULT [] | Lista de testemunhas |
| created_at | timestamp | NOT NULL | Data de criação |

---

## Resumo dos Relacionamentos

| Entidade A | Cardinalidade | Entidade B | Descrição |
|-----------|---------------|-----------|-----------|
| USERS | 1 : 1 | SETTINGS | Cada usuária possui uma configuração |
| USERS | 1 : N | EMERGENCY_CONTACTS | Usuária cadastra até 5 contatos |
| USERS | 1 : N | ALERTS | Usuária pode disparar vários alertas |
| USERS | 1 : N | COMMUNITY_POSTS | Usuária pode publicar no feed |
| USERS | 1 : N | FEEDBACKS | Usuária pode enviar feedbacks |
| USERS | 1 : N | INCIDENTS | Usuária pode registrar ocorrências |
| ALERTS | 1 : N | ALERT_NOTIFICATIONS | Alerta gera notificações por contato/canal |
| EMERGENCY_CONTACTS | 1 : N | ALERT_NOTIFICATIONS | Contato pode receber múltiplas notificações |
