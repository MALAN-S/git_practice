package com.xeroxshop.repository;

import com.xeroxshop.model.PurchasePayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchasePaymentRepository extends JpaRepository<PurchasePayment, Integer> {

    List<PurchasePayment> findByPurchaseIdOrderByPaidAtAsc(Integer purchaseId);
}
