package com.lias.labmanagement.event.repository;

import com.lias.labmanagement.common.enums.EventType;
import com.lias.labmanagement.event.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query("""
            select e from Event e
            where (:type is null or e.type = :type)
              and (:search is null or :search = ''
                   or lower(e.title) like lower(concat('%', :search, '%')))
            order by e.startDate desc
            """)
    Page<Event> search(@Param("type") EventType type, @Param("search") String search, Pageable pageable);

    List<Event> findByStartDateBetweenOrEndDateBetween(LocalDateTime start1, LocalDateTime end1,
                                                        LocalDateTime start2, LocalDateTime end2);

    List<Event> findByTitleIgnoreCaseOrderByEditionNumberDesc(String title);
}
