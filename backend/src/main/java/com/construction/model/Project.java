package com.construction.model;

import com.construction.model.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private City city;

    @Column(nullable = false)
    private Double plotAreaSqFt;

    @Column(nullable = false)
    private Integer numberOfFloors;

    @Column(nullable = false)
    private Double roofAreaSqFt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CementType cementType;

    @Column(nullable = false)
    private Boolean brickWork;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaintType paintType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WindowType windowType;

    @Column(nullable = false)
    private Integer numberOfWindows;

    @Column(nullable = false)
    private Integer numberOfRooms;

    @Column(name = "additional_options", columnDefinition = "TEXT")
    private String additionalOptions;  // JSON string for future extensibility

    private Long totalEstimatedCost;   // INR

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ContractorBid> bids;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
