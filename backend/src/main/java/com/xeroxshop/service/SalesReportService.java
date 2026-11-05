package com.xeroxshop.service;

import com.xeroxshop.dto.DailySales;
import com.xeroxshop.dto.ReportResponse;
import com.xeroxshop.model.Sale;
import com.xeroxshop.repository.SaleItemRepository;
import com.xeroxshop.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
public class SalesReportService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    public ReportResponse getReport(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime end = endDate.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);

        List<Sale> sales = saleRepository.findByCreatedAtBetweenAndStatus(start, end, "COMPLETED");

        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal cashSales = BigDecimal.ZERO;
        BigDecimal upiSales = BigDecimal.ZERO;
        BigDecimal cardSales = BigDecimal.ZERO;

        for (Sale s : sales) {
            totalSales = totalSales.add(s.getGrandTotal());
            if ("CASH".equalsIgnoreCase(s.getPaymentMethod())) {
                cashSales = cashSales.add(s.getGrandTotal());
            } else if ("UPI".equalsIgnoreCase(s.getPaymentMethod())) {
                upiSales = upiSales.add(s.getGrandTotal());
            } else if ("CARD".equalsIgnoreCase(s.getPaymentMethod())) {
                cardSales = cardSales.add(s.getGrandTotal());
            }
        }

        BigDecimal xeroxSales = saleItemRepository.sumSalesByProductCategory("Xerox Services", start, end);
        BigDecimal colorPrintSales = saleItemRepository.sumSalesByProductCategory("Color Printing", start, end);
        BigDecimal stationerySales = saleItemRepository.sumSalesByProductCategory("Stationery", start, end);

        // Daily breakdown
        List<DailySales> dailySalesList = new ArrayList<>();
        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            OffsetDateTime dayStart = cur.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime dayEnd = cur.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);
            BigDecimal dayTotal = saleRepository.sumSalesBetween(dayStart, dayEnd);
            dailySalesList.add(new DailySales(cur, dayTotal));
            cur = cur.plusDays(1);
        }

        return new ReportResponse(
                totalSales,
                sales.size(),
                xeroxSales,
                colorPrintSales,
                stationerySales,
                cashSales,
                upiSales,
                cardSales,
                dailySalesList
        );
    }
}

