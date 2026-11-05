package com.xeroxshop.service;

import com.xeroxshop.dto.ExpenseRequest;
import com.xeroxshop.model.Expense;
import com.xeroxshop.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public List<Expense> getExpensesBetween(LocalDate start, LocalDate end) {
        return expenseRepository.findByExpenseDateBetween(start, end);
    }

    public Expense createExpense(ExpenseRequest req) {
        Expense expense = new Expense();
        expense.setCategory(req.category());
        expense.setAmount(req.amount());
        expense.setExpenseDate(req.expenseDate() != null ? req.expenseDate() : LocalDate.now());
        expense.setDescription(req.description());
        expense.setPaymentMethod(req.paymentMethod() != null ? req.paymentMethod() : "CASH");
        return expenseRepository.save(expense);
    }

    public void deleteExpense(Integer id) {
        expenseRepository.deleteById(id);
    }
}

