package com.construction.controller;

import com.construction.dto.UserProfileResponse;
import com.construction.dto.UserProfileUpdateRequest;
import com.construction.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(@RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(authService.getProfile(email));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateProfile(email, request));
    }
}
