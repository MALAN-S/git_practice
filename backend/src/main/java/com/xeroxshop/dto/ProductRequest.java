package com.xeroxshop.dto;

import java.math.BigDecimal;

public record ProductRequest(
    String name,
    String sku,
    String description,
    BigDecimal purchasePrice,
    BigDecimal sellingPrice,
    int currentStock,
    int minStockLevel,
    String imageUrl,
    String status,
    Integer categoryId
) {}

