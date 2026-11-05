package com.xeroxshop.repository;

import com.xeroxshop.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Integer> {

    List<StockTransaction> findByProductIdOrderByCreatedAtDesc(UUID productId);
}

