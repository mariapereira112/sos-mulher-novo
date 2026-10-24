package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class UpdateEmailRequest {
    private Integer userId;
    private String email;
}
