package com.xeroxshop.repository;

import com.xeroxshop.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerPhone(String customerPhone);
    Optional<Customer> findByCustomerName(String customerName);
}

