package com.construction.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ContractorBidRequest {

    @NotNull
    private Long projectId;

    @NotNull
    @Min(10000)
    private Long bidAmount;

    @NotBlank
    @Size(min = 20, max = 1000)
    private String description;

    @NotNull
    @Min(1)
    @Max(3650)
    private Integer estimatedDays;
}
