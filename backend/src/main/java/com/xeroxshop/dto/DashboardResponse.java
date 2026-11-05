package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
    BigDecimal todaySales,
    int todayBills,
    BigDecimal xeroxSales,
    BigDecimal colorPrintSales,
    BigDecimal stationerySales,
    BigDecimal totalExpenses,
    BigDecimal estimatedProfit,
    List<ProductResponse> lowStockProducts,
    List<BillResponse> recentTransactions
) {}

