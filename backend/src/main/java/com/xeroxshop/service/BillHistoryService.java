package com.xeroxshop.service;

import com.xeroxshop.dto.BillResponse;
import com.xeroxshop.dto.RefundRequest;
import com.xeroxshop.model.Payment;
import com.xeroxshop.model.Product;
import com.xeroxshop.model.Refund;
import com.xeroxshop.model.Sale;
import com.xeroxshop.model.SaleItem;
import com.xeroxshop.model.StockTransaction;
import com.xeroxshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
    private PaymentRepository paymentRepository;

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
    public BillResponse payBalance(UUID saleId, BigDecimal amount, String paymentMethod) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + saleId));

        if (!"PARTIAL".equalsIgnoreCase(sale.getStatus())) {
            throw new RuntimeException("This bill does not have a pending balance.");
        }

        BigDecimal balance = sale.getBalanceAmount();
        if (balance == null || balance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("No balance remaining on this bill.");
        }

        // If amount is null or zero, pay the full balance
        BigDecimal payAmount = (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) ? balance : amount;

        if (payAmount.compareTo(balance) > 0) {
            throw new RuntimeException("Payment amount (₹" + payAmount + ") exceeds balance (₹" + balance + ").");
        }

        // Update paid and balance amounts
        BigDecimal newPaid = sale.getPaidAmount().add(payAmount);
        BigDecimal newBalance = balance.subtract(payAmount);

        sale.setPaidAmount(newPaid);
        sale.setBalanceAmount(newBalance);

        // If fully paid, mark as COMPLETED
        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            sale.setStatus("COMPLETED");
            sale.setBalanceAmount(BigDecimal.ZERO);
        }

        // Record this payment
        Payment payment = new Payment();
        payment.setSale(sale);
        payment.setMethod(paymentMethod != null ? paymentMethod : sale.getPaymentMethod());
        payment.setAmount(payAmount);
        payment.setTransactionRef("BAL_" + sale.getBillNumber());
        paymentRepository.save(payment);

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
