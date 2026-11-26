package com.construction.service;

import com.construction.dto.*;
import com.construction.model.Contractor;
import com.construction.model.User;
import com.construction.model.enums.UserRole;
import com.construction.repository.ContractorRepository;
import com.construction.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ContractorRepository contractorRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Mobile number already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .city(request.getCity())
                .build();

        user = userRepository.save(user);

        if (request.getRole() == UserRole.CONTRACTOR) {
            Contractor contractor = Contractor.builder()
                    .user(user)
                    .companyName(request.getCompanyName())
                    .description(request.getDescription())
                    .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0)
                    .specialization(request.getSpecialization())
                    .minBudget(request.getMinBudget())
                    .maxBudget(request.getMaxBudget())
                    .city(request.getCity())
                    .build();
            contractorRepository.save(contractor);
        }

        return AuthResponse.builder()
                .token("demo-token-" + user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return AuthResponse.builder()
                .token("demo-token-" + user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Contractor contractor = null;
        if (user.getRole() == UserRole.CONTRACTOR) {
            contractor = contractorRepository.findByUser(user).orElse(null);
        }

        return buildProfileResponse(user, contractor);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Prevent updating to a phone number already registered to a different user
        String newPhone = request.getPhone();
        String currentPhone = user.getPhone();
        if (newPhone != null && !newPhone.equals(currentPhone) && userRepository.existsByPhone(newPhone)) {
            throw new IllegalArgumentException("Mobile number already registered");
        }

        user.setName(request.getName());
        user.setPhone(newPhone);
        user.setCity(request.getCity());
        user = userRepository.save(user);

        Contractor contractor = null;
        if (user.getRole() == UserRole.CONTRACTOR) {
            contractor = contractorRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Contractor profile not found"));

            contractor.setCompanyName(request.getCompanyName());
            contractor.setDescription(request.getDescription());
            if (request.getExperienceYears() != null) {
                contractor.setExperienceYears(request.getExperienceYears());
            }
            contractor.setSpecialization(request.getSpecialization());
            contractor.setMinBudget(request.getMinBudget());
            contractor.setMaxBudget(request.getMaxBudget());
            contractor.setCity(request.getCity());
            contractorRepository.save(contractor);
        }

        return buildProfileResponse(user, contractor);
    }

    private UserProfileResponse buildProfileResponse(User user, Contractor contractor) {
        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .city(user.getCity());

        if (contractor != null) {
            builder.companyName(contractor.getCompanyName())
                    .description(contractor.getDescription())
                    .experienceYears(contractor.getExperienceYears())
                    .specialization(contractor.getSpecialization())
                    .minBudget(contractor.getMinBudget())
                    .maxBudget(contractor.getMaxBudget());
        }

        return builder.build();
    }
}
