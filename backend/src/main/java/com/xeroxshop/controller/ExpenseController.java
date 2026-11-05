package com.xeroxshop.controller;

import com.xeroxshop.dto.ExpenseRequest;
import com.xeroxshop.model.Expense;
import com.xeroxshop.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(expenseService.getExpensesBetween(startDate, endDate));
        }
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(@RequestBody ExpenseRequest req) {
        return ResponseEntity.ok(expenseService.createExpense(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Integer id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}

