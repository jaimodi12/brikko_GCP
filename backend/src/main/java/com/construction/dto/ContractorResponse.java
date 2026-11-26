package com.construction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractorResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String companyName;
    private String description;
    private Integer experienceYears;
    private String specialization;
    private Double rating;
    private Long minBudget;
    private Long maxBudget;
    private String city;
    private Boolean isVerified;
}
