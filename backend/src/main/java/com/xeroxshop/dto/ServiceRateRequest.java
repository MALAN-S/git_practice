package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceRateRequest(
    UUID serviceId,
    String paperSize,
    String sides,
    BigDecimal pricePerPage,
    boolean active
) {}

