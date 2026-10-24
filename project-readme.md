# SOS Mulher — Guia de Uso Local

Estrutura do projeto:

```
sos-mulher/
├── backend/     → API Spring Boot (Java 17)
├── frontend/    → Interface Web (React + Vite)
└── database/    → Scripts SQL de referência (PostgreSQL/MySQL)
```

---

## Pré-requisitos

| Software | Versão mínima | Download |
|---|---|---|
| Java JDK | 17 LTS | adoptium.net |
| Node.js | 18 LTS | nodejs.org |
| Banco | H2 (embutido, sem instalar) | — |

> **H2 é o padrão.** O backend sobe sem instalar nenhum banco de dados.

---

## Opção A — Tudo junto (recomendado para apresentação)

```bat
:: Windows
build.cmd

:: Mac / Linux
./build.sh
```

Aguarda compilar → abre **http://localhost:8080**

---

## Opção B — Dois terminais (modo desenvolvimento com hot-reload)

**Terminal 1 — Backend:**
```bat
cd backend
.\mvnw.cmd spring-boot:run
```

**Terminal 2 — Frontend:**
```bat
cd frontend
npm install
npm run dev
```

Frontend em → **http://localhost:5173**

---

## H2 Console (visualizar o banco de dados)

Com o backend rodando, acesse:
- URL: **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:mem:sos_mulher`
- Usuário: `sa`
- Senha: *(deixar em branco)*

---

## Usar PostgreSQL ou MySQL

Defina a variável de ambiente antes de iniciar o backend:

```bat
:: Windows — PostgreSQL
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sos_mulher
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=sua_senha

:: Windows — MySQL
set SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sos_mulher?useSSL=false^&serverTimezone=UTC
set SPRING_DATASOURCE_USERNAME=root
set SPRING_DATASOURCE_PASSWORD=sua_senha
```

Execute os scripts da pasta `database/` antes de iniciar (veja `database/README.md`).

---

## Usuários de teste

| E-mail | Senha |
|---|---|
| ana@sosmulher.com | senha123 |
| maria@sosmulher.com | senha123 |
