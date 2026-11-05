package com.xeroxshop.repository;

import com.xeroxshop.model.ServiceRate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ServiceRateRepository extends JpaRepository<ServiceRate, UUID> {

    List<ServiceRate> findByServiceId(UUID serviceId);

    List<ServiceRate> findByActiveTrue();
}

