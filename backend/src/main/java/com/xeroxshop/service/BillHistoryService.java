package com.xeroxshop.service;

import com.xeroxshop.dto.BillResponse;
import com.xeroxshop.dto.RefundRequest;
import com.xeroxshop.model.Product;
import com.xeroxshop.model.Refund;
import com.xeroxshop.model.Sale;
import com.xeroxshop.model.SaleItem;
import com.xeroxshop.model.StockTransaction;
import com.xeroxshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BillHistoryService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private BillingService billingService;

    public List<BillResponse> getAllBills() {
        return saleRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(billingService::mapToBillResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillResponse cancelBill(UUID saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + saleId));

        if ("CANCELLED".equalsIgnoreCase(sale.getStatus())) {
            throw new RuntimeException("This bill is already cancelled.");
        }

        // Restore stock for product items
        List<SaleItem> items = saleItemRepository.findBySaleId(saleId);
        for (SaleItem item : items) {
            if (item.getProduct() != null) {
                Product p = item.getProduct();
                p.setCurrentStock(p.getCurrentStock() + item.getQuantity());
                productRepository.save(p);

                StockTransaction tx = new StockTransaction();
                tx.setProduct(p);
                tx.setType("IN");
                tx.setQuantity(item.getQuantity());
                tx.setReference("CANCEL_BILL_" + sale.getBillNumber());
                stockTransactionRepository.save(tx);
            }
        }

        sale.setStatus("CANCELLED");
        Sale updated = saleRepository.save(sale);
        return billingService.mapToBillResponse(updated);
    }

    @Transactional
    public Refund processRefund(RefundRequest req) {
        Sale sale = saleRepository.findById(req.saleId())
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + req.saleId()));

        Refund refund = new Refund();
        refund.setSale(sale);
        refund.setAmount(req.amount());
        refund.setReason(req.reason());

        sale.setStatus("REFUNDED");
        saleRepository.save(sale);

        return refundRepository.save(refund);
    }
}

