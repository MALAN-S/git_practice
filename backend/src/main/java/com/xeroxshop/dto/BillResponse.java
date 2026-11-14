package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record BillResponse(
    UUID id,
    String billNumber,
    BigDecimal totalAmount,
    BigDecimal discount,
    BigDecimal grandTotal,
    String paymentMethod,
    String status,
    OffsetDateTime createdAt,
    List<BillItemResponse> items,
    BigDecimal paidAmount,
    BigDecimal balanceAmount,
    String customerName,
    String customerPhone
) {}
