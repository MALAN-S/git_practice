package com.xeroxshop.controller;

import com.xeroxshop.dto.ServiceRateRequest;
import com.xeroxshop.dto.ServiceRateResponse;
import com.xeroxshop.dto.ServiceRequest;
import com.xeroxshop.model.ServiceEntity;
import com.xeroxshop.service.ServiceManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ServiceController {

    @Autowired
    private ServiceManagementService serviceManagementService;

    // Services
    @GetMapping("/services")
    public ResponseEntity<List<ServiceEntity>> getAllServices() {
        return ResponseEntity.ok(serviceManagementService.getAllServices());
    }

    @PostMapping("/services")
    public ResponseEntity<ServiceEntity> createService(@RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceManagementService.createService(request));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ServiceEntity> updateService(@PathVariable UUID id, @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceManagementService.updateService(id, request));
    }

    // Service Rates
    @GetMapping("/service-rates")
    public ResponseEntity<List<ServiceRateResponse>> getAllRates() {
        return ResponseEntity.ok(serviceManagementService.getAllRates());
    }

    @GetMapping("/service-rates/service/{serviceId}")
    public ResponseEntity<List<ServiceRateResponse>> getRatesByService(@PathVariable UUID serviceId) {
        return ResponseEntity.ok(serviceManagementService.getRatesByServiceId(serviceId));
    }

    @PostMapping("/service-rates")
    public ResponseEntity<ServiceRateResponse> createRate(@RequestBody ServiceRateRequest request) {
        return ResponseEntity.ok(serviceManagementService.createRate(request));
    }

    @PutMapping("/service-rates/{id}")
    public ResponseEntity<ServiceRateResponse> updateRate(@PathVariable UUID id, @RequestBody ServiceRateRequest request) {
        return ResponseEntity.ok(serviceManagementService.updateRate(id, request));
    }

    @DeleteMapping("/service-rates/{id}")
    public ResponseEntity<Void> deleteRate(@PathVariable UUID id) {
        serviceManagementService.deleteRate(id);
        return ResponseEntity.noContent().build();
    }
}

