package com.xeroxshop.repository;

import com.xeroxshop.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    List<Expense> findByExpenseDateBetween(LocalDate start, LocalDate end);

    List<Expense> findByCategory(String category);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumExpensesBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}

