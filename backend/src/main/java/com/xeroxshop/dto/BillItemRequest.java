package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record BillItemRequest(
    UUID productId,
    UUID serviceId,
    int quantity,
    BigDecimal unitPrice
) {}

