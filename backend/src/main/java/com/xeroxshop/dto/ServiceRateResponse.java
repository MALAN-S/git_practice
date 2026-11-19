package com.xeroxshop.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceRateResponse(
    UUID id,
    UUID serviceId,
    String serviceName,
    String paperSize,
    String sides,
    BigDecimal pricePerPage,
    boolean active
) {}

