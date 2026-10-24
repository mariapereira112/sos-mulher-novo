# -*- coding: utf-8 -*-
import unicodedata, os
from fpdf import FPDF

# ── helpers ──────────────────────────────────────────────────────────────────
def c(txt):
    """Transliterate to latin-1 safe string."""
    return unicodedata.normalize('NFKD', str(txt)).encode('latin-1','replace').decode('latin-1')

BASE   = '/home/runner/workspace/attached_assets'
ASSETS = {
    'uc'     : f'{BASE}/uc_bw.png',
    'classes': f'{BASE}/classes_bw.png',
    'mvc'    : f'{BASE}/mvc_bw.png',
    'estrut' : f'{BASE}/estrutura2_bw.png',
    'proto'  : f'{BASE}/prototipacao.jpg',
    'twilio' : f'{BASE}/API-wtilio_1782252099065.jpg',
}

# brand colours
CRIM  = (230, 57,  70)   # #e63946
DARK  = ( 28, 28,  30)   # #1c1c1e
CARD  = ( 44, 44,  46)   # #2c2c2e
WHITE = (255,255, 255)
LGRAY = (245,245, 245)
MGRAY = (180,180, 180)
BLACK = (  0,  0,   0)

# ── PDF ───────────────────────────────────────────────────────────────────────
class Doc(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(18, 18, 18)
        self.PW = self.w - 36   # printable width

    # ── decorative header bar (coloured) ─────────────────────────────────────
    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*CRIM)
        self.rect(0, 0, self.w, 7, 'F')
        self.set_y(10)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_fill_color(*CRIM)
        self.rect(0, self.h-8, self.w, 8, 'F')
        self.set_font('Helvetica','',7)
        self.set_text_color(*WHITE)
        self.cell(0, 8, c(f'SOS Mulher  |  PI2 – Avaliacao 2  |  Equipe Maria Janaina  |  Pag. {self.page_no()}'), align='C')

    # ── section heading ───────────────────────────────────────────────────────
    def sec(self, title):
        self.ln(4)
        self.set_fill_color(*CRIM)
        self.set_text_color(*WHITE)
        self.set_font('Helvetica','B',12)
        self.cell(self.PW, 9, c(f'  {title}'), ln=True, fill=True)
        self.set_text_color(*BLACK)
        self.ln(3)

    def subsec(self, title):
        self.ln(2)
        self.set_fill_color(*LGRAY)
        self.set_draw_color(*CRIM)
        self.set_font('Helvetica','B',10)
        self.cell(self.PW, 7, c(f'  {title}'), ln=True, fill=True, border='L')
        self.set_draw_color(0,0,0)
        self.ln(2)

    def body(self, txt):
        self.set_font('Helvetica','',9.5)
        self.set_text_color(*BLACK)
        self.multi_cell(self.PW, 5, c(txt))
        self.ln(1)

    def bullet(self, items, indent=4):
        self.set_font('Helvetica','',9.5)
        self.set_text_color(*BLACK)
        for it in items:
            self.set_x(self.l_margin + indent)
            self.multi_cell(self.PW - indent, 5, c(f'• {it}'))
        self.ln(1)

    def req_row(self, rid, desc, pri='Alta', cat=''):
        self.set_font('Helvetica','B',9)
        self.set_fill_color(*LGRAY)
        self.cell(18,6,c(rid),border=1,fill=True)
        self.set_font('Helvetica','',9)
        self.cell(self.PW-60,6,c(desc),border=1)
        self.cell(18,6,c(pri),border=1,align='C')
        self.cell(24,6,c(cat),border=1,ln=True,align='C')

    def req_header(self, cols):
        self.set_font('Helvetica','B',9)
        self.set_fill_color(*CRIM)
        self.set_text_color(*WHITE)
        for col,w in cols:
            self.cell(w,7,c(col),border=1,fill=True,align='C')
        self.ln()
        self.set_text_color(*BLACK)

    def fig(self, path, caption, w=None):
        if not os.path.exists(path):
            return
        if w is None:
            w = self.PW * 0.85
        x = (self.w - w) / 2
        # border box
        self.set_draw_color(*MGRAY)
        self.set_fill_color(250,250,250)
        self.rect(x-2, self.get_y()-1, w+4, 4, 'F')
        self.image(path, x=x, w=w)
        self.ln(2)
        self.set_font('Helvetica','I',8.5)
        self.set_text_color(90,90,90)
        self.cell(self.PW, 5, c(caption), ln=True, align='C')
        self.set_text_color(*BLACK)
        self.set_draw_color(0,0,0)
        self.ln(4)

    def info_card(self, label, value):
        self.set_fill_color(*LGRAY)
        self.set_font('Helvetica','B',9)
        self.cell(50,6,c(label),border=1,fill=True)
        self.set_font('Helvetica','',9)
        self.cell(self.PW-50,6,c(value),border=1,ln=True)

    def divider(self):
        self.set_draw_color(*CRIM)
        self.set_line_width(0.5)
        self.line(self.l_margin, self.get_y(), self.l_margin+self.PW, self.get_y())
        self.set_line_width(0.2)
        self.set_draw_color(0,0,0)
        self.ln(3)

