package com.xeroxshop.repository;

import com.xeroxshop.model.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, Integer> {

    List<SaleItem> findBySaleId(UUID saleId);

    // Sum sales for items that reference a product in a given category, within a date range
    @Query("SELECT COALESCE(SUM(si.totalPrice), 0) FROM SaleItem si " +
           "JOIN si.sale s JOIN si.product p " +
           "WHERE p.category.name = :categoryName " +
           "AND s.createdAt BETWEEN :start AND :end " +
           "AND s.status = 'COMPLETED'")
    BigDecimal sumSalesByProductCategory(@Param("categoryName") String categoryName,
                                         @Param("start") OffsetDateTime start,
                                         @Param("end") OffsetDateTime end);

    // Sum sales for service items within a date range
    @Query("SELECT COALESCE(SUM(si.totalPrice), 0) FROM SaleItem si " +
           "JOIN si.sale s " +
           "WHERE si.service IS NOT NULL " +
           "AND s.createdAt BETWEEN :start AND :end " +
           "AND s.status = 'COMPLETED'")
    BigDecimal sumServiceSales(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);
}

