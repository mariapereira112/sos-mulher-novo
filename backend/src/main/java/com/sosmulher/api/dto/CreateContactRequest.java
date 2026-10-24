package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class CreateContactRequest {
    private String name;
    private String phone;
    private String relationship;
}