# ═══════════════════════════════════════════════════════════════════════════════
pdf = Doc()
pdf.set_title('PI2 - Documentacao Final')

# ── CAPA ──────────────────────────────────────────────────────────────────────
pdf.add_page()
# full dark background
pdf.set_fill_color(*DARK)
pdf.rect(0,0,pdf.w,pdf.h,'F')
# crimson banner top
pdf.set_fill_color(*CRIM)
pdf.rect(0,0,pdf.w,22,'F')
# crimson banner bottom
pdf.rect(0,pdf.h-22,pdf.w,22,'F')

# Logo / icon area
pdf.set_fill_color(*CRIM)
pdf.set_draw_color(*WHITE)
pdf.set_line_width(0.5)
pdf.ellipse((pdf.w-40)/2, 28, 40, 40, 'FD')
pdf.set_font('Helvetica','B',22)
pdf.set_text_color(*WHITE)
pdf.set_y(35)
pdf.cell(0,15,'SOS',align='C',ln=True)
pdf.set_font('Helvetica','',9)
pdf.cell(0,5,'BOTAO DE EMERGENCIA',align='C',ln=True)

pdf.set_y(82)
pdf.set_font('Helvetica','B',24)
pdf.set_text_color(*WHITE)
pdf.cell(0,12,c('SOS MULHER'),align='C',ln=True)
pdf.set_font('Helvetica','',12)
pdf.set_text_color(*CRIM)
pdf.cell(0,7,c('Aplicativo de Seguranca para Mulheres em Situacao de Vulnerabilidade'),align='C',ln=True)

# divider line
pdf.ln(6)
pdf.set_draw_color(*CRIM)
pdf.set_line_width(1)
pdf.line(30,pdf.get_y(),pdf.w-30,pdf.get_y())
pdf.set_line_width(0.2)
pdf.ln(8)

# metadata cards
pdf.set_font('Helvetica','',10)
pdf.set_text_color(*MGRAY)
metas = [
    ('Disciplina',   'Projeto Integrador 2  –  Avaliacao 2'),
    ('Equipe',       'Maria Janaina'),
    ('Tecnologia',   'Node.js 24 | TypeScript 5.9 | Expo React Native | PostgreSQL (Neon Cloud)'),
    ('Notificacoes', 'Twilio WhatsApp + Voz Automatizada'),
    ('Data',         'Junho de 2026'),
]
for label, val in metas:
    pdf.set_x(22)
    pdf.set_font('Helvetica','B',9)
    pdf.set_text_color(*CRIM)
    pdf.cell(45,7,c(label+':'))
    pdf.set_font('Helvetica','',9)
    pdf.set_text_color(*WHITE)
    pdf.cell(0,7,c(val),ln=True)

# ── SUMARIO ───────────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('SUMARIO')
sections = [
    ('1', 'Introducao e Contextualizacao'),
    ('2', 'Requisitos do Sistema'),
    ('  2.1', 'Requisitos Funcionais (RF)'),
    ('  2.2', 'Requisitos Nao Funcionais (RNF)'),
    ('3', 'Casos de Uso'),
    ('4', 'Arquitetura do Sistema'),
    ('  4.1', 'Padrao MVC com TypeScript'),
    ('  4.2', 'Diagrama de Classes'),
    ('  4.3', 'Estrutura de Modelos (POO)'),
    ('5', 'Banco de Dados – PostgreSQL Neon Cloud'),
    ('6', 'Integracao e Notificacoes – Twilio'),
    ('7', 'Prototipacao das Telas'),
    ('8', 'Conclusao e Consideracoes Finais'),
    ('', 'Anexos'),
]
for num, title in sections:
    pdf.set_font('Helvetica','B' if len(num)<=2 else '',10 if len(num)<=2 else 9)
    pdf.set_text_color(*CRIM if len(num)<=2 else BLACK)
    pdf.cell(20,6,c(num))
    pdf.set_text_color(*BLACK)
    pdf.cell(0,6,c(title),ln=True)
