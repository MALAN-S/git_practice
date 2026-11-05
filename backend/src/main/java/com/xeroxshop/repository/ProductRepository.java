package com.xeroxshop.repository;

import com.xeroxshop.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByNameContainingIgnoreCase(String name);

    List<Product> findByCategoryId(Integer categoryId);

    List<Product> findByStatus(String status);

    // Find products where current stock is at or below min stock level
    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.minStockLevel AND p.status = 'ACTIVE'")
    List<Product> findLowStockProducts();
}

