package com.construction.dto;

import com.construction.model.enums.*;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ProjectRequest {

    @NotBlank
    private String projectName;

    @NotNull
    private City city;

    @NotNull
    @Min(100)
    private Double plotAreaSqFt;

    @NotNull
    @Min(1)
    @Max(20)
    private Integer numberOfFloors;

    @NotNull
    @Min(0)
    private Double roofAreaSqFt;

    @NotNull
    private CementType cementType;

    @NotNull
    private Boolean brickWork;

    @NotNull
    private PaintType paintType;

    @NotNull
    private WindowType windowType;

    @NotNull
    @Min(1)
    private Integer numberOfWindows;

    @NotNull
    @Min(1)
    private Integer numberOfRooms;

    // Future extensible options stored as JSON
    private String additionalOptions;
}
