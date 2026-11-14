package com.xeroxshop.service;

import com.xeroxshop.dto.*;
import com.xeroxshop.model.*;
import com.xeroxshop.model.AppSetting;
import com.xeroxshop.repository.*;
import com.xeroxshop.repository.AppSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ServiceEntityRepository serviceEntityRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private AppSettingRepository appSettingRepository;

    @Transactional
    public BillResponse createBill(BillRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new RuntimeException("Cannot create an empty bill. Please add at least one item.");
        }

        // Read bill prefix from settings (default "BILL")
        String prefix = appSettingRepository.findById("billPrefix")
                .map(AppSetting::getValue)
                .orElse("BILL");

        // Read and increment bill counter from database
        int counter = appSettingRepository.findById("billCounter")
                .map(s -> Integer.parseInt(s.getValue()))
                .orElse(0);
        counter++;

        // Save incremented counter back to database
        appSettingRepository.save(new AppSetting("billCounter", String.valueOf(counter)));

        // Generate bill number: e.g. BILL-001, BILL-002
        String billNumber = prefix + "-" + String.format("%03d", counter);

        Sale sale = new Sale();
        sale.setBillNumber(billNumber);
        sale.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : "CASH");
        sale.setDiscount(request.discount() != null ? request.discount() : BigDecimal.ZERO);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<SaleItem> saleItems = new ArrayList<>();
        List<BillItemResponse> itemResponses = new ArrayList<>();

        for (BillItemRequest itemReq : request.items()) {
            if (itemReq.quantity() <= 0) {
                throw new RuntimeException("Item quantity must be greater than zero.");
            }

            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setQuantity(itemReq.quantity());
            saleItem.setUnitPrice(itemReq.unitPrice());

            BigDecimal itemTotal = itemReq.unitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            saleItem.setTotalPrice(itemTotal);
            subtotal = subtotal.add(itemTotal);

            if (itemReq.productId() != null) {
                Product product = productRepository.findById(itemReq.productId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.productId()));

                // Check negative stock prevention rule
                if (product.getCurrentStock() < itemReq.quantity()) {
                    throw new RuntimeException("Insufficient stock for product '" + product.getName() +
                            "'. Available: " + product.getCurrentStock() + ", Requested: " + itemReq.quantity());
                }

                // Deduct stock
                product.setCurrentStock(product.getCurrentStock() - itemReq.quantity());
                productRepository.save(product);

                // Record stock out transaction
                StockTransaction tx = new StockTransaction();
                tx.setProduct(product);
                tx.setType("OUT");
                tx.setQuantity(itemReq.quantity());
                tx.setReference(billNumber);
                stockTransactionRepository.save(tx);

                saleItem.setProduct(product);
                itemResponses.add(new BillItemResponse(product.getName(), itemReq.quantity(), itemReq.unitPrice(), itemTotal, "PRODUCT"));

            } else if (itemReq.serviceId() != null) {
                ServiceEntity svc = serviceEntityRepository.findById(itemReq.serviceId())
                        .orElseThrow(() -> new RuntimeException("Service not found: " + itemReq.serviceId()));

                saleItem.setService(svc);
                itemResponses.add(new BillItemResponse(svc.getName(), itemReq.quantity(), itemReq.unitPrice(), itemTotal, "SERVICE"));
            } else {
                throw new RuntimeException("Each bill item must specify either a productId or a serviceId.");
            }

            saleItems.add(saleItem);
        }

        sale.setTotalAmount(subtotal);
        BigDecimal grandTotal = subtotal.subtract(sale.getDiscount());
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }
        sale.setGrandTotal(grandTotal);

        // Handle partial payment
        BigDecimal paidAmount = request.paidAmount();
        if (paidAmount != null && paidAmount.compareTo(BigDecimal.ZERO) > 0 && paidAmount.compareTo(grandTotal) < 0) {
            // Partial payment — require customer info
            if (request.customerName() == null || request.customerName().isBlank()) {
                throw new RuntimeException("Customer name is required for partial payment.");
            }
            if (request.customerPhone() == null || request.customerPhone().isBlank()) {
                throw new RuntimeException("Customer phone number is required for partial payment.");
            }
            sale.setStatus("PARTIAL");
            sale.setPaidAmount(paidAmount);
            sale.setBalanceAmount(grandTotal.subtract(paidAmount));
            sale.setCustomerName(request.customerName().trim());
            sale.setCustomerPhone(request.customerPhone().trim());
        } else {
            // Full payment
            sale.setStatus("COMPLETED");
            sale.setPaidAmount(grandTotal);
            sale.setBalanceAmount(BigDecimal.ZERO);
            // Customer info is optional for full payment
            if (request.customerName() != null && !request.customerName().isBlank()) {
                sale.setCustomerName(request.customerName().trim());
            }
            if (request.customerPhone() != null && !request.customerPhone().isBlank()) {
                sale.setCustomerPhone(request.customerPhone().trim());
            }
        }

        Sale savedSale = saleRepository.save(sale);
        for (SaleItem si : saleItems) {
            si.setSale(savedSale);
            saleItemRepository.save(si);
        }

        // Record Payment
        Payment payment = new Payment();
        payment.setSale(savedSale);
        payment.setMethod(savedSale.getPaymentMethod());
        payment.setAmount(paidAmount != null && paidAmount.compareTo(BigDecimal.ZERO) > 0 ? paidAmount : grandTotal);
        payment.setTransactionRef(billNumber);
        paymentRepository.save(payment);

        return mapToBillResponse(savedSale, itemResponses);
    }

    public BillResponse getBillById(UUID id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with id: " + id));
        return mapToBillResponse(sale);
    }

    public BillResponse getBillByBillNumber(String billNumber) {
        Sale sale = saleRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found with bill number: " + billNumber));
        return mapToBillResponse(sale);
    }

    private BillResponse mapToBillResponse(Sale sale, List<BillItemResponse> itemResponses) {
        return new BillResponse(
                sale.getId(),
                sale.getBillNumber(),
                sale.getTotalAmount(),
                sale.getDiscount(),
                sale.getGrandTotal(),
                sale.getPaymentMethod(),
                sale.getStatus(),
                sale.getCreatedAt(),
                itemResponses,
                sale.getPaidAmount(),
                sale.getBalanceAmount(),
                sale.getCustomerName(),
                sale.getCustomerPhone()
        );
    }

    public BillResponse mapToBillResponse(Sale sale) {
        List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
        List<BillItemResponse> itemResponses = new ArrayList<>();

        for (SaleItem si : items) {
            String name = si.getProduct() != null ? si.getProduct().getName()
                    : (si.getService() != null ? si.getService().getName() : "Item");
            String type = si.getProduct() != null ? "PRODUCT" : "SERVICE";
            itemResponses.add(new BillItemResponse(name, si.getQuantity(), si.getUnitPrice(), si.getTotalPrice(), type));
        }

        return new BillResponse(
                sale.getId(),
                sale.getBillNumber(),
                sale.getTotalAmount(),
                sale.getDiscount(),
                sale.getGrandTotal(),
                sale.getPaymentMethod(),
                sale.getStatus(),
                sale.getCreatedAt(),
                itemResponses,
                sale.getPaidAmount(),
                sale.getBalanceAmount(),
                sale.getCustomerName(),
                sale.getCustomerPhone()
        );
    }
}