pdf.divider()

# ── 1. INTRODUCAO ─────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('1. Introducao e Contextualizacao')
pdf.body(
    'O SOS Mulher e um aplicativo movel premium desenvolvido para oferecer seguranca imediata '
    'a mulheres em situacoes de vulnerabilidade ou perigo. O sistema permite acionar alertas '
    'de emergencia com um unico toque prolongado, notificando automaticamente contatos de '
    'confianca via WhatsApp e ligacao de voz automatizada.'
)
pdf.body(
    'O projeto foi concebido como resposta a realidade brasileira de violencia de genero, '
    'integrando tecnologias modernas de comunicacao (Twilio), banco de dados em nuvem '
    '(PostgreSQL Neon Cloud) e interface mobile nativa (Expo React Native), garantindo '
    'acesso rapido, seguro e discreto ao socorro.'
)
pdf.divider()
pdf.subsec('Objetivo Geral')
pdf.body(
    'Desenvolver uma solucao tecnologica full-stack que permita a mulheres acionarem alertas '
    'de emergencia georreferenciados, com escalonamento automatico de notificacoes e '
    'registro auditavel de ocorrencias.'
)
pdf.subsec('Objetivos Especificos')
pdf.bullet([
    'Implementar autenticacao segura com hash de senha e recuperacao de conta por e-mail.',
    'Criar fluxo de SOS com pressionamento prolongado (1,5 s) → SMS/WhatsApp → Ligacao de voz.',
    'Persistir historico de alertas e status em banco de dados PostgreSQL (Neon Cloud).',
    'Oferecer comunidade, registro de ocorrencias e gerenciamento de contatos de emergencia.',
    'Garantir que somente mulheres e pessoas nao-binarias tenham acesso ao aplicativo.',
    'Produzir codigo limpo, tipado (TypeScript) e documentado seguindo padrao MVC.',
])
pdf.divider()
pdf.subsec('Stack Tecnologica')
stack_items = [
    ('Mobile (Frontend)','Expo 52 + React Native + Expo Router – telas nativas iOS/Android'),
    ('Backend (API)','Node.js 24 + Express 5 + TypeScript 5.9 – porta 8080'),
    ('Banco de Dados','PostgreSQL 16 – Neon Cloud (serverless, SSL obrigatorio)'),
    ('ORM','Drizzle ORM + drizzle-kit – migracao e tipagem do schema'),
    ('Validacao','Zod v4 + Orval codegen – schemas gerados do OpenAPI 3.1'),
    ('Notificacoes','Twilio WhatsApp Sandbox + Twilio Voice (TwiML)'),
    ('Monorepo','pnpm workspaces – libs compartilhadas: db, api-spec, api-client-react, api-zod'),
    ('Logs','Pino (structured JSON) + pino-pretty em dev'),
]
for tech, desc in stack_items:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',9)
    pdf.cell(42,6,c(tech),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.cell(pdf.PW-42,6,c(desc),border=1,ln=True)
pdf.ln(2)

# ── 2. REQUISITOS ─────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('2. Requisitos do Sistema')
pdf.subsec('2.1 Requisitos Funcionais (RF)')
pdf.req_header([('ID',18),('Descricao',pdf.PW-60),('Prioridade',18),('Categoria',24)])
rfs = [
    ('RF01','Cadastrar usuario com nome, CPF, e-mail, senha e genero','Alta','Auth'),
    ('RF02','Bloquear cadastro para genero "Homem" com redirect para tela restrita','Alta','Auth'),
    ('RF03','Realizar login por nome + senha com hash bcrypt','Alta','Auth'),
    ('RF04','Recuperar conta por e-mail (token simulado)','Media','Auth'),
    ('RF05','Acionar alerta SOS com pressionamento de 1,5 segundo','Alta','SOS'),
    ('RF06','Enviar WhatsApp para todos os contatos ao criar alerta (Fase 1)','Alta','SOS'),
    ('RF07','Iniciar ligacao de voz automatizada apos temporizador (Fase 2)','Alta','SOS'),
    ('RF08','Resolver alerta via webhook ao pressionar digito 1 na chamada','Alta','SOS'),
    ('RF09','Cancelar alerta ativo com protecao contra race condition','Alta','SOS'),
    ('RF10','Registrar historico de alertas com status e timestamp','Alta','SOS'),
    ('RF11','Gerenciar ate 5 contatos de emergencia personalizados','Alta','Contatos'),
    ('RF12','Exibir linhas oficiais de ajuda (180, 190, 192)','Alta','Contatos'),
    ('RF13','Publicar e visualizar posts na comunidade','Media','Comunidade'),
    ('RF14','Registrar boletim de ocorrencia com descricao e data','Media','BO'),
    ('RF15','Persistir configuracoes de seguranca e temporizador no banco','Media','Perfil'),
    ('RF16','Gravar e enviar mensagem de voz no alerta','Baixa','SOS'),
]
for r in rfs:
    pdf.req_row(*r)
pdf.ln(4)

pdf.subsec('2.2 Requisitos Nao Funcionais (RNF)')
pdf.req_header([('ID',18),('Descricao',pdf.PW-60),('Prioridade',18),('Categoria',24)])
rnfs = [
    ('RNF01','Banco de dados PostgreSQL 16 na Neon Cloud com SSL','Alta','BD'),
    ('RNF02','API REST documentada em OpenAPI 3.1 (contract-first)','Alta','Arqt.'),
    ('RNF03','Toda comunicacao API via HTTPS/TLS','Alta','Seg.'),
    ('RNF04','Senhas armazenadas com bcrypt (hash+salt)','Alta','Seg.'),
    ('RNF05','Codegen automatico: OpenAPI → Zod + React Query hooks','Alta','Dev'),
    ('RNF06','Monorepo pnpm com pacotes compartilhados tipados','Media','Dev'),
    ('RNF07','Logs estruturados JSON via Pino (nunca console.log)','Media','Ops'),
    ('RNF08','App em tema escuro permanente (#1c1c1e / #e63946)','Media','UX'),
    ('RNF09','Resposta da API < 500ms em operacoes nao-SOS','Media','Perf.'),
    ('RNF10','TypeScript strict em todos os pacotes','Alta','Dev'),
]
for r in rnfs:
    pdf.req_row(*r)
pdf.ln(2)

# ── 3. CASOS DE USO ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('3. Casos de Uso')
pdf.body(
    'O diagrama abaixo apresenta os principais casos de uso do sistema SOS Mulher, '
    'identificando atores externos e as interacoes com o sistema. O ator principal e '
    'a Usuario (mulher), e o ator secundario e o Sistema Twilio para notificacoes.'
)
pdf.fig(ASSETS['uc'], 'Figura 1 – Diagrama de Casos de Uso (UML)', w=pdf.PW*0.80)

pdf.subsec('Descricao dos Casos de Uso Principais')
ucs = [
    ('UC01 – Login','Usuario insere nome e senha; sistema valida hash e inicia sessao.'),
    ('UC02 – Cadastro','Coleta CPF, genero, e-mail, senha; bloqueia genero "Homem" (RF02).'),
    ('UC03 – Acionar SOS','Pressionamento de 1,5 s cria alerta; inclui UC04 e estende UC05.'),
    ('UC04 – Enviar WhatsApp','Disparo imediato de mensagem Twilio para contatos cadastrados.'),
    ('UC05 – Ligacao de Voz','Apos temporizador, Twilio efetua chamada automatizada (<<extend>>).'),
    ('UC06 – Cancelar Alerta','Cancela alerta ativo; guard impede chamadas de voz em andamento.'),
    ('UC07 – Ver Historico','Lista alertas do usuario com status (pending/sms_sent/resolved).'),
    ('UC08 – Boletim de Ocorrencia','Registra descricao de incidente com data para historico.'),
    ('UC09 – Gerenciar Contatos','CRUD de ate 5 contatos de emergencia personalizados.'),
    ('UC10 – Configurar Perfil','Atualiza dados pessoais, permissoes e temporizador (DB).'),
]
for code, desc in ucs:
    pdf.set_font('Helvetica','B',9)
    pdf.cell(52,6,c(code),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.set_fill_color(*LGRAY)
    pdf.cell(pdf.PW-52,6,c(desc),border=1,ln=True)
pdf.ln(2)

# ── 4. ARQUITETURA ────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('4. Arquitetura do Sistema')
pdf.body(
    'O sistema adota o padrao arquitetural MVC (Model-View-Controller) com separacao '
    'clara de responsabilidades, implementado em TypeScript com Drizzle ORM para '
    'acesso ao banco de dados Neon Cloud.'
)
pdf.subsec('4.1 Padrao MVC com TypeScript e Drizzle ORM')
pdf.fig(ASSETS['mvc'], 'Figura 2 – Arquitetura MVC (TypeScript + Drizzle ORM + Neon Cloud)', w=pdf.PW*0.90)

layers = [
    ('Model (Drizzle ORM)','UserModel, AlertModel, FeedbackModel, IncidentModel – queries tipadas ao PostgreSQL Neon Cloud.'),
    ('Service (Logica)','AlertService, AuthService – regras de negocio: SOS escalation, hash senha, Twilio.'),
    ('Controller (HTTP)','alertController, authController – valida input (Zod), chama Service, retorna JSON.'),
    ('Route (Express 5)','/api/alerts, /api/auth, /api/users, /api/contacts, /api/settings, /api/posts.'),
    ('Codegen (Orval)','OpenAPI 3.1 → React Query hooks (@workspace/api-client-react) + Zod schemas (@workspace/api-zod).'),
]
for layer, desc in layers:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',9)
    pdf.cell(48,6,c(layer),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.cell(pdf.PW-48,6,c(desc),border=1,ln=True)
pdf.ln(4)

pdf.subsec('4.2 Diagrama de Classes')
pdf.fig(ASSETS['classes'], 'Figura 3 – Diagrama de Classes (UML – Notacao Portuguesa)', w=pdf.PW*0.90)

pdf.add_page()
pdf.sec('4. Arquitetura do Sistema (continuacao)')
pdf.subsec('4.3 Estrutura de Modelos (POO)')
pdf.body(
    'Os modelos seguem orientacao a objetos com encapsulamento das queries Drizzle, '
    'retornando objetos tipados para as camadas superiores.'
)
pdf.fig(ASSETS['estrut'], 'Figura 4 – Estrutura de Modelos POO (classes TypeScript)', w=pdf.PW*0.80)

# ── 5. BANCO DE DADOS ────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('5. Banco de Dados – PostgreSQL Neon Cloud')
pdf.body(
    'O projeto utiliza PostgreSQL 16 hospedado na Neon Cloud, plataforma serverless '
    'que oferece escalabilidade automatica, backups gerenciados e conexao segura via SSL. '
    'O ORM Drizzle gerencia o schema e as migracoes.'
)
pdf.subsec('String de Conexao (formato Neon Cloud)')
pdf.set_fill_color(30,30,30)
pdf.set_text_color(*CRIM)
pdf.set_font('Courier','',8.5)
pdf.multi_cell(pdf.PW, 5, c('postgresql://usuario:senha@ep-xxxx-yyyy.us-east-2.aws.neon.tech/sos_mulher?sslmode=require'))
pdf.set_text_color(*BLACK)
pdf.ln(3)

pdf.subsec('Tabelas do Schema (Drizzle ORM)')
tables = [
    ('users','id, name, email, cpf, gender, passwordHash, onboardingComplete, createdAt'),
    ('emergency_contacts','id, userId, name, phone, relationship, createdAt'),
    ('alerts','id, userId, status, latitude, longitude, timerDuration, voicePath, createdAt'),
    ('alert_notifications','id, alertId, contactId, channel, status, sentAt'),
    ('community_posts','id, userId, content, category, createdAt'),
    ('settings','id, userId, silentMode, disguiseMode, timerDuration, shareLocation, updatedAt'),
    ('incidents','id, userId, description, location, occurredAt, createdAt'),
    ('feedbacks','id, userId, type, message, createdAt'),
]
pdf.req_header([('Tabela',52),('Colunas Principais',pdf.PW-52)])
for tbl, cols in tables:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',9)
    pdf.cell(52,6,c(tbl),border=1,fill=True)
    pdf.set_font('Helvetica','',8.5)
    pdf.cell(pdf.PW-52,6,c(cols),border=1,ln=True)
pdf.ln(4)

pdf.subsec('Status do Alerta (maquina de estados)')
estados = [
    ('pending',     'Alerta criado, aguardando envio de notificacoes.'),
    ('sms_sent',    'WhatsApp/SMS enviados para todos os contatos (Fase 1 concluida).'),
    ('calling_cloud','Ligacao de voz iniciada via Twilio apos temporizador (Fase 2).'),
    ('resolved_by_contact','Contato pressionou digito 1 na chamada – emergencia resolvida.'),
    ('cancelled',   'Usuario cancelou o alerta; guard impede chamadas em andamento.'),
]
for status, desc in estados:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',8.5)
    pdf.cell(40,6,c(status),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.cell(pdf.PW-40,6,c(desc),border=1,ln=True)
pdf.ln(2)

# ── 6. INTEGRACAO TWILIO ──────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('6. Integracao e Notificacoes – Twilio')
pdf.body(
    'O sistema utiliza a plataforma Twilio para duas modalidades de notificacao: '
    'mensagens via WhatsApp (imediatas) e ligacoes de voz automatizadas (Fase 2 do SOS). '
    'A integracao e configurada por variaveis de ambiente e opera de forma graceful: '
    'se as vars nao estiverem presentes, o sistema simula o envio sem erros.'
)
pdf.divider()
pdf.subsec('Fluxo de Escalacao SOS (3 Fases)')
fases = [
    ('Fase 1 – WhatsApp',
     'POST /api/alerts cria o alerta com status "pending".\n'
     'AlertService.sendWhatsAppNotifications() dispara mensagem Twilio para cada contato.\n'
     'Numeros BR testados em formato duplo (+5547X e +55X) para garantir entrega.\n'
     'Status atualizado para "sms_sent" apos envio.'),
    ('Fase 2 – Ligacao de Voz',
     'setTimeout(timerDuration) agenda POST /api/alerts/trigger-voice.\n'
     'AlertService.triggerVoiceCall() chama Twilio Calls API com TwiML "<Say>".\n'
     'Guard verifica status != "resolved_by_contact" e != "cancelled" antes de ligar.\n'
     'Status atualizado para "calling_cloud".'),
    ('Fase 3 – Webhook de Resposta',
     'Contato pressiona digito 1 no teclado durante a chamada.\n'
     'PUT /api/alerts/:id/webhook/respond recebe o digito via TwiML.\n'
     'Status atualizado para "resolved_by_contact" – emergencia encerrada.'),
]
for fase, desc in fases:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',10)
    pdf.cell(pdf.PW,7,c(f'  {fase}'),border=1,fill=True,ln=True)
    pdf.set_font('Helvetica','',9)
    pdf.multi_cell(pdf.PW,5,c(desc),border='LRB')
    pdf.ln(3)

pdf.subsec('Comprovante de Integracao Twilio WhatsApp')
pdf.fig(ASSETS['twilio'], 'Figura 5 – Mensagem WhatsApp recebida via Twilio Sandbox', w=pdf.PW*0.70)

pdf.subsec('Variaveis de Ambiente Necessarias')
envvars = [
    ('TWILIO_ACCOUNT_SID','SID da conta Twilio (ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
    ('TWILIO_AUTH_TOKEN','Token de autenticacao da conta Twilio'),
    ('TWILIO_PHONE_NUMBER','Numero Twilio origem (whatsapp:+14155238886 para sandbox)'),
    ('EMERGENCY_DESTINATION_NUMBER','Numero de destino para ligacao de voz de emergencia'),
    ('SESSION_SECRET','Segredo para sessoes Express (min 32 chars)'),
    ('DATABASE_URL','String de conexao PostgreSQL Neon Cloud com sslmode=require'),
]
pdf.req_header([('Variavel',60),('Descricao',pdf.PW-60)])
for var, desc in envvars:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Courier','B',8.5)
    pdf.cell(60,6,c(var),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.cell(pdf.PW-60,6,c(desc),border=1,ln=True)
pdf.ln(2)

# ── 7. PROTOTIPACAO ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('7. Prototipacao das Telas')
pdf.body(
    'As telas foram prototipadas com tema escuro permanente (#1c1c1e de fundo, '
    '#e63946 crimson como cor de destaque). O app utiliza Expo Router com 5 abas '
    'e botao SOS central elevado.'
)
pdf.fig(ASSETS['proto'], 'Figura 6 – Prototipacao das Telas Principais (tema escuro)', w=pdf.PW*0.85)

pdf.subsec('Telas Implementadas')
telas = [
    ('Onboarding (3 passos)','Intro → Aviso Legal → Cadastro com CPF + seletor de genero'),
    ('Acesso Restrito','Tela exibida ao genero "Homem" – sem acesso ao app'),
    ('Dashboard SOS (tab 1)','Botao SOS com pressionamento prolongado + cards GPS/contatos + check-in'),
    ('Historico (tab 2)','Lista de alertas do DB com badges de status coloridos'),
    ('Comunidade (tab 3)','Feed cronologico de posts da base de dados'),
    ('Contatos (tab 4)','Linhas oficiais 180/190/192 + ate 5 contatos personalizados'),
    ('Perfil (tab 5)','4 accordions: Dados Pessoais, Permissoes, Seguranca Avancada, Temporizador'),
    ('Boletim de Ocorrencia','Formulario para registro de incidentes com localizacao'),
    ('Modo Disfarce','Tela alternativa discreta para situacoes de perigo imediato'),
]
pdf.req_header([('Tela',58),('Descricao',pdf.PW-58)])
for tela, desc in telas:
    pdf.set_fill_color(*LGRAY)
    pdf.set_font('Helvetica','B',9)
    pdf.cell(58,6,c(tela),border=1,fill=True)
    pdf.set_font('Helvetica','',9)
    pdf.cell(pdf.PW-58,6,c(desc),border=1,ln=True)
pdf.ln(2)

# ── 8. CONCLUSAO ─────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('8. Conclusao e Consideracoes Finais')
pdf.body(
    'O aplicativo SOS Mulher representa uma solucao tecnologica completa e funcional '
    'para a seguranca de mulheres em situacoes de vulnerabilidade. O projeto entrega '
    'um sistema full-stack robusto, com arquitetura bem definida, integracao real com '
    'servicos de comunicacao e banco de dados em nuvem.'
)
pdf.body(
    'A escolha da Neon Cloud para o PostgreSQL garante disponibilidade 24/7, conexoes '
    'seguras via SSL e escalabilidade sem necessidade de administracao de servidor, '
    'essencial para um aplicativo de emergencia que deve estar sempre disponivel.'
)
pdf.body(
    'A integracao com Twilio para WhatsApp e voz automatizada eleva o nivel de resposta '
    'do sistema, saindo de simples notificacoes push para uma escalacao real de '
    'emergencia com confirmacao humana via teclado telefonico.'
)
pdf.divider()
pdf.subsec('Resultados Alcancados')
pdf.bullet([
    'Sistema full-stack funcional: API REST + Mobile Expo + PostgreSQL Neon Cloud.',
    'Autenticacao completa com hash bcrypt e recuperacao de conta.',
    'Fluxo SOS de 3 fases com Twilio WhatsApp + Voz + Webhook de resolucao.',
    'Arquitetura MVC em TypeScript com codegen automatico (OpenAPI → Zod + React Query).',
    'Prototipo de alta fidelidade com 9 telas implementadas em React Native.',
    'Banco de dados com 8 tabelas, schema gerenciado pelo Drizzle ORM.',
    'Controle de acesso por genero com redirect para tela restrita.',
    'Logs estruturados (Pino) e validacao de entrada (Zod) em todas as rotas.',
])
pdf.divider()
pdf.subsec('Proximos Passos')
pdf.bullet([
    'Implementar autenticacao JWT para sessoes stateless em producao.',
    'Adicionar notificacoes push (Expo Push Notifications) para alertas em segundo plano.',
    'Integrar GPS real com rastreamento de localizacao em tempo real.',
    'Deploy producao: API no Railway/Render + App nas lojas Google Play e App Store.',
    'Adicionar testes automatizados (Jest + Supertest para API, Detox para mobile).',
])

# ── ANEXOS ────────────────────────────────────────────────────────────────────
pdf.add_page()
pdf.sec('Anexos')
pdf.subsec('Anexo A – Endpoints da API REST')
endpoints = [
    ('POST',   '/api/users',                    'Criar usuario (anti-male rule: 403 para "Homem")'),
    ('GET',    '/api/users/:userId',             'Buscar usuario por ID'),
    ('PATCH',  '/api/users/:userId',             'Atualizar dados do usuario'),
    ('POST',   '/api/users/:userId/complete-onboarding','Marcar onboarding como concluido'),
    ('POST',   '/api/auth/login',               'Login por nome + senha'),
    ('POST',   '/api/auth/recover',             'Recuperacao de conta por e-mail'),
    ('POST',   '/api/alerts',                   'Criar alerta SOS + Fase 1 WhatsApp'),
    ('GET',    '/api/alerts/user/:userId',      'Listar alertas do usuario'),
    ('PUT',    '/api/alerts/:id/resolve',       'Resolver alerta manualmente'),
    ('PUT',    '/api/alerts/:id/webhook/respond','Webhook Twilio – digito 1 resolve'),
    ('POST',   '/api/alerts/trigger-voice',     'Disparar ligacao de voz (Fase 2)'),
    ('GET',    '/api/contacts/:userId',         'Listar contatos de emergencia'),
    ('POST',   '/api/contacts',                 'Criar contato de emergencia'),
    ('DELETE', '/api/contacts/:id',             'Remover contato'),
    ('GET',    '/api/posts',                    'Listar posts da comunidade'),
    ('POST',   '/api/posts',                    'Publicar post na comunidade'),
    ('GET',    '/api/settings/:userId',         'Buscar configuracoes do usuario'),
    ('PUT',    '/api/settings/:userId',         'Atualizar configuracoes (upsert)'),
    ('GET',    '/api/incidents/:userId',        'Listar boletins de ocorrencia'),
    ('POST',   '/api/incidents',                'Registrar boletim de ocorrencia'),
    ('GET',    '/api/healthz',                  'Health check da API'),
]
pdf.req_header([('Metodo',22),('Rota',74),('Descricao',pdf.PW-96)])
for meth, route, desc in endpoints:
    pdf.set_fill_color(*LGRAY)
    colors = {'POST':(230,57,70),'GET':(40,167,69),'PUT':(23,162,184),'PATCH':(255,193,7),'DELETE':(220,53,69)}
    r,g,b = colors.get(meth,(128,128,128))
    pdf.set_fill_color(r,g,b)
    pdf.set_text_color(*WHITE)
    pdf.set_font('Helvetica','B',8)
    pdf.cell(22,5,c(meth),border=1,fill=True,align='C')
    pdf.set_fill_color(*LGRAY)
    pdf.set_text_color(*BLACK)
    pdf.set_font('Courier','',8)
    pdf.cell(74,5,c(route),border=1,fill=True)
    pdf.set_font('Helvetica','',8.5)
    pdf.cell(pdf.PW-96,5,c(desc),border=1,ln=True)
pdf.ln(3)

pdf.subsec('Anexo B – Estrutura do Monorepo (pnpm workspaces)')
pdf.set_font('Courier','',8.5)
pdf.set_fill_color(30,30,30)
pdf.set_text_color(230,57,70)
tree = [
    'SOS-Mulher/  (monorepo pnpm)',
    '├── artifacts/',
    '│   ├── api-server/        # Backend Express 5 + TypeScript',
    '│   │   └── src/ (app.ts, routes/, controllers/, services/, models/)',
    '│   ├── mobile/            # Expo React Native + Expo Router',
    '│   │   └── app/ (onboarding, (tabs)/, restricted)',
    '│   └── mockup-sandbox/    # Prototipacao de componentes',
    '├── lib/',
    '│   ├── db/                # Schema Drizzle ORM + migrações',
    '│   ├── api-spec/          # OpenAPI 3.1 + orval.config.ts',
    '│   ├── api-client-react/  # React Query hooks (gerados)',
    '│   └── api-zod/           # Zod schemas (gerados)',
    '├── scripts/               # Scripts utilitarios',
    '├── pnpm-workspace.yaml    # Catalogo de dependencias',
    '└── package.json           # Scripts raiz (typecheck, build)',
]
for line in tree:
    pdf.multi_cell(pdf.PW, 5, c(line))
pdf.set_text_color(*BLACK)
pdf.set_fill_color(*WHITE)
pdf.ln(3)

# save
OUT_PDF = '/home/runner/workspace/PI2_EquipeMaria Janaina_Avaliacao2_DocumentacaoFinal.pdf'
pdf.output(OUT_PDF)
sz = os.path.getsize(OUT_PDF)
print(f'PDF OK — {sz//1024} KB — {pdf.page_no()} paginas')
