package com.xeroxshop.service;

import com.xeroxshop.dto.ProductRequest;
import com.xeroxshop.dto.ProductResponse;
import com.xeroxshop.model.Category;
import com.xeroxshop.model.Product;
import com.xeroxshop.model.StockTransaction;
import com.xeroxshop.repository.CategoryRepository;
import com.xeroxshop.repository.ProductRepository;
import com.xeroxshop.repository.StockTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    public List<ProductResponse> getAllProducts(String search, Integer categoryId) {
        List<Product> products;
        if (search != null && !search.trim().isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCase(search.trim());
        } else if (categoryId != null) {
            products = productRepository.findByCategoryId(categoryId);
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ProductResponse getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setSku(request.sku());
        product.setDescription(request.description());
        product.setPurchasePrice(request.purchasePrice());
        product.setSellingPrice(request.sellingPrice());
        product.setCurrentStock(request.currentStock());
        product.setMinStockLevel(request.minStockLevel());
        product.setImageUrl(request.imageUrl());
        product.setStatus(request.status() != null ? request.status() : "ACTIVE");

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.categoryId()));
            product.setCategory(category);
        }

        Product saved = productRepository.save(product);

        // Record initial stock transaction if stock > 0
        if (saved.getCurrentStock() > 0) {
            StockTransaction tx = new StockTransaction();
            tx.setProduct(saved);
            tx.setType("IN");
            tx.setQuantity(saved.getCurrentStock());
            tx.setReference("INITIAL_STOCK");
            stockTransactionRepository.save(tx);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(request.name());
        product.setSku(request.sku());
        product.setDescription(request.description());
        product.setPurchasePrice(request.purchasePrice());
        product.setSellingPrice(request.sellingPrice());
        product.setMinStockLevel(request.minStockLevel());
        product.setImageUrl(request.imageUrl());
        if (request.status() != null) {
            product.setStatus(request.status());
        }

        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.categoryId()));
            product.setCategory(category);
        }

        Product updated = productRepository.save(product);
        return mapToResponse(updated);
    }

    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        product.setStatus("INACTIVE");
        productRepository.save(product);
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse mapToResponse(Product p) {
        boolean isLow = p.getCurrentStock() <= p.getMinStockLevel();
        String catName = p.getCategory() != null ? p.getCategory().getName() : null;
        Integer catId = p.getCategory() != null ? p.getCategory().getId() : null;

        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getSku(),
                p.getDescription(),
                p.getPurchasePrice(),
                p.getSellingPrice(),
                p.getCurrentStock(),
                p.getMinStockLevel(),
                p.getImageUrl(),
                p.getStatus(),
                catId,
                catName,
                isLow
        );
    }
}

