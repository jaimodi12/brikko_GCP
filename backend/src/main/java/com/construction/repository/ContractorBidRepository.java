package com.construction.repository;

import com.construction.model.ContractorBid;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractorBidRepository extends JpaRepository<ContractorBid, Long> {
    List<ContractorBid> findByProjectIdOrderByBidAmountAsc(Long projectId);
    List<ContractorBid> findByContractorIdOrderByCreatedAtDesc(Long contractorId);
}
