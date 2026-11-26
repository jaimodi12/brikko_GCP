package com.construction.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    private String phone;

    @NotBlank
    @Size(max = 50)
    private String city;

    @Size(max = 150)
    private String companyName;

    @Size(max = 500)
    private String description;

    @Min(0)
    private Integer experienceYears;

    @Size(max = 200)
    private String specialization;

    private Long minBudget;
    private Long maxBudget;
}
