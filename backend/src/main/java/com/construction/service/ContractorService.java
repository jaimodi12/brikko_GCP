package com.construction.service;

import com.construction.dto.ContractorBidRequest;
import com.construction.dto.ContractorBidResponse;
import com.construction.dto.ContractorResponse;
import com.construction.model.Contractor;
import com.construction.model.ContractorBid;
import com.construction.model.Project;
import com.construction.model.User;
import com.construction.model.enums.UserRole;
import com.construction.repository.ContractorBidRepository;
import com.construction.repository.ContractorRepository;
import com.construction.repository.ProjectRepository;
import com.construction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractorService {

    private final ContractorRepository contractorRepository;
    private final ContractorBidRepository contractorBidRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<ContractorResponse> getContractorsByCity(String city) {
        return contractorRepository.findByCityIgnoreCase(city)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ContractorResponse> getContractorsByCityAndBudget(String city, Long budget) {
        return contractorRepository
                .findByCityIgnoreCaseAndMinBudgetLessThanEqualAndMaxBudgetGreaterThanEqual(city, budget, budget)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContractorBidResponse submitBid(ContractorBidRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() != UserRole.CONTRACTOR) {
            throw new IllegalStateException("Only contractors can submit bids");
        }

        Contractor contractor = contractorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Contractor profile not found"));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        ContractorBid bid = ContractorBid.builder()
                .contractor(contractor)
                .project(project)
                .bidAmount(request.getBidAmount())
                .description(request.getDescription())
                .estimatedDays(request.getEstimatedDays())
                .build();

        bid = contractorBidRepository.save(bid);
        return toBidResponse(bid);
    }

    public List<ContractorBidResponse> getBidsForProject(Long projectId) {
        return contractorBidRepository.findByProjectIdOrderByBidAmountAsc(projectId)
                .stream()
                .map(this::toBidResponse)
                .collect(Collectors.toList());
    }

    public List<ContractorBidResponse> getMyBids(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contractor contractor = contractorRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("Contractor profile not found"));
        return contractorBidRepository.findByContractorIdOrderByCreatedAtDesc(contractor.getId())
                .stream()
                .map(this::toBidResponse)
                .collect(Collectors.toList());
    }

    private ContractorResponse toResponse(Contractor c) {
        return ContractorResponse.builder()
                .id(c.getId())
                .name(c.getUser().getName())
                .email(c.getUser().getEmail())
                .phone(c.getUser().getPhone())
                .companyName(c.getCompanyName())
                .description(c.getDescription())
                .experienceYears(c.getExperienceYears())
                .specialization(c.getSpecialization())
                .rating(c.getRating())
                .minBudget(c.getMinBudget())
                .maxBudget(c.getMaxBudget())
                .city(c.getCity())
                .isVerified(c.getIsVerified())
                .build();
    }

    private ContractorBidResponse toBidResponse(ContractorBid bid) {
        return ContractorBidResponse.builder()
                .id(bid.getId())
                .contractorId(bid.getContractor().getId())
                .contractorName(bid.getContractor().getUser().getName())
                .companyName(bid.getContractor().getCompanyName())
                .contractorRating(bid.getContractor().getRating())
                .experienceYears(bid.getContractor().getExperienceYears())
                .bidAmount(bid.getBidAmount())
                .description(bid.getDescription())
                .estimatedDays(bid.getEstimatedDays())
                .createdAt(bid.getCreatedAt())
                .build();
    }
}
