package com.xeroxshop.repository;

import com.xeroxshop.model.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, UUID> {
    Optional<ServiceEntity> findByName(String name);
}
