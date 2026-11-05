package com.xeroxshop.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "service_rates")
public class ServiceRate {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private ServiceEntity service;

    @Column(name = "paper_size", nullable = false, length = 10)
    private String paperSize; // A4, A3, etc.

    @Column(nullable = false, length = 10)
    private String sides; // SINGLE or DOUBLE

    @Column(name = "price_per_page", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerPage;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

