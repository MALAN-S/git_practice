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
        LocalDate today = LocalDate.now();
        OffsetDateTime todayStart = today.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime todayEnd = today.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);

        BigDecimal todaySales = saleRepository.sumSalesBetween(todayStart, todayEnd);
        int todayBills = (int) saleRepository.countByCreatedAtBetweenAndStatus(todayStart, todayEnd, "COMPLETED");

        BigDecimal xeroxSales = saleItemRepository.sumSalesByProductCategory("Xerox Services", todayStart, todayEnd);
        BigDecimal colorPrintSales = saleItemRepository.sumSalesByProductCategory("Color Printing", todayStart, todayEnd);
        BigDecimal stationerySales = saleItemRepository.sumSalesByProductCategory("Stationery", todayStart, todayEnd);

        BigDecimal todayExpenses = expenseRepository.sumExpensesBetween(today, today);
        BigDecimal estimatedProfit = todaySales.subtract(todayExpenses);

        List<ProductResponse> lowStockProducts = productRepository.findLowStockProducts().stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());

        List<BillResponse> recentTransactions = saleRepository.findTop10ByStatusOrderByCreatedAtDesc("COMPLETED").stream()
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

