package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseItemRequest(
    UUID productId,
    Integer categoryId,
    String sku,
    String itemName,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal mrp
) {}
