package com.lias.labmanagement.laboratory.repository;

import com.lias.labmanagement.laboratory.entity.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LaboratoryRepository extends JpaRepository<Laboratory, UUID> {
}
