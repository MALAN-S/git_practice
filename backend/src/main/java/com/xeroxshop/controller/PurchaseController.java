package com.xeroxshop.controller;

import com.xeroxshop.dto.PayBalanceRequest;
import com.xeroxshop.dto.PurchaseRequest;
import com.xeroxshop.model.Purchase;
import com.xeroxshop.model.PurchasePayment;
import com.xeroxshop.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @GetMapping
    public ResponseEntity<List<Purchase>> getPurchases(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer supplierId) {
        if (supplierId != null) {
            return ResponseEntity.ok(purchaseService.getPurchasesBySupplier(supplierId));
        }
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(purchaseService.getPurchasesBetween(startDate, endDate));
        }
        return ResponseEntity.ok(purchaseService.getAllPurchases());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Purchase> getPurchase(@PathVariable Integer id) {
        return ResponseEntity.ok(purchaseService.getPurchaseById(id));
    }

    @PostMapping
    public ResponseEntity<Purchase> createPurchase(@RequestBody PurchaseRequest req) {
        return ResponseEntity.ok(purchaseService.createPurchase(req));
    }

    @PostMapping("/{id}/pay-balance")
    public ResponseEntity<Purchase> payBalance(@PathVariable Integer id, @RequestBody PayBalanceRequest request) {
        return ResponseEntity.ok(purchaseService.payBalance(id, request.amount(), request.paymentMethod()));
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PurchasePayment>> getPaymentHistory(@PathVariable Integer id) {
        return ResponseEntity.ok(purchaseService.getPaymentHistory(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchase(@PathVariable Integer id) {
        purchaseService.deletePurchase(id);
        return ResponseEntity.noContent().build();
    }
}
