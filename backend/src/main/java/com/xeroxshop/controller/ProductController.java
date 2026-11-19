package com.xeroxshop.controller;

import com.xeroxshop.dto.CsvImportResponse;
import com.xeroxshop.dto.ProductRequest;
import com.xeroxshop.dto.ProductResponse;
import com.xeroxshop.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId) {
        return ResponseEntity.ok(productService.getAllProducts(search, categoryId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<ProductResponse>> getLowStockProducts() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable UUID id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-csv")
    public ResponseEntity<CsvImportResponse> importCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(new CsvImportResponse(0, 0, 0, List.of(), List.of("Uploaded CSV file is empty")));
        }
        return ResponseEntity.ok(productService.importProductsFromCsv(file));
    }

    @GetMapping(value = "/sample-csv", produces = "text/csv")
    public ResponseEntity<byte[]> downloadSampleCsv() {
        String csvContent = "\"S.NO\",\"Product Name (e.g. Pen)\",\"SKU (e.g. PEN-001)\",\"Category (e.g. Stationery)\",\"Purchase Price (e.g. 5.00)\",\"Selling Price (e.g. 10.00)\",\"Current Stock (e.g. 50)\",\"Min Stock Level (e.g. 10)\",\"Description (e.g. Blue ball pen)\"\n";

        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"shop_items_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
