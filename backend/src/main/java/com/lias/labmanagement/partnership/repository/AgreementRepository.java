package com.lias.labmanagement.partnership.repository;

import com.lias.labmanagement.partnership.entity.Agreement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgreementRepository extends JpaRepository<Agreement, UUID> {
    List<Agreement> findByPartnerId(UUID partnerId);
}
