package com.construction.controller;

import com.construction.dto.ContractorBidRequest;
import com.construction.dto.ContractorBidResponse;
import com.construction.dto.ContractorResponse;
import com.construction.service.ContractorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contractors")
@RequiredArgsConstructor
public class ContractorController {

    private final ContractorService contractorService;

    @GetMapping("/list")
    public ResponseEntity<List<ContractorResponse>> listByCity(@RequestParam String city) {
        return ResponseEntity.ok(contractorService.getContractorsByCity(city));
    }

    @GetMapping("/match")
    public ResponseEntity<List<ContractorResponse>> matchByBudget(
            @RequestParam String city,
            @RequestParam Long budget) {
        return ResponseEntity.ok(contractorService.getContractorsByCityAndBudget(city, budget));
    }

    @PostMapping("/bid")
    public ResponseEntity<ContractorBidResponse> submitBid(
            @Valid @RequestBody ContractorBidRequest request,
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(contractorService.submitBid(request, userEmail));
    }

    @GetMapping("/bids/project/{projectId}")
    public ResponseEntity<List<ContractorBidResponse>> getBidsForProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(contractorService.getBidsForProject(projectId));
    }

    @GetMapping("/bids/my")
    public ResponseEntity<List<ContractorBidResponse>> getMyBids(
            @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(contractorService.getMyBids(userEmail));
    }
}
