package com.xeroxshop.service;

import com.xeroxshop.model.Supplier;
import com.xeroxshop.repository.PurchaseRepository;
import com.xeroxshop.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByStatus("ACTIVE");
    }

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Integer id, Supplier updated) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setAddress(updated.getAddress());
        existing.setGstNumber(updated.getGstNumber());
        existing.setStatus(updated.getStatus() != null ? updated.getStatus() : existing.getStatus());
        return supplierRepository.save(existing);
    }

    public void deleteSupplier(Integer id) {
        List<?> purchases = purchaseRepository.findBySupplierId(id);
        if (!purchases.isEmpty()) {
            throw new RuntimeException("Cannot delete supplier with existing purchases. Found " + purchases.size() + " purchase(s).");
        }
        supplierRepository.deleteById(id);
    }
}
