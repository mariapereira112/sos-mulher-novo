# SOS Mulher — Backend API REST

Backend da aplicação **SOS Mulher**, desenvolvido com **Node.js + Express** seguindo o padrão **MVC** com **Orientação a Objetos**.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Linguagem | JavaScript (Node.js) |
| Framework | Express.js |
| Banco de dados | SQLite (arquivo local, sem instalação) |
| Padrão | MVC + OOP |
| Formato | REST API — JSON |

## Como rodar

### Pré-requisitos
- [Node.js](https://nodejs.org) instalado (versão 18 ou superior)

### Passos

```bash
# 1. Entrar na pasta
cd backend-js

# 2. Instalar dependências
npm install

# 3. Rodar o servidor
npm start
```

O servidor sobe em **http://localhost:3000**

> O banco de dados SQLite é criado automaticamente em `data/sos.db` na primeira execução.

---

## Estrutura MVC

```
backend-js/
├── src/
│   ├── index.js          ← Entrada do servidor (Express)
│   ├── db.js             ← Configuração do banco SQLite
│   ├── models/           ← Modelos (OOP — acesso ao banco)
│   │   ├── User.js
│   │   ├── Alert.js
│   │   ├── Contact.js
│   │   ├── Post.js
│   │   └── Settings.js
│   ├── controllers/      ← Controladores (lógica HTTP)
│   │   ├── userController.js
│   │   ├── alertController.js
│   │   ├── contactController.js
│   │   ├── postController.js
│   │   └── settingsController.js
│   └── routes/           ← Rotas (mapeamento URL → Controller)
│       ├── users.js
│       ├── alerts.js
│       ├── contacts.js
│       ├── posts.js
│       └── settings.js
└── data/
    └── sos.db            ← Banco de dados SQLite (criado automaticamente)
```

---

## Endpoints da API

### Usuários
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/users` | Criar usuário (retorna 403 se gênero = "Homem") |
| POST | `/api/users/login` | Login por nome + senha |
| GET | `/api/users/:id` | Buscar usuário por ID |
| PATCH | `/api/users/:id` | Atualizar dados do usuário |
| POST | `/api/users/:id/complete-onboarding` | Marcar onboarding completo |

### Alertas SOS
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/alerts` | Criar alerta de emergência |
| GET | `/api/alerts/user/:userId` | Histórico de alertas do usuário |
| PUT | `/api/alerts/:id/resolve` | Resolver alerta |
| PUT | `/api/alerts/:id/status` | Atualizar status do alerta |

### Contatos de Emergência
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/contacts` | Adicionar contato |
| GET | `/api/contacts/:userId` | Listar contatos do usuário |
| DELETE | `/api/contacts/:id` | Remover contato |

### Comunidade
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/posts` | Listar todos os posts |
| POST | `/api/posts` | Criar post |
| GET | `/api/posts/user/:userId` | Posts de um usuário |

### Configurações
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/settings/:userId` | Buscar configurações |
| PUT | `/api/settings/:userId` | Salvar configurações |

---

## Exemplos de Requisição

### Criar usuário
```http
POST /api/users
Content-Type: application/json

{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "cpf": "123.456.789-00",
  "gender": "Mulher",
  "password": "senha123"
}
```

### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "name": "Maria Silva",
  "password": "senha123"
}
```

### Criar alerta SOS
```http
POST /api/alerts
Content-Type: application/json

{
  "userId": 1,
  "latitude": -27.5954,
  "longitude": -48.5480
}
```

### Adicionar contato
```http
POST /api/contacts
Content-Type: application/json

{
  "userId": 1,
  "name": "Ana (Mãe)",
  "phone": "47999990000",
  "relationship": "Mãe"
}
```

---

## Banco de Dados

Banco utilizado: **SQLite** (arquivo `data/sos.db`)

### Tabelas

| Tabela | Descrição |
|---|---|
| `users` | Usuários cadastrados |
| `contacts` | Contatos de emergência |
| `alerts` | Alertas SOS disparados |
| `posts` | Posts da comunidade |
| `settings` | Configurações do usuário |
