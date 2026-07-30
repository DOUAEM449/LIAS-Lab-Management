package com.lias.labmanagement.document.repository;

import com.lias.labmanagement.common.enums.DocumentCategory;
import com.lias.labmanagement.document.entity.DocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface DocumentRepository extends JpaRepository<DocumentEntity, UUID> {

    @Query("""
            select d from DocumentEntity d
            where (:category is null or d.category = :category)
              and (:search is null or :search = ''
                   or lower(d.title) like lower(concat('%', :search, '%'))
                   or lower(d.tags) like lower(concat('%', :search, '%')))
            """)
    Page<DocumentEntity> search(@Param("category") DocumentCategory category,
                                 @Param("search") String search, Pageable pageable);
}
