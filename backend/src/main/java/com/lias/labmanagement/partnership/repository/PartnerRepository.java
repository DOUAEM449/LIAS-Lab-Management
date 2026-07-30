package com.lias.labmanagement.partnership.repository;

import com.lias.labmanagement.partnership.entity.Partner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PartnerRepository extends JpaRepository<Partner, UUID> {

    @Query("""
            select p from Partner p
            where (:search is null or :search = ''
                   or lower(p.name) like lower(concat('%', :search, '%'))
                   or lower(p.country) like lower(concat('%', :search, '%')))
            """)
    Page<Partner> search(@Param("search") String search, Pageable pageable);
}
