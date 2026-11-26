package com.construction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractorBidResponse {
    private Long id;
    private Long contractorId;
    private String contractorName;
    private String companyName;
    private Double contractorRating;
    private Integer experienceYears;
    private Long bidAmount;
    private String description;
    private Integer estimatedDays;
    private LocalDateTime createdAt;
}
