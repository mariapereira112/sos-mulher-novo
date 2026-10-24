# SOS Mulher — Scripts de Banco de Dados

Esta pasta contém os scripts SQL para configurar o banco de dados manualmente
quando você optar por usar **PostgreSQL** ou **MySQL** em vez do H2 embutido.

## Quando usar estes scripts?

| Situação | O que fazer |
|---|---|
| **Rodando com H2** (padrão, sem instalar nada) | Não é necessário — o Spring Boot inicializa o banco automaticamente |
| **Rodando com PostgreSQL** | Execute `schema.sql` + `data.sql` manualmente |
| **Rodando com MySQL** | Execute `schema.sql` + `data.sql` adaptados (veja abaixo) |

---

## PostgreSQL

```bash
# 1. Crie o banco
psql -U postgres -c "CREATE DATABASE sos_mulher;"

# 2. Execute o schema
psql -U postgres -d sos_mulher -f database/schema.sql

# 3. Popule os dados de teste
psql -U postgres -d sos_mulher -f database/data.sql

# 4. Configure o backend (antes de rodar)
# Edite backend/src/main/resources/application.properties e ajuste:
# SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sos_mulher
# SPRING_DATASOURCE_USERNAME=postgres
# SPRING_DATASOURCE_PASSWORD=sua_senha
```

## MySQL

```bash
# 1. Crie o banco
mysql -u root -p -e "CREATE DATABASE sos_mulher;"

# 2. Adapte o schema (substituir SERIAL e DOUBLE PRECISION)
# SERIAL -> INT AUTO_INCREMENT
# DOUBLE PRECISION -> DOUBLE
# ON CONFLICT DO NOTHING -> INSERT IGNORE

# 3. Configure o backend
# SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sos_mulher
```

---

## Credenciais dos usuários de teste

| E-mail | Senha | Gênero |
|---|---|---|
| ana@sosmulher.com | senha123 | Mulher |
| maria@sosmulher.com | senha123 | Não-binária |
