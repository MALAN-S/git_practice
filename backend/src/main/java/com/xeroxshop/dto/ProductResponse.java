package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String name,
    String sku,
    String description,
    BigDecimal purchasePrice,
    BigDecimal sellingPrice,
    int currentStock,
    int minStockLevel,
    String imageUrl,
    String status,
    Integer categoryId,
    String categoryName,
    boolean lowStock
) {}

