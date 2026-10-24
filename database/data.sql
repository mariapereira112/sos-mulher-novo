-- =============================================================================
--  SOS Mulher — Dados de Teste (PostgreSQL / MySQL)
--  Execute APÓS o schema.sql.
--
--  PostgreSQL:
--    psql -U postgres -d sos_mulher -f data.sql
--
--  MySQL:
--    mysql -u root -p sos_mulher < data.sql
--    (substitua ON CONFLICT DO NOTHING por INSERT IGNORE)
--
--  Senha de todos os usuários de teste: senha123
--  Hash BCrypt (Spring Security, cost 10)
-- =============================================================================

-- ── Usuárias de teste ─────────────────────────────────────────────────────────
INSERT INTO users (name, phone, email, cpf, gender, password_hash, onboarding_completed)
VALUES
  ('Ana Silva',    '47988100001', 'ana@sosmulher.com',   '123.456.789-00', 'Mulher',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true),
  ('Maria Santos', '47988100002', 'maria@sosmulher.com', '987.654.321-00', 'Não-binária', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true)
ON CONFLICT (email) DO NOTHING;

-- ── Contatos de emergência para Ana (id=1) ────────────────────────────────────
INSERT INTO emergency_contacts (user_id, name, phone, relationship)
VALUES
  (1, 'Central da Mulher', '180', 'Delegacia'),
  (1, 'SAMU',              '192', 'Saúde'),
  (1, 'Polícia',           '190', 'Segurança')
ON CONFLICT DO NOTHING;

-- ── Configurações padrão para Ana ────────────────────────────────────────────
INSERT INTO settings (user_id, gps_enabled, notifications_enabled, sos_timer)
VALUES (1, true, true, '1500')
ON CONFLICT DO NOTHING;

-- ── Posts da comunidade ───────────────────────────────────────────────────────
INSERT INTO community_posts (user_id, user_name, content, created_at)
VALUES
  (1, 'Ana Silva',   'Bem-vindas ao SOS Mulher! Este é um espaço seguro para compartilhar.', NOW()),
  (2, 'Maria Santos','Dica: cadastre seus contatos de emergência antes de precisar usar o SOS.', NOW()),
  (1, 'Ana Silva',   'Lembrete: 180 é a Central de Atendimento à Mulher, disponível 24h por dia.', NOW()),
  (2, 'Maria Santos','O botão SOS precisa ser segurado por 1,5 segundos para evitar acionamentos acidentais.', NOW());
