package com.xeroxshop.controller;

import com.xeroxshop.dto.ProductResponse;
import com.xeroxshop.dto.StockTransactionRequest;
import com.xeroxshop.model.StockTransaction;
import com.xeroxshop.service.InventoryService;
import com.xeroxshop.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductService productService;

    @PostMapping("/stock-in")
    public ResponseEntity<ProductResponse> stockIn(@RequestBody StockTransactionRequest req) {
        return ResponseEntity.ok(inventoryService.stockIn(req));
    }

    @PostMapping("/stock-out")
    public ResponseEntity<ProductResponse> stockOut(@RequestBody StockTransactionRequest req) {
        return ResponseEntity.ok(inventoryService.stockOut(req));
    }

    @PostMapping("/adjust")
    public ResponseEntity<ProductResponse> adjustStock(@RequestBody StockTransactionRequest req) {
        return ResponseEntity.ok(inventoryService.adjustStock(req));
    }

    @GetMapping("/transactions/{productId}")
    public ResponseEntity<List<StockTransaction>> getTransactions(@PathVariable UUID productId) {
        return ResponseEntity.ok(inventoryService.getProductTransactions(productId));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductResponse>> getLowStock() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }
}

