package com.xeroxshop.service;

import com.xeroxshop.dto.BillResponse;
import com.xeroxshop.dto.DashboardResponse;
import com.xeroxshop.dto.ProductResponse;
import com.xeroxshop.model.Sale;
import com.xeroxshop.repository.ExpenseRepository;
import com.xeroxshop.repository.ProductRepository;
import com.xeroxshop.repository.SaleItemRepository;
import com.xeroxshop.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private BillingService billingService;

    public DashboardResponse getDashboardData() {
        return getDashboardData(null);
    }

    public DashboardResponse getDashboardData(LocalDate targetDate) {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate queryDate = (targetDate != null) ? targetDate : LocalDate.now(zone);
        OffsetDateTime dayStart = queryDate.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime dayEnd = queryDate.atTime(LocalTime.MAX).atZone(zone).toOffsetDateTime();

        BigDecimal todaySales = saleRepository.sumSalesBetween(dayStart, dayEnd);
        int todayBills = (int) saleRepository.countByCreatedAtBetweenAndStatus(dayStart, dayEnd, "COMPLETED");

        BigDecimal xeroxSales = saleItemRepository.sumXeroxSales(dayStart, dayEnd);
        BigDecimal colorPrintSales = saleItemRepository.sumColorPrintSales(dayStart, dayEnd);
        BigDecimal stationerySales = saleItemRepository.sumProductSales(dayStart, dayEnd);
        BigDecimal remaining = todaySales.subtract(xeroxSales).subtract(colorPrintSales);
        if (remaining.compareTo(BigDecimal.ZERO) > 0 && stationerySales.compareTo(remaining) < 0) {
            stationerySales = remaining;
        }

        BigDecimal todayExpenses = expenseRepository.sumExpensesBetween(queryDate, queryDate);
        BigDecimal estimatedProfit = todaySales.subtract(todayExpenses);

        List<ProductResponse> lowStockProducts = productRepository.findLowStockProducts().stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());

        List<BillResponse> recentTransactions = saleRepository.findByCreatedAtBetweenAndStatusOrderByCreatedAtDesc(dayStart, dayEnd, "COMPLETED").stream()
                .map(billingService::mapToBillResponse)
                .collect(Collectors.toList());

        return new DashboardResponse(
                todaySales,
                todayBills,
                xeroxSales,
                colorPrintSales,
                stationerySales,
                todayExpenses,
                estimatedProfit,
                lowStockProducts,
                recentTransactions
        );
    }
}

