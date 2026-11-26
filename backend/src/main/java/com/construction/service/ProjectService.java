package com.construction.service;

import com.construction.dto.CostBreakdown;
import com.construction.dto.ProjectRequest;
import com.construction.model.Project;
import com.construction.model.User;
import com.construction.model.enums.City;
import com.construction.repository.ProjectRepository;
import com.construction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional
    public CostBreakdown createAndEstimate(ProjectRequest req, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long cost = calculateCost(req);

        Project project = Project.builder()
                .user(user)
                .projectName(req.getProjectName())
                .city(req.getCity())
                .plotAreaSqFt(req.getPlotAreaSqFt())
                .numberOfFloors(req.getNumberOfFloors())
                .roofAreaSqFt(req.getRoofAreaSqFt())
                .cementType(req.getCementType())
                .brickWork(req.getBrickWork())
                .paintType(req.getPaintType())
                .windowType(req.getWindowType())
                .numberOfWindows(req.getNumberOfWindows())
                .numberOfRooms(req.getNumberOfRooms())
                .additionalOptions(req.getAdditionalOptions())
                .totalEstimatedCost(cost)
                .build();

        project = projectRepository.save(project);
        return buildBreakdown(project, req);
    }

    public List<Project> getUserProjects(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return projectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public CostBreakdown getProjectBreakdown(Long projectId) {
        Project p = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        ProjectRequest req = toRequest(p);
        return buildBreakdown(p, req);
    }

    // ----- Cost Calculation Engine -----
    private long calculateCost(ProjectRequest req) {
        double builtUpArea = req.getPlotAreaSqFt() * req.getNumberOfFloors();

        // Structure cost (cement base rate × built-up area)
        long structureCost = (long) (builtUpArea * req.getCementType().getBaseCostPerSqFt());

        // Brick work: ₹300 per sq ft if selected
        long brickCost = req.getBrickWork() ? (long) (builtUpArea * 300) : 0;

        // Roof: ₹500 per sq ft for roof area finishing
        long roofCost = (long) (req.getRoofAreaSqFt() * 500);

        // Paint: paint rate × built-up area
        long paintCost = (long) (builtUpArea * req.getPaintType().getCostPerSqFt());

        // Windows: cost per window × count
        long windowCost = (long) req.getWindowType().getCostPerWindow() * req.getNumberOfWindows();

        long subtotal = structureCost + brickCost + roofCost + paintCost + windowCost;

        // City premium on subtotal
        double multiplier = req.getCity().getCostMultiplier();
        long cityPremium = (long) (subtotal * (multiplier - 1.0));

        return subtotal + cityPremium;
    }

    private CostBreakdown buildBreakdown(Project p, ProjectRequest req) {
        double builtUpArea = req.getPlotAreaSqFt() * req.getNumberOfFloors();
        long structureCost = (long) (builtUpArea * req.getCementType().getBaseCostPerSqFt());
        long brickCost = req.getBrickWork() ? (long) (builtUpArea * 300) : 0;
        long roofCost = (long) (req.getRoofAreaSqFt() * 500);
        long paintCost = (long) (builtUpArea * req.getPaintType().getCostPerSqFt());
        long windowCost = (long) req.getWindowType().getCostPerWindow() * req.getNumberOfWindows();
        long subtotal = structureCost + brickCost + roofCost + paintCost + windowCost;
        long cityPremium = (long) (subtotal * (req.getCity().getCostMultiplier() - 1.0));

        return CostBreakdown.builder()
                .projectId(p.getId())
                .projectName(p.getProjectName())
                .city(req.getCity().getDisplayName())
                .plotAreaSqFt(req.getPlotAreaSqFt())
                .numberOfFloors(req.getNumberOfFloors())
                .roofAreaSqFt(req.getRoofAreaSqFt())
                .cementType(req.getCementType().getDisplayName())
                .brickWork(req.getBrickWork())
                .paintType(req.getPaintType().getDisplayName())
                .windowType(req.getWindowType().getDisplayName())
                .numberOfWindows(req.getNumberOfWindows())
                .numberOfRooms(req.getNumberOfRooms())
                .structureCost(structureCost)
                .brickWorkCost(brickCost)
                .roofCost(roofCost)
                .paintCost(paintCost)
                .windowCost(windowCost)
                .cityPremium(cityPremium)
                .totalCost(subtotal + cityPremium)
                .build();
    }

    private ProjectRequest toRequest(Project p) {
        ProjectRequest req = new ProjectRequest();
        req.setProjectName(p.getProjectName());
        req.setCity(p.getCity());
        req.setPlotAreaSqFt(p.getPlotAreaSqFt());
        req.setNumberOfFloors(p.getNumberOfFloors());
        req.setRoofAreaSqFt(p.getRoofAreaSqFt());
        req.setCementType(p.getCementType());
        req.setBrickWork(p.getBrickWork());
        req.setPaintType(p.getPaintType());
        req.setWindowType(p.getWindowType());
        req.setNumberOfWindows(p.getNumberOfWindows());
        req.setNumberOfRooms(p.getNumberOfRooms());
        return req;
    }
}
