package com.construction.model.enums;

public enum City {
    PUNE("Pune", 1.0),
    MUMBAI("Mumbai", 1.15);  // Mumbai has 15% cost premium

    private final String displayName;
    private final double costMultiplier;

    City(String displayName, double costMultiplier) {
        this.displayName = displayName;
        this.costMultiplier = costMultiplier;
    }

    public String getDisplayName() { return displayName; }
    public double getCostMultiplier() { return costMultiplier; }
}
