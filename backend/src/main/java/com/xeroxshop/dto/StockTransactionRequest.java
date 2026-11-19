package com.xeroxshop.dto;

import java.util.UUID;

public record StockTransactionRequest(
    UUID productId,
    String type,   // IN, OUT, ADJUST
    int quantity,
    String reference
) {}

