package com.xeroxshop.controller;

import com.xeroxshop.dto.BillResponse;
import com.xeroxshop.dto.PayBalanceRequest;
import com.xeroxshop.dto.RefundRequest;
import com.xeroxshop.model.Refund;
import com.xeroxshop.service.BillHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bill-history")
public class BillHistoryController {

    @Autowired
    private BillHistoryService billHistoryService;

    @GetMapping
    public ResponseEntity<List<BillResponse>> getAllBills() {
        return ResponseEntity.ok(billHistoryService.getAllBills());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BillResponse> cancelBill(@PathVariable UUID id) {
        return ResponseEntity.ok(billHistoryService.cancelBill(id));
    }

    @PostMapping("/{id}/pay-balance")
    public ResponseEntity<BillResponse> payBalance(@PathVariable UUID id, @RequestBody PayBalanceRequest request) {
        return ResponseEntity.ok(billHistoryService.payBalance(id, request.amount(), request.paymentMethod()));
    }

    @PostMapping("/refund")
    public ResponseEntity<Refund> processRefund(@RequestBody RefundRequest req) {
        return ResponseEntity.ok(billHistoryService.processRefund(req));
    }
}
