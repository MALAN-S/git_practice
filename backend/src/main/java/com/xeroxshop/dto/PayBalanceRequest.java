package com.xeroxshop.dto;

import java.math.BigDecimal;

public record PayBalanceRequest(
    BigDecimal amount,
    String paymentMethod
) {}

