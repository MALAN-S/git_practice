package com.xeroxshop.repository;

import com.xeroxshop.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {

    Optional<Sale> findByBillNumber(String billNumber);

    List<Sale> findByCreatedAtBetweenAndStatus(OffsetDateTime start, OffsetDateTime end, String status);

    List<Sale> findByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    // Count bills created today
    long countByCreatedAtBetweenAndStatus(OffsetDateTime start, OffsetDateTime end, String status);

    // Sum sales for a date range
    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.createdAt BETWEEN :start AND :end AND s.status = 'COMPLETED'")
    BigDecimal sumSalesBetween(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);

    // Sum sales by payment method for a date range
    @Query("SELECT COALESCE(SUM(s.grandTotal), 0) FROM Sale s WHERE s.createdAt BETWEEN :start AND :end AND s.status = 'COMPLETED' AND s.paymentMethod = :method")
    BigDecimal sumSalesByPaymentMethod(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end, @Param("method") String method);

    // Get recent completed sales (top N)
    List<Sale> findTop10ByStatusOrderByCreatedAtDesc(String status);
}

