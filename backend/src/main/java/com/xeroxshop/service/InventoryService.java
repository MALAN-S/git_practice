package com.xeroxshop.service;

import com.xeroxshop.dto.ProductResponse;
import com.xeroxshop.dto.StockTransactionRequest;
import com.xeroxshop.model.Product;
import com.xeroxshop.model.StockTransaction;
import com.xeroxshop.repository.ProductRepository;
import com.xeroxshop.repository.StockTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private ProductService productService;

    @Transactional
    public ProductResponse stockIn(StockTransactionRequest req) {
        Product p = productRepository.findById(req.productId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + req.productId()));

        p.setCurrentStock(p.getCurrentStock() + req.quantity());
        productRepository.save(p);

        StockTransaction tx = new StockTransaction();
        tx.setProduct(p);
        tx.setType("IN");
        tx.setQuantity(req.quantity());
        tx.setReference(req.reference() != null ? req.reference() : "STOCK_IN");
        stockTransactionRepository.save(tx);

        return productService.mapToResponse(p);
    }

    @Transactional
    public ProductResponse stockOut(StockTransactionRequest req) {
        Product p = productRepository.findById(req.productId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + req.productId()));

        if (p.getCurrentStock() < req.quantity()) {
            throw new RuntimeException("Cannot deduct " + req.quantity() + ". Current stock is only " + p.getCurrentStock());
        }

        p.setCurrentStock(p.getCurrentStock() - req.quantity());
        productRepository.save(p);

        StockTransaction tx = new StockTransaction();
        tx.setProduct(p);
        tx.setType("OUT");
        tx.setQuantity(req.quantity());
        tx.setReference(req.reference() != null ? req.reference() : "MANUAL_STOCK_OUT");
        stockTransactionRepository.save(tx);

        return productService.mapToResponse(p);
    }

    @Transactional
    public ProductResponse adjustStock(StockTransactionRequest req) {
        Product p = productRepository.findById(req.productId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + req.productId()));

        p.setCurrentStock(req.quantity());
        productRepository.save(p);

        StockTransaction tx = new StockTransaction();
        tx.setProduct(p);
        tx.setType("ADJUST");
        tx.setQuantity(req.quantity());
        tx.setReference(req.reference() != null ? req.reference() : "AUDIT_ADJUSTMENT");
        stockTransactionRepository.save(tx);

        return productService.mapToResponse(p);
    }

    public List<StockTransaction> getProductTransactions(UUID productId) {
        return stockTransactionRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
}

