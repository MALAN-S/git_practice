package com.xeroxshop.repository;

import com.xeroxshop.model.Payment;
import com.xeroxshop.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findBySaleIdOrderByCreatedAtAsc(UUID saleId);
    List<Payment> findBySaleOrderByCreatedAtAsc(Sale sale);
    List<Payment> findBySaleInOrderByCreatedAtAsc(Collection<Sale> sales);
}
