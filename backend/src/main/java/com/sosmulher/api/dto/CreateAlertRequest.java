package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class CreateAlertRequest {
    private Integer userId;
    private Double latitude;
    private Double longitude;
    private Integer timerDuration;
}
