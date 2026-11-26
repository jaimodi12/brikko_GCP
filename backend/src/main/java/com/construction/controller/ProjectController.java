package com.construction.controller;

import com.construction.dto.CostBreakdown;
import com.construction.dto.ProjectRequest;
import com.construction.model.Project;
import com.construction.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/estimate")
    public ResponseEntity<CostBreakdown> createAndEstimate(
            @Valid @RequestBody ProjectRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(projectService.createAndEstimate(request, userEmail));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Project>> getMyProjects(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(projectService.getUserProjects(userEmail));
    }

    @GetMapping("/{id}/breakdown")
    public ResponseEntity<CostBreakdown> getBreakdown(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectBreakdown(id));
    }
}
