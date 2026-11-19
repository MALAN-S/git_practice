package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RefundRequest(
    UUID saleId,
    BigDecimal amount,
    String reason
) {}

