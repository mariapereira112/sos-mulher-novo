# SOS Mulher — Passo a passo para rodar no VSCode

## O que você vai precisar instalar

| Programa | Versão | Link |
|---|---|---|
| Node.js | **24.x** | https://nodejs.org (versão 24 LTS) |
| pnpm | 9.x+ | instalado depois do Node.js |
| Banco de dados | Neon **ou** PostgreSQL local | veja abaixo |
| VSCode | qualquer | https://code.visualstudio.com |
| Expo Go | última | App Store ou Play Store |

---

## PASSO 1 — Instalar o Node.js 24

1. Acesse https://nodejs.org → baixe a **versão 24 LTS**
2. Instale com as opções padrão
3. Feche e reabra o terminal

```
node --version   → v24.x.x
npm --version    → 10.x.x
```

---

## PASSO 2 — Instalar o pnpm

```
npm install -g pnpm
pnpm --version   → 9.x.x
```

---

## PASSO 3 — Banco de dados

### Opção A — Neon (recomendado, sem instalar nada)

1. Acesse https://neon.tech e crie uma conta grátis
2. Crie um novo projeto
3. Em **Connection Details**, copie a **Connection String** (começa com `postgresql://...`)
4. Guarde essa string — você vai usá-la no Passo 6

### Opção B — PostgreSQL local (Windows)

1. Baixe em https://www.postgresql.org/download/windows
2. Instale e **anote a senha** do usuário `postgres`
3. Abra o **pgAdmin** → botão direito em Databases → Create → Database → nome: `sos_mulher`

---

## PASSO 4 — Baixar e abrir o projeto

1. Baixe o `sos-mulher.zip` deste chat
2. Extraia em uma pasta, ex: `C:\Projetos\sos-mulher`
3. VSCode → **File → Open Folder** → selecione a pasta

---

## PASSO 5 — Instalar as dependências

Terminal do VSCode (**Ctrl + `**):
```
pnpm install
```

---

## PASSO 6 — Configurar o `.env` do servidor

```
copy artifacts\api-server\.env.example artifacts\api-server\.env
```

Abra `artifacts/api-server/.env` e preencha:

**Se estiver usando Neon:**
```env
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
```
(cole a connection string copiada do painel Neon)

**Se estiver usando PostgreSQL local:**
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/sos_mulher
```

Preencha também:
```env
PORT=8080
SESSION_SECRET=qualquer-texto-longo-aqui-123
NODE_ENV=development
APP_BASE_URL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
EMERGENCY_DESTINATION_NUMBER=
```

---

## PASSO 7 — Configurar o `.env.local` do app

```
copy artifacts\mobile\.env.local.example artifacts\mobile\.env.local
```

Deixe como está (aponta para `localhost:8080`).  
⚠️ Se for abrir no **celular** com Expo Go, veja o Passo 10.

---

## PASSO 8 — Criar as tabelas no banco

```
pnpm --filter @workspace/db run push
```

Se pedir confirmação, pressione Enter ou `y`.  
Deve aparecer: `All changes applied` ou similar.

---

## PASSO 9 — Rodar o projeto (2 terminais)

Clique no `+` no painel de terminais para abrir dois terminais.

**Terminal 1 — Servidor API:**
```
pnpm --filter @workspace/api-server run dev:local
```
Aguarde: `Server listening  port: 8080`

**Terminal 2 — App mobile:**
```
pnpm --filter @workspace/mobile run dev
```
Aguarde o Metro iniciar, depois pressione **`w`** para abrir no navegador.

---

## PASSO 10 — Celular com Expo Go

> ⚠️ No celular, `localhost` não funciona — você precisa usar o IP da sua máquina.

1. Descubra seu IP local:
   - Windows CMD: `ipconfig` → "Endereço IPv4" (ex: `192.168.1.100`)
2. Edite `artifacts/mobile/.env.local`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8080
   ```
3. Reinicie o Terminal 2 (Ctrl+C → seta pra cima → Enter)
4. Escaneie o QR code com o Expo Go

---

## Sobre a tela de login/cadastro

O app tem uma tela inicial com dois botões:
- **"Criar nova conta"** → tela de cadastro (use isso na primeira vez)
- **"Entrar"** → tela de login (para quem já tem conta)

Se aparecer a tela de "Acesse sua conta", toque em **"Criar nova conta"** para registrar.

---

## Verificar se está funcionando

```
curl http://localhost:8080/api/healthz
```
Deve retornar: `{"status":"ok"}`

---

## Problemas comuns

| Problema | Solução |
|---|---|
| `DATABASE_URL must be set` | Criou o `.env` no passo 6? |
| `SSL connection required` | Adicione `?sslmode=require` no final do DATABASE_URL do Neon |
| `ECONNREFUSED` (banco local) | PostgreSQL está rodando? Verifique em Serviços do Windows |
| `Failed to fetch` no celular | Use o IP da máquina (não `localhost`) no `EXPO_PUBLIC_API_URL` |
| `Failed to fetch` no navegador | Servidor do Passo 9 Terminal 1 está rodando? |
| `pnpm: command not found` | `npm install -g pnpm` e reinicie o terminal |
| Ícones aparecem como `□` | Certifique-se de baixar o zip mais recente deste chat |
| `EADDRINUSE` porta em uso | Reinicie o computador ou encerre o processo usando a porta |
