package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailySales(
    LocalDate date,
    BigDecimal total
) {}

