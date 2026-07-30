package com.lias.labmanagement.equipment.repository;

import com.lias.labmanagement.equipment.entity.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface EquipmentRepository extends JpaRepository<Equipment, UUID> {

    @Query("""
            select e from Equipment e
            where (:search is null or :search = ''
                   or lower(e.name) like lower(concat('%', :search, '%'))
                   or lower(e.category) like lower(concat('%', :search, '%')))
            """)
    Page<Equipment> search(@Param("search") String search, Pageable pageable);
}
