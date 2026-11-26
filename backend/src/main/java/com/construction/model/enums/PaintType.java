package com.construction.model.enums;

public enum PaintType {
    BASIC("Basic Paint", 50),
    PREMIUM("Premium Paint", 100),
    LUXURY("Luxury / Texture Paint", 200);

    private final String displayName;
    private final int costPerSqFt;  // INR per sq ft

    PaintType(String displayName, int costPerSqFt) {
        this.displayName = displayName;
        this.costPerSqFt = costPerSqFt;
    }

    public String getDisplayName() { return displayName; }
    public int getCostPerSqFt() { return costPerSqFt; }
}
