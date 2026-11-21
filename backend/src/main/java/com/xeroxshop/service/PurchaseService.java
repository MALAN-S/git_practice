package com.xeroxshop.service;

import com.xeroxshop.dto.PurchaseItemRequest;
import com.xeroxshop.dto.PurchaseRequest;
import com.xeroxshop.model.Product;
import com.xeroxshop.model.Purchase;
import com.xeroxshop.model.PurchaseItem;
import com.xeroxshop.model.PurchasePayment;
import com.xeroxshop.model.Supplier;
import com.xeroxshop.repository.CategoryRepository;
import com.xeroxshop.repository.ProductRepository;
import com.xeroxshop.repository.PurchasePaymentRepository;
import com.xeroxshop.repository.PurchaseRepository;
import com.xeroxshop.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PurchasePaymentRepository purchasePaymentRepository;

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    public Purchase getPurchaseById(Integer id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found"));
    }

    public List<Purchase> getPurchasesBetween(LocalDate start, LocalDate end) {
        return purchaseRepository.findByPurchaseDateBetween(start, end);
    }

    public List<Purchase> getPurchasesBySupplier(Integer supplierId) {
        return purchaseRepository.findBySupplierId(supplierId);
    }

    public List<PurchasePayment> getPaymentHistory(Integer purchaseId) {
        return purchasePaymentRepository.findByPurchaseIdOrderByPaidAtAsc(purchaseId);
    }

    @Transactional
    public Purchase createPurchase(PurchaseRequest req) {
        Supplier supplier = supplierRepository.findById(req.supplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Purchase purchase = new Purchase();
        purchase.setSupplier(supplier);
        purchase.setPurchaseDate(req.purchaseDate() != null ? req.purchaseDate() : LocalDate.now());
        purchase.setInvoiceNumber(req.invoiceNumber());
        purchase.setPaymentMethod(req.paymentMethod() != null ? req.paymentMethod() : "CASH");
        purchase.setPaymentStatus(req.paymentStatus() != null ? req.paymentStatus() : "PAID");
        purchase.setPaidAmount(req.paidAmount());
        purchase.setNotes(req.notes());
        purchase.setDiscount(req.discount() != null ? req.discount() : BigDecimal.ZERO);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PurchaseItem> items = new ArrayList<>();

        if (req.items() != null) {
            for (PurchaseItemRequest itemReq : req.items()) {
                PurchaseItem item = new PurchaseItem();
                item.setPurchase(purchase);
                item.setItemName(itemReq.itemName());
                item.setQuantity(itemReq.quantity());
                item.setUnitPrice(itemReq.unitPrice() != null ? itemReq.unitPrice() : BigDecimal.ZERO);
                item.setMrp(itemReq.mrp());
                item.setSku(itemReq.sku() != null && !itemReq.sku().isBlank() ? itemReq.sku().trim() : null);
                BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
                item.setTotalPrice(lineTotal);
                totalAmount = totalAmount.add(lineTotal);

                // Link product and update stock + prices if productId provided
                if (itemReq.productId() != null) {
                    Product product = productRepository.findById(itemReq.productId()).orElse(null);
                    if (product != null) {
                        item.setProduct(product);
                        if (item.getItemName() == null || item.getItemName().isBlank()) {
                            item.setItemName(product.getName());
                        }
                        if (item.getSku() == null || item.getSku().isBlank()) {
                            item.setSku(product.getSku());
                        }
                        product.setCurrentStock(product.getCurrentStock() + itemReq.quantity());
                        // Update product purchase price and selling price (MRP)
                        if (itemReq.unitPrice() != null && itemReq.unitPrice().compareTo(BigDecimal.ZERO) > 0) {
                            product.setPurchasePrice(itemReq.unitPrice());
                        }
                        if (itemReq.mrp() != null && itemReq.mrp().compareTo(BigDecimal.ZERO) > 0) {
                            product.setSellingPrice(itemReq.mrp());
                        }
                        productRepository.save(product);
                    }
                } else if (itemReq.itemName() != null && !itemReq.itemName().isBlank()) {
                    // Auto-create a new product in inventory for custom items
                    String itemNameTrimmed = itemReq.itemName().trim();
                    List<Product> existing = productRepository.findByNameContainingIgnoreCase(itemNameTrimmed);
                    Product matchedProduct = existing.stream()
                            .filter(p -> p.getName().equalsIgnoreCase(itemNameTrimmed))
                            .findFirst().orElse(null);

                    if (matchedProduct != null) {
                        item.setProduct(matchedProduct);
                        if (item.getSku() == null || item.getSku().isBlank()) {
                            item.setSku(matchedProduct.getSku());
                        }
                        matchedProduct.setCurrentStock(matchedProduct.getCurrentStock() + itemReq.quantity());
                        if (itemReq.unitPrice() != null && itemReq.unitPrice().compareTo(BigDecimal.ZERO) > 0) {
                            matchedProduct.setPurchasePrice(itemReq.unitPrice());
                        }
                        if (itemReq.mrp() != null && itemReq.mrp().compareTo(BigDecimal.ZERO) > 0) {
                            matchedProduct.setSellingPrice(itemReq.mrp());
                        }
                        productRepository.save(matchedProduct);
                    } else {
                        Product newProduct = new Product();
                        String sku = itemReq.sku() != null && !itemReq.sku().isBlank()
                                ? itemReq.sku().trim().replaceAll("[^a-zA-Z0-9_-]", "").toUpperCase()
                                : itemNameTrimmed.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
                        if (sku.length() > 30) sku = sku.substring(0, 30);
                        if (sku.isBlank()) sku = "PROD";
                        String baseSku = sku;
                        int suffix = 1;
                        while (productRepository.existsBySku(sku)) {
                            sku = baseSku + "-" + suffix;
                            suffix++;
                        }
                        newProduct.setSku(sku);
                        item.setSku(sku);
                        newProduct.setName(itemNameTrimmed);
                        newProduct.setDescription("Auto-created from purchase");
                        newProduct.setPurchasePrice(itemReq.unitPrice() != null ? itemReq.unitPrice() : BigDecimal.ZERO);
                        BigDecimal selling = (itemReq.mrp() != null && itemReq.mrp().compareTo(BigDecimal.ZERO) > 0)
                                ? itemReq.mrp()
                                : (itemReq.unitPrice() != null ? itemReq.unitPrice() : BigDecimal.ZERO);
                        newProduct.setSellingPrice(selling);
                        newProduct.setCurrentStock(itemReq.quantity());
                        newProduct.setMinStockLevel(5);
                        newProduct.setStatus("ACTIVE");
                        categoryRepository.findByNameIgnoreCase("Stationery").ifPresent(newProduct::setCategory);
                        newProduct = productRepository.save(newProduct);
                        item.setProduct(newProduct);
                    }
                }

                items.add(item);
            }
        }

        purchase.setTotalAmount(totalAmount);
        BigDecimal discount = purchase.getDiscount() != null ? purchase.getDiscount() : BigDecimal.ZERO;
        BigDecimal grandTotal = totalAmount.subtract(discount);
        purchase.setGrandTotal(grandTotal);

        if ("PAID".equalsIgnoreCase(purchase.getPaymentStatus())) {
            purchase.setPaidAmount(grandTotal);
        } else if ("UNPAID".equalsIgnoreCase(purchase.getPaymentStatus())) {
            purchase.setPaidAmount(BigDecimal.ZERO);
        } else {
            // PARTIAL
            if (purchase.getPaidAmount() == null) {
                purchase.setPaidAmount(BigDecimal.ZERO);
            }
        }

        purchase.setItems(items);

        // Save the purchase first to get the ID
        Purchase saved = purchaseRepository.save(purchase);

        // Record the initial payment in payment history (if any amount was paid)
        BigDecimal initialPaid = saved.getPaidAmount() != null ? saved.getPaidAmount() : BigDecimal.ZERO;
        if (initialPaid.compareTo(BigDecimal.ZERO) > 0) {
            PurchasePayment initialPayment = new PurchasePayment();
            initialPayment.setPurchase(saved);
            initialPayment.setAmount(initialPaid);
            initialPayment.setPaymentMethod(saved.getPaymentMethod());
            initialPayment.setNotes("Initial payment at purchase");
            purchasePaymentRepository.save(initialPayment);
        }

        return saved;
    }

    @Transactional
    public Purchase payBalance(Integer id, BigDecimal amount, String paymentMethod) {
        Purchase purchase = getPurchaseById(id);
        BigDecimal currentPaid = purchase.getPaidAmount() != null ? purchase.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal grandTotal = purchase.getGrandTotal() != null ? purchase.getGrandTotal() : BigDecimal.ZERO;
        BigDecimal balance = grandTotal.subtract(currentPaid);

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Purchase is already fully paid.");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than zero.");
        }

        BigDecimal newPaid = currentPaid.add(amount);
        if (newPaid.compareTo(grandTotal) >= 0) {
            purchase.setPaidAmount(grandTotal);
            purchase.setPaymentStatus("PAID");
        } else {
            purchase.setPaidAmount(newPaid);
            purchase.setPaymentStatus("PARTIAL");
        }

        if (paymentMethod != null && !paymentMethod.isBlank()) {
            purchase.setPaymentMethod(paymentMethod);
        }

        // Record this payment in payment history
        PurchasePayment payment = new PurchasePayment();
        payment.setPurchase(purchase);
        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod != null && !paymentMethod.isBlank() ? paymentMethod : purchase.getPaymentMethod());
        payment.setNotes("Balance payment");
        purchasePaymentRepository.save(payment);

        return purchaseRepository.save(purchase);
    }

    @Transactional
    public void deletePurchase(Integer id) {
        purchaseRepository.deleteById(id);
    }
}
