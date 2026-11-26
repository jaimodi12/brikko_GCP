package com.construction.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "contractors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contractor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Integer experienceYears;

    @Column(length = 200)
    private String specialization;

    private Double rating;

    private Long minBudget;   // INR

    private Long maxBudget;   // INR

    @Column(nullable = false, length = 50)
    private String city;

    private Boolean isVerified;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "contractor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ContractorBid> bids;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isVerified == null) isVerified = false;
        if (rating == null) rating = 0.0;
    }
}
