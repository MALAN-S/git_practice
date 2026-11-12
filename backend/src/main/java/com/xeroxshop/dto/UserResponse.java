package com.xeroxshop.dto;

import java.util.UUID;

public record UserResponse(
    UUID id,
    String username,
    String role,
    String permissions
) {}
