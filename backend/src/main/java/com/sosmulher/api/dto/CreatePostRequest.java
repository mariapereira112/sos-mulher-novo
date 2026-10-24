package com.sosmulher.api.dto;

import lombok.Data;

@Data
public class CreatePostRequest {
    private Integer userId;
    private String userName;
    private String content;
}
