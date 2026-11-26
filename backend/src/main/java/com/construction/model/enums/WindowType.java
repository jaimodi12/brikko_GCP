package com.construction.model.enums;

public enum WindowType {
    STANDARD("Standard Wooden Window", 8000),
    ALUMINUM("Aluminum Sliding Window", 12000),
    UPVC("UPVC Window", 15000);

    private final String displayName;
    private final int costPerWindow;  // INR per window unit

    WindowType(String displayName, int costPerWindow) {
        this.displayName = displayName;
        this.costPerWindow = costPerWindow;
    }

    public String getDisplayName() { return displayName; }
    public int getCostPerWindow() { return costPerWindow; }
}
