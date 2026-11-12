package com.xeroxshop.service;

import com.xeroxshop.model.Category;
import com.xeroxshop.repository.CategoryRepository;
import com.xeroxshop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category createCategory(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Category name cannot be empty");
        }
        Category category = new Category();
        category.setName(name.trim());
        return categoryRepository.save(category);
    }

    public Category updateCategory(Integer id, String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Category name cannot be empty");
        }
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        category.setName(name.trim());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Integer id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        long count = productRepository.countByCategoryId(id);
        if (count > 0) {
            throw new RuntimeException("Cannot delete category '" + category.getName() + "' because it is linked to " + count + " products.");
        }
        categoryRepository.delete(category);
    }
}

