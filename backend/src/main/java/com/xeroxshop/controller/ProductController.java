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
        String csvContent = "Product Name,SKU,Category,Purchase Price,Selling Price,Current Stock,Min Stock Level,Description\n" +
                "A4 Copier Paper 75 GSM (500 Sheets),P-A4-75,Paper & Stationery,240.00,320.00,50,10,High quality A4 printing paper\n" +
                "Blue Ball Pen (0.7mm),P-PEN-BLU,Writing,5.00,10.00,100,20,Smooth flow blue ball point pen\n" +
                "Black Gel Pen,P-PEN-BLK,Writing,12.00,20.00,60,15,Waterproof black gel pen\n" +
                "Spiral Notebook (160 Pages),P-NOTE-160,Notebooks,45.00,70.00,35,5,Ruled student notebook\n" +
                "Stapler No. 10,P-STP-10,Desk Accessories,65.00,95.00,20,5,Compact metal stapler\n" +
                "Stapler Pins No. 10 Box,P-STP-PIN,Desk Accessories,15.00,25.00,40,10,Compatible stapler pin box\n" +
                "Transparent File Folder A4,P-FLD-CLR,Files & Folders,10.00,20.00,80,15,Plastic document folder\n" +
                "Sticky Notes 3x3 Yellow,P-STK-YEL,Desk Accessories,25.00,40.00,30,8,Self-adhesive reminder pads\n" +
                "Permanent Marker Black,P-MKR-BLK,Writing,18.00,30.00,45,10,Bold bullet tip marker\n" +
                "Calculator 12-Digit,P-CALC-12,Electronics,220.00,350.00,15,3,Dual power desktop calculator\n";

        byte[] bytes = csvContent.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"shop_items_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(bytes);
    }
}
