package com.xeroxshop.config;

import com.xeroxshop.model.Category;
import com.xeroxshop.model.ServiceEntity;
import com.xeroxshop.model.ServiceRate;
import com.xeroxshop.model.User;
import com.xeroxshop.repository.CategoryRepository;
import com.xeroxshop.repository.ServiceEntityRepository;
import com.xeroxshop.repository.ServiceRateRepository;
import com.xeroxshop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ServiceEntityRepository serviceEntityRepository;

    @Autowired
    private ServiceRateRepository serviceRateRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Ensure default Admin user exists (username: admin, password: admin123)
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
        }

        // 2. Ensure default categories exist
        List<String> defaultCategories = Arrays.asList(
                "Stationery",
                "Paper & Printing",
                "Xerox Services",
                "Color Printing",
                "Desk Accessories"
        );
        for (String catName : defaultCategories) {
            if (categoryRepository.findByNameIgnoreCase(catName).isEmpty()) {
                Category cat = new Category();
                cat.setName(catName);
                categoryRepository.save(cat);
            }
        }

        // 3. Ensure essential Xerox & Printing services exist
        if (serviceEntityRepository.count() == 0) {
            createServiceWithRates("B&W Xerox", "Standard black & white photocopying",
                    new RateSpec("A4", "SINGLE", new BigDecimal("2.00")),
                    new RateSpec("A4", "DOUBLE", new BigDecimal("3.00")),
                    new RateSpec("A3", "SINGLE", new BigDecimal("5.00")),
                    new RateSpec("A3", "DOUBLE", new BigDecimal("8.00"))
            );

            createServiceWithRates("Color Printing", "High quality color print on premium paper",
                    new RateSpec("A4", "SINGLE", new BigDecimal("10.00")),
                    new RateSpec("A4", "DOUBLE", new BigDecimal("18.00")),
                    new RateSpec("A3", "SINGLE", new BigDecimal("25.00"))
            );

            createServiceWithRates("Document Scanning", "Digital high-resolution document scan to PDF/JPG",
                    new RateSpec("A4", "SINGLE", new BigDecimal("5.00")),
                    new RateSpec("A3", "SINGLE", new BigDecimal("10.00"))
            );

            createServiceWithRates("Lamination", "Protective plastic sheet heat lamination",
                    new RateSpec("A4", "SINGLE", new BigDecimal("20.00")),
                    new RateSpec("A3", "SINGLE", new BigDecimal("40.00"))
            );

            createServiceWithRates("Spiral Binding", "Document binding with transparent cover and comb/spiral",
                    new RateSpec("A4", "SINGLE", new BigDecimal("35.00"))
            );
        }
    }

    private void createServiceWithRates(String name, String desc, RateSpec... rates) {
        ServiceEntity svc = new ServiceEntity();
        svc.setName(name);
        svc.setDescription(desc);
        svc.setStatus("ACTIVE");
        ServiceEntity saved = serviceEntityRepository.save(svc);

        for (RateSpec r : rates) {
            ServiceRate sr = new ServiceRate();
            sr.setService(saved);
            sr.setPaperSize(r.paperSize());
            sr.setSides(r.sides());
            sr.setPricePerPage(r.price());
            sr.setActive(true);
            serviceRateRepository.save(sr);
        }
    }

    private record RateSpec(String paperSize, String sides, BigDecimal price) {}
}
