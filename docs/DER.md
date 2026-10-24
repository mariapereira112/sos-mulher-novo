# DER — Diagrama Entidade-Relacionamento
## SOS Mulher

```mermaid
erDiagram
    USERS {
        serial      id              PK
        text        name
        text        phone
        text        email
        text        cpf             UK
        text        gender
        text        password_hash
        boolean     onboarding_completed
        timestamp   created_at
        timestamp   updated_at
    }

    SETTINGS {
        serial      id              PK
        integer     user_id         FK
        boolean     gps_enabled
        boolean     notifications_enabled
        boolean     camera_mic_enabled
        boolean     discrete_mode
        boolean     biometrics_enabled
        text        coercion_code
        text        sos_timer
        text        photo_url
        boolean     high_contrast
        boolean     large_text
        boolean     reduce_motion
        timestamp   created_at
        timestamp   updated_at
    }

    EMERGENCY_CONTACTS {
        serial      id              PK
        integer     user_id         FK
        text        name
        text        phone
        text        relationship
        timestamp   created_at
    }

    ALERTS {
        serial          id              PK
        integer         user_id         FK
        doublePrecision latitude
        doublePrecision longitude
        text            status
        integer         timer_duration
        timestamp       created_at
    }

    ALERT_NOTIFICATIONS {
        serial      id              PK
        integer     alert_id        FK
        integer     contact_id      FK
        text        channel
        text        response_digit
        timestamp   sent_at
    }

    COMMUNITY_POSTS {
        serial      id              PK
        integer     user_id         FK
        text        user_name
        text        content
        timestamp   created_at
    }

    FEEDBACKS {
        serial      id              PK
        integer     user_id         FK
        text        message
        timestamp   created_at
    }

    INCIDENTS {
        serial      id              PK
        integer     user_id         FK
        text        nome_completo
        text        cpf
        text        narrative
        jsonb       attachments
        text        audio_url
        jsonb       witnesses
        timestamp   created_at
    }

    USERS ||--|| SETTINGS              : "possui"
    USERS ||--o{ EMERGENCY_CONTACTS    : "cadastra"
    USERS ||--o{ ALERTS                : "dispara"
    USERS ||--o{ COMMUNITY_POSTS       : "publica"
    USERS ||--o{ FEEDBACKS             : "envia"
    USERS ||--o{ INCIDENTS             : "registra"
    ALERTS ||--o{ ALERT_NOTIFICATIONS  : "gera"
    EMERGENCY_CONTACTS ||--o{ ALERT_NOTIFICATIONS : "recebe"
```

## Legenda de Status do Alerta

| Valor | Descrição |
|-------|-----------|
| `pending` | Alerta criado, aguardando envio |
| `sms_sent` | SMS/WhatsApp simulado enviado aos contatos |
| `calling_cloud` | Chamada em nuvem iniciada (Fase 2) |
| `voice_call_dispatched` | Chamada de voz Twilio despachada ao expirar o temporizador |
| `resolved_by_contact` | Contato respondeu com dígito "1" — situação segura |

## Canais de Notificação (alert_notifications.channel)

| Valor | Descrição |
|-------|-----------|
| `sms` | Notificação via SMS |
| `whatsapp` | Notificação via WhatsApp |
| `voice` | Chamada de voz automatizada |
