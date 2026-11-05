package com.xeroxshop.controller;

import com.xeroxshop.dto.ReportResponse;
import com.xeroxshop.service.SalesReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private SalesReportService salesReportService;

    @GetMapping("/daily")
    public ResponseEntity<ReportResponse> getDailyReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(salesReportService.getReport(target, target));
    }

    @GetMapping("/range")
    public ResponseEntity<ReportResponse> getRangeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(salesReportService.getReport(startDate, endDate));
    }
}

