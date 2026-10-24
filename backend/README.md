# SOS Mulher — Backend / API REST

Backend REST API para o app SOS Mulher.
Tecnologias: **Java 17 · Spring Boot 3 · PostgreSQL · JPA/Hibernate · Lombok**

## Sumário
- [Arquitetura MVC + POO](#arquitetura-mvc--poo)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
- [Como Executar](#como-executar)
- [Endpoints com Exemplos JSON](#endpoints-com-exemplos-json)
- [Conceitos de POO Aplicados](#conceitos-de-poo-aplicados)

---

## Arquitetura MVC + POO

O backend segue o padrão **MVC (Model-View-Controller)** com camada de Serviço:

```
 React Native (VIEW — artifacts/mobile/)
        │  JSON via HTTP
        ▼
 ┌──────────────────────┐
 │     CONTROLLER       │  ← Recebe a requisição HTTP, valida os dados,
 │   @RestController    │    chama o Service e retorna a resposta JSON
 └──────────┬───────────┘
            │ chama
            ▼
 ┌──────────────────────┐
 │       SERVICE        │  ← Contém a lógica de negócio
 │      @Service        │    (regras, validações, hash de senha)
 └──────────┬───────────┘
            │ usa
            ▼
 ┌──────────────────────┐
 │      REPOSITORY      │  ← Abstração do banco (queries automáticas)
 │    JpaRepository     │    Spring Data JPA gera SQL pelo nome do método
 └──────────┬───────────┘
            │ mapeia para
            ▼
 ┌──────────────────────┐
 │        MODEL         │  ← Classe Java = tabela do banco
 │       @Entity        │    Atributo = coluna | Objeto = linha
 └──────────────────────┘
            │
            ▼
     PostgreSQL / H2
```

---

## Estrutura de Pastas

```
backend/
├── pom.xml                              ← Dependências Maven (Spring Boot, PostgreSQL, Lombok)
├── mvnw / mvnw.cmd                      ← Maven Wrapper (não precisa instalar Maven)
└── src/main/
    ├── java/com/sosmulher/api/
    │   ├── SosMulherApplication.java    ← Ponto de entrada (@SpringBootApplication)
    │   │
    │   ├── entity/                      ← MODEL — Entidades JPA (representam tabelas)
    │   │   ├── User.java                   (tabela: users)
    │   │   ├── Alert.java                  (tabela: alerts)
    │   │   ├── EmergencyContact.java       (tabela: emergency_contacts)
    │   │   ├── CommunityPost.java          (tabela: community_posts)
    │   │   ├── Settings.java               (tabela: settings)
    │   │   └── AlertNotification.java      (tabela: alert_notifications)
    │   │
    │   ├── repository/                  ← Acesso ao banco (Spring Data JPA)
    │   │   ├── UserRepository.java
    │   │   ├── AlertRepository.java
    │   │   ├── EmergencyContactRepository.java
    │   │   ├── CommunityPostRepository.java
    │   │   ├── SettingsRepository.java
    │   │   └── AlertNotificationRepository.java
    │   │
    │   ├── service/                     ← Lógica de negócio
    │   │   ├── AuthService.java            (login, BCrypt, recuperação de conta)
    │   │   ├── UserService.java            (criação de usuária, regra anti-gênero)
    │   │   └── AlertService.java           (disparo SOS, escalada de chamadas)
    │   │
    │   ├── controller/                  ← CONTROLLER — Rotas REST
    │   │   ├── AuthController.java         POST /api/auth/login
    │   │   │                               POST /api/auth/recover
    │   │   ├── UserController.java         POST /api/users
    │   │   │                               GET  /api/users/{id}
    │   │   │                               PATCH /api/users/{id}
    │   │   ├── AlertController.java        POST /api/alerts
    │   │   │                               GET  /api/alerts/user/{id}
    │   │   │                               PUT  /api/alerts/{id}/resolve
    │   │   ├── ContactController.java      GET/POST/DELETE /api/users/{id}/contacts
    │   │   ├── SettingsController.java     GET/PUT /api/users/{id}/settings
    │   │   ├── PostController.java         GET/POST /api/posts
    │   │   └── HealthController.java       GET /api/healthz
    │   │
    │   ├── dto/                         ← DTOs (JSON de entrada/saída separado do Model)
    │   │   ├── LoginRequest.java
    │   │   ├── LoginResponse.java
    │   │   ├── CreateUserRequest.java
    │   │   ├── CreateAlertRequest.java
    │   │   ├── CreateContactRequest.java
    │   │   ├── UpsertSettingsRequest.java
    │   │   └── UpdateUserRequest.java
    │   │
    │   └── config/
    │       ├── SecurityConfig.java      ← Libera rotas /api/** sem autenticação JWT
    │       └── CorsConfig.java          ← CORS — permite chamadas do app React Native
    │
    └── resources/
        └── application.properties       ← Configuração do banco e do servidor
```

---

## Configuração do Banco de Dados

Arquivo: `src/main/resources/application.properties`

### Modo padrão: H2 em memória (zero configuração, roda sem instalar nada)
```properties
spring.datasource.url=jdbc:h2:mem:sos_mulher;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
spring.datasource.username=sa
spring.datasource.password=
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```
Acesse o banco visualmente em: http://localhost:8080/h2-console

### Para usar PostgreSQL:
Antes de rodar, crie o banco e defina as variáveis de ambiente:
```sql
CREATE DATABASE sos_mulher;
```
```bash
# Windows:
set SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sos_mulher
set SPRING_DATASOURCE_USERNAME=postgres
set SPRING_DATASOURCE_PASSWORD=sua_senha

# Mac/Linux:
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sos_mulher
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=sua_senha
```

### Configuração JPA/Hibernate (em `application.properties`):
```properties
spring.jpa.hibernate.ddl-auto=update      # cria/atualiza tabelas automaticamente
spring.jpa.show-sql=true                  # exibe as queries SQL no console
spring.jackson.default-property-inclusion=non_null  # omite campos null no JSON
```

---

## Como Executar

### Pré-requisitos
- **Java 17+** — [Download Adoptium](https://adoptium.net/)
- Banco: H2 embutido (nenhuma instalação necessária por padrão)

### Executar:
```bash
# Windows:
.\mvnw.cmd clean spring-boot:run

# Mac / Linux:
./mvnw clean spring-boot:run
```

Na **primeira execução**, o Maven Wrapper baixa o Maven automaticamente (~10 MB).
O Hibernate cria as tabelas automaticamente.

A API estará disponível em: **http://localhost:8080**

Teste rápido: `GET http://localhost:8080/api/healthz` → `{"status":"ok"}`

---

## Endpoints com Exemplos JSON

### Autenticação

#### `POST /api/auth/login`
**Requisição:**
```json
{
  "identifier": "maria@email.com",
  "password": "Senha@123"
}
```
**Resposta 200:**
```json
{
  "userId": 1,
  "userName": "Maria Silva",
  "phone": "11999000001"
}
```
**Resposta 401:**
```json
{ "error": "Senha incorreta. Tente novamente." }
```

---

#### `POST /api/auth/recover`
**Requisição:**
```json
{ "email": "maria@email.com" }
```
**Resposta 200:**
```json
{
  "message": "E-mail de recuperação enviado.",
  "token": "LOCAL_RECOVERY_TOKEN_1",
  "userId": "1"
}
```

---

### Usuárias

#### `POST /api/users` — Cadastro
**Requisição:**
```json
{
  "name": "Maria Silva",
  "phone": "11999000001",
  "email": "maria@email.com",
  "cpf": "123.456.789-00",
  "gender": "Mulher",
  "password": "Senha@123"
}
```
**Resposta 201:**
```json
{
  "id": 1,
  "name": "Maria Silva",
  "phone": "11999000001",
  "email": "maria@email.com",
  "gender": "Mulher",
  "onboardingCompleted": false,
  "createdAt": "2026-06-22T13:00:00Z"
}
```
> Nota: `passwordHash` nunca aparece na resposta (`@JsonIgnore`).

**Resposta 403 (gender = "Homem"):**
```json
{ "error": "restricted", "redirect": "/acesso-restrito" }
```

---

#### `GET /api/users/{id}`
**Resposta 200:**
```json
{
  "id": 1,
  "name": "Maria Silva",
  "phone": "11999000001",
  "email": "maria@email.com",
  "gender": "Mulher",
  "onboardingCompleted": true,
  "createdAt": "2026-06-22T13:00:00Z"
}
```

---

#### `PATCH /api/users/{id}`
**Requisição:**
```json
{ "name": "Maria Souza", "phone": "11988000002" }
```
**Resposta 200:** (objeto atualizado)

---

#### `POST /api/users/{id}/complete-onboarding`
**Resposta 200:**
```json
{ "id": 1, "onboardingCompleted": true }
```

---

### Contatos de Emergência

#### `GET /api/users/{id}/contacts`
**Resposta 200:**
```json
[
  {
    "id": 1,
    "name": "Mãe",
    "phone": "11988000001",
    "relationship": "Familiar"
  }
]
```

#### `POST /api/users/{id}/contacts`
**Requisição:**
```json
{
  "name": "Mãe",
  "phone": "11988000001",
  "relationship": "Familiar"
}
```
**Resposta 201:** (contato criado)

#### `DELETE /api/users/{id}/contacts/{contactId}`
**Resposta 204:** (sem corpo)

---

### Alertas SOS

#### `POST /api/alerts` — Disparo SOS (Fase 1)
**Requisição:**
```json
{
  "userId": 1,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "message": "Preciso de ajuda!"
}
```
**Resposta 201:**
```json
{
  "id": 1,
  "userId": 1,
  "status": "sms_sent",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "createdAt": "2026-06-22T13:00:00Z"
}
```

#### `GET /api/alerts/user/{id}` — Histórico
**Resposta 200:**
```json
[
  { "id": 1, "status": "resolved_by_contact", "createdAt": "2026-06-22T13:00:00Z" },
  { "id": 2, "status": "cancelled",           "createdAt": "2026-06-21T11:00:00Z" }
]
```

#### `PUT /api/alerts/{id}/resolve`
**Resposta 200:**
```json
{ "id": 1, "status": "resolved" }
```

---

### Configurações

#### `GET /api/users/{id}/settings`
**Resposta 200:**
```json
{
  "sosTimer": "30",
  "fakeCall": false,
  "locationSharing": true,
  "discreteMode": false,
  "notificationsEnabled": true
}
```

#### `PUT /api/users/{id}/settings`
**Requisição:**
```json
{ "sosTimer": "60", "discreteMode": true }
```
**Resposta 200:** (configurações atualizadas)

---

### Comunidade

#### `GET /api/posts`
**Resposta 200:**
```json
[
  {
    "id": 1,
    "content": "Fiquei segura graças ao app!",
    "createdAt": "2026-06-22T13:00:00Z"
  }
]
```

#### `POST /api/posts`
**Requisição:**
```json
{ "userId": 1, "content": "Minha experiência..." }
```
**Resposta 201:** (post criado)

---

## Conceitos de POO Aplicados

### 1. Encapsulamento
```java
// User.java — atributos privados; @Data gera getters/setters automaticamente
@Column(name = "password_hash")
@JsonIgnore  // hash NUNCA exposto nas respostas JSON da API
private String passwordHash;
```

### 2. Abstração
```java
// UserRepository — oculta os detalhes SQL
// Spring Data JPA gera a query pelo nome do método:
Optional<User> findByEmailIgnoreCase(String email);
// SQL gerado: SELECT * FROM users WHERE LOWER(email) = LOWER(?)
```

### 3. Injeção de Dependência (inversão de controle)
```java
// AuthService — Spring injeta as dependências automaticamente
@Service
@RequiredArgsConstructor  // Lombok gera o construtor com todas as dependências finais
public class AuthService {
    private final UserRepository userRepository;        // injetado pelo Spring
    private final BCryptPasswordEncoder passwordEncoder; // injetado pelo Spring
}
```

### 4. Herança
```java
// Todos os Repositories herdam de JpaRepository e ganham
// save(), findById(), findAll(), delete() sem escrever SQL
public interface UserRepository extends JpaRepository<User, Long> { ... }
public interface AlertRepository extends JpaRepository<Alert, Long> { ... }
```

### 5. Anotações Spring (tabela resumo)
| Anotação | Papel | Camada |
|---|---|---|
| `@Entity` + `@Table` | Mapeia classe → tabela do banco | Model |
| `@Id` + `@GeneratedValue` | Chave primária auto-incrementada | Model |
| `@ManyToOne` / `@OneToOne` | Relacionamentos entre entidades | Model |
| `@Repository` | Interface de acesso ao banco | Repository |
| `@Service` | Classe de lógica de negócio | Service |
| `@RestController` | Classe que responde a requisições HTTP com JSON | Controller |
| `@GetMapping` / `@PostMapping` | Define rota e método HTTP | Controller |
| `@RequestBody` | Lê o JSON do corpo da requisição | Controller |
| `@PathVariable` | Lê `{id}` da URL | Controller |
| `@Autowired` / `@RequiredArgsConstructor` | Injeção de dependência | Qualquer |

---

## Padrão de Resposta de Erro

```json
{ "error": "Mensagem descritiva do erro" }
```

| Código HTTP | Significado |
|---|---|
| 200 | Sucesso |
| 201 | Recurso criado com sucesso |
| 204 | Sem conteúdo (usado em DELETE) |
| 400 | Dados inválidos na requisição |
| 401 | Não autorizado (senha incorreta) |
| 403 | Proibido (regra de gênero) |
| 404 | Recurso não encontrado |
| 409 | Conflito (CPF ou e-mail duplicado) |
| 500 | Erro interno do servidor |
