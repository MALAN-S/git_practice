package com.xeroxshop.dto;

import java.util.UUID;

public record UserRequest(
    String username,
    String password,
    String role
) {}

