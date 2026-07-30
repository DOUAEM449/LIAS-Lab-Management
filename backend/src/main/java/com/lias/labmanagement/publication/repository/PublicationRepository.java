package com.lias.labmanagement.publication.repository;

import com.lias.labmanagement.publication.entity.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PublicationRepository extends JpaRepository<Publication, UUID> {

    @Query("""
            select p from Publication p
            where (:year is null or p.year = :year)
              and (:teamId is null or p.team.id = :teamId)
              and (:search is null or :search = ''
                   or lower(p.title) like lower(concat('%', :search, '%'))
                   or lower(p.keywords) like lower(concat('%', :search, '%')))
            """)
    Page<Publication> search(@Param("year") Integer year, @Param("teamId") UUID teamId,
                              @Param("search") String search, Pageable pageable);

    long countByYear(int year);
}
