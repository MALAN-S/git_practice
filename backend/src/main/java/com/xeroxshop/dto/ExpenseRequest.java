package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
    String category,
    BigDecimal amount,
    LocalDate expenseDate,
    String description,
    String paymentMethod
) {}

