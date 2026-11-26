package com.construction.controller;

import com.construction.model.enums.CementType;
import com.construction.model.enums.City;
import com.construction.model.enums.PaintType;
import com.construction.model.enums.WindowType;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/options")
public class OptionsController {

    @GetMapping("/cities")
    public ResponseEntity<List<EnumOption>> getCities() {
        return ResponseEntity.ok(Arrays.stream(City.values())
                .map(c -> new EnumOption(c.name(), c.getDisplayName()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/cement-types")
    public ResponseEntity<List<EnumOption>> getCementTypes() {
        return ResponseEntity.ok(Arrays.stream(CementType.values())
                .map(c -> new EnumOption(c.name(), c.getDisplayName()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/paint-types")
    public ResponseEntity<List<EnumOption>> getPaintTypes() {
        return ResponseEntity.ok(Arrays.stream(PaintType.values())
                .map(p -> new EnumOption(p.name(), p.getDisplayName()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/window-types")
    public ResponseEntity<List<EnumOption>> getWindowTypes() {
        return ResponseEntity.ok(Arrays.stream(WindowType.values())
                .map(w -> new EnumOption(w.name(), w.getDisplayName()))
                .collect(Collectors.toList()));
    }

    @Data
    @AllArgsConstructor
    static class EnumOption {
        private String value;
        private String label;
    }
}
