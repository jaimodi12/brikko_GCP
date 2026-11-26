package com.construction.model.enums;

public enum CementType {
    OPC("OPC - Ordinary Portland Cement", 2000),
    PPC("PPC - Portland Pozzolana Cement", 1800),
    PSC("PSC - Portland Slag Cement", 1600);

    private final String displayName;
    private final int baseCostPerSqFt;  // INR per sq ft

    CementType(String displayName, int baseCostPerSqFt) {
        this.displayName = displayName;
        this.baseCostPerSqFt = baseCostPerSqFt;
    }

    public String getDisplayName() { return displayName; }
    public int getBaseCostPerSqFt() { return baseCostPerSqFt; }
}
