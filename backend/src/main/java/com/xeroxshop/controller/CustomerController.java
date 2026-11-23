package com.xeroxshop.controller;

import com.xeroxshop.model.*;
import com.xeroxshop.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private SaleItemRepository saleItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private AppSettingRepository appSettingRepository;

    public record AddCustomerRequest(
        String customerName,
        String customerPhone,
        BigDecimal totalAmount,
        BigDecimal paidAmount,
        String paymentMethod,
        String notes,
        String email,
        String address
    ) {}

    /**
     * Returns aggregated customer list combining registered customers and sales partial-payment history.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getCustomers() {
        List<Sale> allSales = saleRepository.findAll();

        // Filter sales that have customer info
        List<Sale> customerSales = allSales.stream()
                .filter(s -> s.getCustomerName() != null && !s.getCustomerName().isBlank())
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        // Group by customerPhone (primary key) falling back to customerName
        Map<String, List<Sale>> grouped = customerSales.stream()
                .collect(Collectors.groupingBy(s -> {
                    String phone = s.getCustomerPhone() != null ? s.getCustomerPhone().trim() : "";
                    String name = s.getCustomerName() != null ? s.getCustomerName().trim() : "";
                    return phone.isEmpty() ? "name:" + name.toLowerCase() : "phone:" + phone;
                }));

        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> processedKeys = new HashSet<>();

        for (Map.Entry<String, List<Sale>> entry : grouped.entrySet()) {
            processedKeys.add(entry.getKey());
            List<Sale> sales = entry.getValue();
            Sale first = sales.get(0);

            BigDecimal totalAmount = sales.stream()
                    .map(Sale::getGrandTotal)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalPaid = sales.stream()
                    .map(s -> s.getPaidAmount() != null ? s.getPaidAmount() : s.getGrandTotal())
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalBalance = sales.stream()
                    .map(s -> s.getBalanceAmount() != null ? s.getBalanceAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long partialCount = sales.stream()
                    .filter(s -> "PARTIAL".equalsIgnoreCase(s.getStatus()) &&
                                 s.getBalanceAmount() != null &&
                                 s.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0)
                    .count();

            // Build bill summaries with payment history
            List<Map<String, Object>> billSummaries = sales.stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .map(s -> {
                        Map<String, Object> bill = new LinkedHashMap<>();
                        bill.put("id", s.getId());
                        bill.put("billNumber", s.getBillNumber());
                        bill.put("grandTotal", s.getGrandTotal());
                        bill.put("paidAmount", s.getPaidAmount() != null ? s.getPaidAmount() : s.getGrandTotal());
                        bill.put("balanceAmount", s.getBalanceAmount() != null ? s.getBalanceAmount() : BigDecimal.ZERO);
                        bill.put("status", s.getStatus());
                        bill.put("paymentMethod", s.getPaymentMethod());
                        bill.put("createdAt", s.getCreatedAt());

                        // Fetch payments for this specific bill
                        List<Payment> salePayments = paymentRepository.findBySaleIdOrderByCreatedAtAsc(s.getId());
                        List<Map<String, Object>> paymentList = new ArrayList<>();
                        if (salePayments != null && !salePayments.isEmpty()) {
                            for (Payment p : salePayments) {
                                Map<String, Object> pm = new LinkedHashMap<>();
                                pm.put("id", p.getId());
                                pm.put("amount", p.getAmount());
                                pm.put("method", p.getMethod());
                                pm.put("transactionRef", p.getTransactionRef());
                                pm.put("createdAt", p.getCreatedAt());
                                paymentList.add(pm);
                            }
                        } else if (s.getPaidAmount() != null && s.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
                            Map<String, Object> pm = new LinkedHashMap<>();
                            pm.put("id", 0);
                            pm.put("amount", s.getPaidAmount());
                            pm.put("method", s.getPaymentMethod() != null ? s.getPaymentMethod() : "CASH");
                            pm.put("transactionRef", s.getBillNumber());
                            pm.put("createdAt", s.getCreatedAt());
                            paymentList.add(pm);
                        }
                        bill.put("payments", paymentList);
                        return bill;
                    })
                    .collect(Collectors.toList());

            // Build allPayments timeline for customer
            List<Map<String, Object>> allPayments = new ArrayList<>();
            for (Map<String, Object> b : billSummaries) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> pms = (List<Map<String, Object>>) b.get("payments");
                if (pms != null) {
                    for (Map<String, Object> p : pms) {
                        Map<String, Object> cp = new LinkedHashMap<>(p);
                        cp.put("billNumber", b.get("billNumber"));
                        cp.put("billGrandTotal", b.get("grandTotal"));
                        allPayments.add(cp);
                    }
                }
            }
            allPayments.sort((a, b) -> {
                OffsetDateTime t1 = (OffsetDateTime) a.get("createdAt");
                OffsetDateTime t2 = (OffsetDateTime) b.get("createdAt");
                if (t1 != null && t2 != null) return t2.compareTo(t1);
                return 0;
            });

            Map<String, Object> customer = new LinkedHashMap<>();
            customer.put("customerName", first.getCustomerName());
            customer.put("customerPhone", first.getCustomerPhone());
            customer.put("totalBills", sales.size());
            customer.put("pendingBills", partialCount);
            customer.put("totalAmount", totalAmount);
            customer.put("totalPaid", totalPaid);
            customer.put("totalBalance", totalBalance);
            customer.put("lastVisit", sales.stream()
                    .map(Sale::getCreatedAt)
                    .filter(Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null));
            customer.put("bills", billSummaries);
            customer.put("payments", allPayments);

            result.add(customer);
        }

        // Add registered customers who don't have sales yet
        List<Customer> registeredCustomers = customerRepository.findAll();
        for (Customer rc : registeredCustomers) {
            String phoneKey = rc.getCustomerPhone() != null && !rc.getCustomerPhone().isBlank()
                    ? "phone:" + rc.getCustomerPhone().trim()
                    : "name:" + (rc.getCustomerName() != null ? rc.getCustomerName().trim().toLowerCase() : "");

            if (!processedKeys.contains(phoneKey)) {
                Map<String, Object> customer = new LinkedHashMap<>();
                customer.put("customerName", rc.getCustomerName());
                customer.put("customerPhone", rc.getCustomerPhone());
                customer.put("totalBills", 0);
                customer.put("pendingBills", 0);
                customer.put("totalAmount", BigDecimal.ZERO);
                customer.put("totalPaid", BigDecimal.ZERO);
                customer.put("totalBalance", BigDecimal.ZERO);
                customer.put("lastVisit", rc.getCreatedAt());
                customer.put("bills", Collections.emptyList());
                customer.put("payments", Collections.emptyList());
                customer.put("notes", rc.getNotes());
                customer.put("email", rc.getEmail());
                customer.put("address", rc.getAddress());
                result.add(customer);
                processedKeys.add(phoneKey);
            }
        }

        // Sort: customers with pending balance first, then by last visit descending
        result.sort((a, b) -> {
            BigDecimal balA = (BigDecimal) a.get("totalBalance");
            BigDecimal balB = (BigDecimal) b.get("totalBalance");
            boolean hasPendingA = balA != null && balA.compareTo(BigDecimal.ZERO) > 0;
            boolean hasPendingB = balB != null && balB.compareTo(BigDecimal.ZERO) > 0;
            if (hasPendingA != hasPendingB) return hasPendingA ? -1 : 1;

            OffsetDateTime dateA = (OffsetDateTime) a.get("lastVisit");
            OffsetDateTime dateB = (OffsetDateTime) b.get("lastVisit");
            if (dateA != null && dateB != null) return dateB.compareTo(dateA);
            return 0;
        });

        return ResponseEntity.ok(result);
    }

    /**
     * Add a customer manually with optional opening total, paid, and balance due values.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> addCustomer(@RequestBody AddCustomerRequest req) {
        if (req.customerName() == null || req.customerName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Customer name is required"));
        }

        String name = req.customerName().trim();
        String phone = req.customerPhone() != null ? req.customerPhone().trim() : "";

        // 1. Save or update customer record in Customer entity
        Customer customer = null;
        if (!phone.isEmpty()) {
            customer = customerRepository.findByCustomerPhone(phone).orElse(null);
        }
        if (customer == null) {
            customer = customerRepository.findByCustomerName(name).orElse(null);
        }
        if (customer == null) {
            customer = new Customer();
        }
        customer.setCustomerName(name);
        customer.setCustomerPhone(phone);
        customer.setEmail(req.email() != null ? req.email().trim() : null);
        customer.setAddress(req.address() != null ? req.address().trim() : null);
        customer.setNotes(req.notes() != null ? req.notes().trim() : null);
        customerRepository.save(customer);

        // 2. If totalAmount > 0, generate a Sale bill with paid & balance due
        BigDecimal total = req.totalAmount() != null ? req.totalAmount() : BigDecimal.ZERO;
        BigDecimal paid = req.paidAmount() != null ? req.paidAmount() : BigDecimal.ZERO;

        if (total.compareTo(BigDecimal.ZERO) > 0 || paid.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal effectiveTotal = total.compareTo(BigDecimal.ZERO) > 0 ? total : paid;
            BigDecimal effectivePaid = paid.min(effectiveTotal);
            BigDecimal balance = effectiveTotal.subtract(effectivePaid);

            String prefix = appSettingRepository.findById("billPrefix")
                    .map(AppSetting::getValue)
                    .orElse("BILL");

            int counter = appSettingRepository.findById("billCounter")
                    .map(s -> Integer.parseInt(s.getValue()))
                    .orElse(0);
            counter++;
            appSettingRepository.save(new AppSetting("billCounter", String.valueOf(counter)));

            String billNumber = prefix + "-" + String.format("%03d", counter);

            Sale sale = new Sale();
            sale.setBillNumber(billNumber);
            sale.setCustomerName(name);
            sale.setCustomerPhone(phone);
            sale.setTotalAmount(effectiveTotal);
            sale.setDiscount(BigDecimal.ZERO);
            sale.setGrandTotal(effectiveTotal);
            sale.setPaidAmount(effectivePaid);
            sale.setBalanceAmount(balance);
            sale.setPaymentMethod(req.paymentMethod() != null && !req.paymentMethod().isBlank() ? req.paymentMethod() : "CASH");
            sale.setStatus(balance.compareTo(BigDecimal.ZERO) > 0 ? "PARTIAL" : "COMPLETED");
            sale.setCreatedAt(OffsetDateTime.now());
            Sale savedSale = saleRepository.save(sale);

            SaleItem item = new SaleItem();
            item.setSale(savedSale);
            item.setQuantity(1);
            item.setUnitPrice(effectiveTotal);
            item.setTotalPrice(effectiveTotal);
            saleItemRepository.save(item);

            if (effectivePaid.compareTo(BigDecimal.ZERO) > 0) {
                Payment payment = new Payment();
                payment.setSale(savedSale);
                payment.setMethod(savedSale.getPaymentMethod());
                payment.setAmount(effectivePaid);
                payment.setTransactionRef(billNumber);
                paymentRepository.save(payment);
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Customer '" + name + "' added successfully",
                "customerName", name,
                "customerPhone", phone
        ));
    }
}
