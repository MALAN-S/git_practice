package com.xeroxshop.repository;

import com.xeroxshop.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Integer> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    List<Supplier> findByStatus(String status);
}
