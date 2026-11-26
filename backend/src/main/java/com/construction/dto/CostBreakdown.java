package com.construction.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostBreakdown {
    private Long projectId;
    private String projectName;
    private String city;

    // Input summary
    private Double plotAreaSqFt;
    private Integer numberOfFloors;
    private Double roofAreaSqFt;
    private String cementType;
    private Boolean brickWork;
    private String paintType;
    private String windowType;
    private Integer numberOfWindows;
    private Integer numberOfRooms;

    // Cost breakdown (INR)
    private Long structureCost;
    private Long brickWorkCost;
    private Long roofCost;
    private Long paintCost;
    private Long windowCost;
    private Long cityPremium;
    private Long totalCost;
}
