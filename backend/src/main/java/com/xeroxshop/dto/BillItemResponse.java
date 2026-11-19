package com.xeroxshop.dto;

import java.math.BigDecimal;

public record BillItemResponse(
    String itemName,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal totalPrice,
    String type  // "PRODUCT" or "SERVICE"
) {}

