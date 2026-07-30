package com.lias.labmanagement.membershiprequest.repository;

import com.lias.labmanagement.common.enums.RequestStatus;
import com.lias.labmanagement.membershiprequest.entity.MembershipRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface MembershipRequestRepository extends JpaRepository<MembershipRequest, UUID> {
    Page<MembershipRequest> findByStatus(RequestStatus status, Pageable pageable);

    long countByStatus(RequestStatus status);

    long countByStatusAndDecisionDateBetween(RequestStatus status, Instant start, Instant end);
}
