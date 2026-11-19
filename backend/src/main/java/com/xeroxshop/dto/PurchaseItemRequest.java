package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemRequest(
    UUID productId,
    String itemName,
    int quantity,
    BigDecimal unitPrice
) {}
