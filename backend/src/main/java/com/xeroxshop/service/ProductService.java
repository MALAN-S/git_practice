package com.xeroxshop.service;

import com.xeroxshop.dto.CsvImportResponse;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
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

    @Transactional
    public CsvImportResponse importProductsFromCsv(MultipartFile file) {
        int totalRows = 0;
        int importedCount = 0;
        int skippedCount = 0;
        List<String> messages = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                return new CsvImportResponse(0, 0, 0, messages, List.of("CSV file is empty"));
            }

            // Remove potential UTF-8 BOM
            if (headerLine.startsWith("\uFEFF")) {
                headerLine = headerLine.substring(1);
            }

            List<String> headers = parseCsvLine(headerLine);
            Map<String, Integer> colMap = new HashMap<>();
            for (int i = 0; i < headers.size(); i++) {
                String raw = headers.get(i).trim().toLowerCase();
                // 1. Full clean string (e.g. "productnameegpen")
                colMap.put(raw.replaceAll("[^a-z0-9]", ""), i);

                // 2. Clean string without parenthetical hints (e.g. "Product Name (e.g. Pen)" -> "productname")
                String withoutParens = raw.replaceAll("\\([^)]*\\)", "").trim().toLowerCase().replaceAll("[^a-z0-9]", "");
                if (!withoutParens.isEmpty()) {
                    colMap.put(withoutParens, i);
                }
            }

            int nameIdx = getColumnIndex(colMap, "name", "productname", "itemname", "item", "product");
            int skuIdx = getColumnIndex(colMap, "sku", "skucode", "code", "barcode", "itemcode");
            int descIdx = getColumnIndex(colMap, "description", "desc", "details");
            int purchasePriceIdx = getColumnIndex(colMap, "purchaseprice", "costprice", "buyprice", "cost", "purchase");
            int sellingPriceIdx = getColumnIndex(colMap, "sellingprice", "saleprice", "sellprice", "price", "mrp", "rate");
            int stockIdx = getColumnIndex(colMap, "currentstock", "stock", "qty", "quantity", "stockqty", "openingstock");
            int minStockIdx = getColumnIndex(colMap, "minstocklevel", "minstock", "alertstock", "minlevel");
            int categoryIdx = getColumnIndex(colMap, "category", "categoryname", "cat");

            if (nameIdx == -1) {
                return new CsvImportResponse(0, 0, 0, messages, List.of("Required column 'Product Name' or 'Name' not found in CSV header"));
            }

            String line;
            int rowNum = 1;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) {
                    continue;
                }
                rowNum++;
                totalRows++;

                try {
                    List<String> values = parseCsvLine(line);
                    String name = getValue(values, nameIdx);
                    if (name.isEmpty()) {
                        errors.add("Row " + rowNum + ": Product name is missing. Row skipped.");
                        skippedCount++;
                        continue;
                    }

                    String sku = getValue(values, skuIdx);
                    if (sku.isEmpty()) {
                        sku = generateSku(name);
                    }

                    // Check duplicate SKU
                    if (productRepository.existsBySku(sku)) {
                        skippedCount++;
                        messages.add("Row " + rowNum + ": Product with SKU '" + sku + "' (" + name + ") already exists. Skipped.");
                        continue;
                    }

                    String description = getValue(values, descIdx);

                    BigDecimal purchasePrice = BigDecimal.ZERO;
                    String pPriceStr = getValue(values, purchasePriceIdx);
                    if (!pPriceStr.isEmpty()) {
                        try {
                            purchasePrice = new BigDecimal(pPriceStr.replaceAll("[^0-9.]", ""));
                        } catch (Exception ignored) {}
                    }

                    BigDecimal sellingPrice = BigDecimal.ZERO;
                    String sPriceStr = getValue(values, sellingPriceIdx);
                    if (!sPriceStr.isEmpty()) {
                        try {
                            sellingPrice = new BigDecimal(sPriceStr.replaceAll("[^0-9.]", ""));
                        } catch (Exception ignored) {}
                    }

                    int stock = 0;
                    String stockStr = getValue(values, stockIdx);
                    if (!stockStr.isEmpty()) {
                        try {
                            stock = (int) Math.round(Double.parseDouble(stockStr.replaceAll("[^0-9.]", "")));
                        } catch (Exception ignored) {}
                    }

                    int minStock = 5;
                    String minStockStr = getValue(values, minStockIdx);
                    if (!minStockStr.isEmpty()) {
                        try {
                            minStock = (int) Math.round(Double.parseDouble(minStockStr.replaceAll("[^0-9.]", "")));
                        } catch (Exception ignored) {}
                    }

                    String catName = getValue(values, categoryIdx);
                    Category category = null;
                    if (!catName.isEmpty()) {
                        final String cleanCatName = catName;
                        category = categoryRepository.findByNameIgnoreCase(cleanCatName)
                                .orElseGet(() -> {
                                    Category c = new Category();
                                    c.setName(cleanCatName);
                                    return categoryRepository.save(c);
                                });
                    }

                    Product product = new Product();
                    product.setName(name);
                    product.setSku(sku);
                    product.setDescription(description);
                    product.setPurchasePrice(purchasePrice);
                    product.setSellingPrice(sellingPrice);
                    product.setCurrentStock(stock);
                    product.setMinStockLevel(minStock);
                    product.setStatus("ACTIVE");
                    product.setCategory(category);

                    Product saved = productRepository.save(product);

                    if (stock > 0) {
                        StockTransaction tx = new StockTransaction();
                        tx.setProduct(saved);
                        tx.setType("IN");
                        tx.setQuantity(stock);
                        tx.setReference("CSV_IMPORT");
                        stockTransactionRepository.save(tx);
                    }

                    importedCount++;
                } catch (Exception ex) {
                    errors.add("Row " + rowNum + ": " + ex.getMessage());
                    skippedCount++;
                }
            }
        } catch (Exception e) {
            errors.add("Failed to process CSV file: " + e.getMessage());
        }

        return new CsvImportResponse(totalRows, importedCount, skippedCount, messages, errors);
    }

    private int getColumnIndex(Map<String, Integer> colMap, String... aliases) {
        // 1. Direct exact match
        for (String alias : aliases) {
            Integer idx = colMap.get(alias.toLowerCase());
            if (idx != null) return idx;
        }
        // 2. Prefix or contains match (e.g. "productnameegpen" starts with "productname")
        for (String alias : aliases) {
            String cleanAlias = alias.toLowerCase().replaceAll("[^a-z0-9]", "");
            for (Map.Entry<String, Integer> entry : colMap.entrySet()) {
                if (entry.getKey().startsWith(cleanAlias) || entry.getKey().contains(cleanAlias)) {
                    return entry.getValue();
                }
            }
        }
        return -1;
    }

    private String getValue(List<String> values, int idx) {
        if (idx >= 0 && idx < values.size()) {
            return values.get(idx) != null ? values.get(idx).trim() : "";
        }
        return "";
    }

    private String generateSku(String name) {
        String base = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (base.length() > 6) {
            base = base.substring(0, 6);
        }
        if (base.isEmpty()) {
            base = "ITEM";
        }
        String candidate = base + "-" + (int) (1000 + Math.random() * 9000);
        int attempts = 0;
        while (productRepository.existsBySku(candidate) && attempts < 10) {
            candidate = base + "-" + (int) (1000 + Math.random() * 9000);
            attempts++;
        }
        return candidate;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        for (int i = 0; i < values.size(); i++) {
            String v = values.get(i);
            if (v.startsWith("\"") && v.endsWith("\"") && v.length() >= 2) {
                v = v.substring(1, v.length() - 1).replace("\"\"", "\"").trim();
                values.set(i, v);
            }
        }
        return values;
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
