package com.xeroxshop.repository;

import com.xeroxshop.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PurchaseRepository extends JpaRepository<Purchase, Integer> {

    List<Purchase> findByPurchaseDateBetween(LocalDate start, LocalDate end);

    List<Purchase> findBySupplierId(Integer supplierId);

    @Query("SELECT COALESCE(SUM(p.grandTotal), 0) FROM Purchase p WHERE p.purchaseDate BETWEEN :start AND :end")
    BigDecimal sumPurchasesBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
