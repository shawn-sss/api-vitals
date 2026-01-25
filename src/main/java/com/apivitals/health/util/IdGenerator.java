package com.apivitals.health.util;

import java.util.Set;

public final class IdGenerator {
    
    private IdGenerator() {
        
    }
    
    
    public static String generateUniqueId(String name, String url, Set<String> existingIds) {
        String base = name != null ? name : url;
        if (base == null) {
            base = "api";
        }
        
        
        base = base.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", ""); 
        
        if (base.isBlank()) {
            base = "api";
        }
        
        
        String candidate = base;
        int counter = 2;
        while (existingIds.contains(candidate)) {
            candidate = base + "-" + counter;
            counter++;
        }
        
        
        existingIds.add(candidate);
        return candidate;
    }
}
