package com.construction.dto;

import com.construction.model.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    @NotBlank
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    private String phone;

    @NotNull
    private UserRole role;

    private String city;

    // Contractor-specific fields (only needed when role = CONTRACTOR)
    private String companyName;
    private String description;
    private Integer experienceYears;
    private String specialization;
    private Long minBudget;
    private Long maxBudget;
}
