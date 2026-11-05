package com.xeroxshop.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "sales")
public class Sale {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "bill_number", nullable = false, unique = true, length = 20)
    private String billNumber;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal discount;

    @Column(name = "grand_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod; // CASH, UPI, CARD

    @Column(nullable = false, length = 15)
    private String status; // COMPLETED, CANCELLED, REFUNDED

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<SaleItem> saleItems = new ArrayList<>();

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

