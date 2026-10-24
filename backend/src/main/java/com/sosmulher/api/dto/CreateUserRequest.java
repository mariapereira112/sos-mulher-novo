package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String name;
    private String phone;
    private String email;
    private String cpf;
    private String gender;
    private String password;
}
