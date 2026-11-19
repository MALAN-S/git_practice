package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReportResponse(
    BigDecimal totalSales,
    int totalBills,
    BigDecimal xeroxSales,
    BigDecimal colorPrintSales,
    BigDecimal stationerySales,
    BigDecimal cashSales,
    BigDecimal upiSales,
    BigDecimal cardSales,
    List<DailySales> dailySales
) {}

