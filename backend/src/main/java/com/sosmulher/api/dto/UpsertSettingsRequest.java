package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class UpsertSettingsRequest {
    private Boolean gpsEnabled;
    private Boolean notificationsEnabled;
    private Boolean cameraMicEnabled;
    private Boolean discreteMode;
    private Boolean biometricsEnabled;
    private String coercionCode;
    private String sosTimer;
    private String photoUrl;
    private Boolean highContrast;
    private Boolean largeText;
    private Boolean reduceMotion;
}
