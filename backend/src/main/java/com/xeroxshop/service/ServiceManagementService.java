package com.xeroxshop.service;

import com.xeroxshop.dto.ServiceRateRequest;
import com.xeroxshop.dto.ServiceRateResponse;
import com.xeroxshop.dto.ServiceRequest;
import com.xeroxshop.model.ServiceEntity;
import com.xeroxshop.model.ServiceRate;
import com.xeroxshop.repository.ServiceEntityRepository;
import com.xeroxshop.repository.ServiceRateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServiceManagementService {

    @Autowired
    private ServiceEntityRepository serviceEntityRepository;

    @Autowired
    private ServiceRateRepository serviceRateRepository;

    // Services CRUD
    public List<ServiceEntity> getAllServices() {
        return serviceEntityRepository.findAll();
    }

    public ServiceEntity createService(ServiceRequest request) {
        ServiceEntity svc = new ServiceEntity();
        svc.setName(request.name());
        svc.setDescription(request.description());
        svc.setStatus(request.status() != null ? request.status() : "ACTIVE");
        return serviceEntityRepository.save(svc);
    }

    public ServiceEntity updateService(UUID id, ServiceRequest request) {
        ServiceEntity svc = serviceEntityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
        svc.setName(request.name());
        svc.setDescription(request.description());
        if (request.status() != null) {
            svc.setStatus(request.status());
        }
        return serviceEntityRepository.save(svc);
    }

    // Rates CRUD
    public List<ServiceRateResponse> getAllRates() {
        return serviceRateRepository.findAll().stream()
                .map(this::mapToRateResponse)
                .collect(Collectors.toList());
    }

    public List<ServiceRateResponse> getRatesByServiceId(UUID serviceId) {
        return serviceRateRepository.findByServiceId(serviceId).stream()
                .map(this::mapToRateResponse)
                .collect(Collectors.toList());
    }

    public ServiceRateResponse createRate(ServiceRateRequest request) {
        ServiceEntity svc = serviceEntityRepository.findById(request.serviceId())
                .orElseThrow(() -> new RuntimeException("Service not found: " + request.serviceId()));

        ServiceRate rate = new ServiceRate();
        rate.setService(svc);
        rate.setPaperSize(request.paperSize());
        rate.setSides(request.sides());
        rate.setPricePerPage(request.pricePerPage());
        rate.setActive(request.active());

        ServiceRate saved = serviceRateRepository.save(rate);
        return mapToRateResponse(saved);
    }

    public ServiceRateResponse updateRate(UUID id, ServiceRateRequest request) {
        ServiceRate rate = serviceRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service rate not found: " + id));

        rate.setPaperSize(request.paperSize());
        rate.setSides(request.sides());
        rate.setPricePerPage(request.pricePerPage());
        rate.setActive(request.active());

        ServiceRate updated = serviceRateRepository.save(rate);
        return mapToRateResponse(updated);
    }

    public void deleteRate(UUID id) {
        serviceRateRepository.deleteById(id);
    }

    public ServiceRateResponse mapToRateResponse(ServiceRate r) {
        return new ServiceRateResponse(
                r.getId(),
                r.getService() != null ? r.getService().getId() : null,
                r.getService() != null ? r.getService().getName() : "Unknown",
                r.getPaperSize(),
                r.getSides(),
                r.getPricePerPage(),
                r.isActive()
        );
    }
}

