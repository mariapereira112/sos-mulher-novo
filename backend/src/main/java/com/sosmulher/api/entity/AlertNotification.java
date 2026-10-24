package com.sosmulher.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "alert_notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "alert_id", nullable = false)
    private Integer alertId;

    @Column(name = "contact_id", nullable = false)
    private Integer contactId;

    @Column(nullable = false)
    private String channel;

    @Column(name = "response_digit")
    private String responseDigit;

    @Column(name = "sent_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime sentAt;
}
