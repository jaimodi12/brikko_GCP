package com.construction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String city;
    private String companyName;
    private String description;
    private Integer experienceYears;
    private String specialization;
    private Long minBudget;
    private Long maxBudget;
}
