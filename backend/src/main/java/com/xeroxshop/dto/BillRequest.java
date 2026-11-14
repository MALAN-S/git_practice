package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.List;

public record BillRequest(
    List<BillItemRequest> items,
    BigDecimal discount,
    String paymentMethod,
    BigDecimal paidAmount,
    String customerName,
    String customerPhone
) {}
