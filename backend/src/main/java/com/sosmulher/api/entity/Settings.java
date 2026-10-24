package com.sosmulher.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "gps_enabled")
    private Boolean gpsEnabled = true;

    @Column(name = "notifications_enabled")
    private Boolean notificationsEnabled = true;

    @Column(name = "camera_mic_enabled")
    private Boolean cameraMicEnabled = false;

    @Column(name = "discrete_mode")
    private Boolean discreteMode = false;

    @Column(name = "biometrics_enabled")
    private Boolean biometricsEnabled = false;

    @Column(name = "coercion_code")
    private String coercionCode;

    @Column(name = "sos_timer")
    private String sosTimer = "1500";

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "high_contrast")
    private Boolean highContrast = false;

    @Column(name = "large_text")
    private Boolean largeText = false;

    @Column(name = "reduce_motion")
    private Boolean reduceMotion = false;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
