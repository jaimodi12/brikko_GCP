package com.construction.repository;

import com.construction.model.Contractor;
import com.construction.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContractorRepository extends JpaRepository<Contractor, Long> {
    Optional<Contractor> findByUser(User user);
    List<Contractor> findByCityIgnoreCase(String city);
    List<Contractor> findByCityIgnoreCaseAndMinBudgetLessThanEqualAndMaxBudgetGreaterThanEqual(
            String city, Long minBudget, Long maxBudget);
}
