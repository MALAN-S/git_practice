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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class SalesReportService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    public ReportResponse getReport(LocalDate startDate, LocalDate endDate) {
        ZoneId zone = ZoneId.systemDefault();
        OffsetDateTime start = startDate.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime end = endDate.atTime(LocalTime.MAX).atZone(zone).toOffsetDateTime();

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

        BigDecimal xeroxSales = saleItemRepository.sumXeroxSales(start, end);
        BigDecimal colorPrintSales = saleItemRepository.sumColorPrintSales(start, end);
        BigDecimal stationerySales = saleItemRepository.sumProductSales(start, end);
        BigDecimal remainingTotal = totalSales.subtract(xeroxSales).subtract(colorPrintSales);
        if (remainingTotal.compareTo(BigDecimal.ZERO) > 0 && stationerySales.compareTo(remainingTotal) < 0) {
            stationerySales = remainingTotal;
        }

        // Daily breakdown with actual real categories
        List<DailySales> dailySalesList = new ArrayList<>();
        LocalDate cur = startDate;
        while (!cur.isAfter(endDate)) {
            OffsetDateTime dayStart = cur.atStartOfDay(zone).toOffsetDateTime();
            OffsetDateTime dayEnd = cur.atTime(LocalTime.MAX).atZone(zone).toOffsetDateTime();
            BigDecimal dayTotal = saleRepository.sumSalesBetween(dayStart, dayEnd);
            BigDecimal dayXerox = saleItemRepository.sumXeroxSales(dayStart, dayEnd);
            BigDecimal dayColor = saleItemRepository.sumColorPrintSales(dayStart, dayEnd);
            BigDecimal dayStationery = saleItemRepository.sumProductSales(dayStart, dayEnd);

            BigDecimal remaining = dayTotal.subtract(dayXerox).subtract(dayColor);
            if (remaining.compareTo(BigDecimal.ZERO) > 0 && dayStationery.compareTo(remaining) < 0) {
                dayStationery = remaining;
            }

            dailySalesList.add(new DailySales(cur, dayTotal, dayXerox, dayColor, dayStationery));
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
