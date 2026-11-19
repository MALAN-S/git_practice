package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record PurchaseRequest(
    Integer supplierId,
    LocalDate purchaseDate,
    String invoiceNumber,
    List<PurchaseItemRequest> items,
    BigDecimal discount,
    String paymentMethod,
    String paymentStatus,
    BigDecimal paidAmount,
    String notes
) {}
