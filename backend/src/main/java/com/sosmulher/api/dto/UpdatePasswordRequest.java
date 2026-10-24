package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class UpdatePasswordRequest {
    private Integer userId;
    private String currentPassword;
    private String newPassword;
}
