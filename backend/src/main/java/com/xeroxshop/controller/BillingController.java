package com.xeroxshop.controller;

import com.xeroxshop.dto.BillRequest;
import com.xeroxshop.dto.BillResponse;
import com.xeroxshop.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired
    private BillingService billingService;

    @PostMapping("/create-bill")
    public ResponseEntity<BillResponse> createBill(@RequestBody BillRequest request) {
        return ResponseEntity.ok(billingService.createBill(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillResponse> getBill(@PathVariable UUID id) {
        return ResponseEntity.ok(billingService.getBillById(id));
    }

    @GetMapping("/number/{billNumber}")
    public ResponseEntity<BillResponse> getBillByNumber(@PathVariable String billNumber) {
        return ResponseEntity.ok(billingService.getBillByBillNumber(billNumber));
    }
}

