package com.xeroxshop.repository;

import com.xeroxshop.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<Refund, Integer> {

    List<Refund> findBySaleId(UUID saleId);
}

