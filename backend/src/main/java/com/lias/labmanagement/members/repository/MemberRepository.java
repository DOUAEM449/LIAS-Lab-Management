package com.lias.labmanagement.members.repository;

import com.lias.labmanagement.common.enums.MemberStatus;
import com.lias.labmanagement.members.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {

    Optional<Member> findByUserId(UUID userId);

    Optional<Member> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
            select m from Member m
            where (:status is null or m.currentStatus = :status)
              and (:teamId is null or m.currentTeam.id = :teamId)
              and (:search is null or :search = ''
                   or lower(m.firstName) like lower(concat('%', :search, '%'))
                   or lower(m.lastName) like lower(concat('%', :search, '%'))
                   or lower(m.email) like lower(concat('%', :search, '%')))
            """)
    Page<Member> search(@Param("status") MemberStatus status,
                         @Param("teamId") UUID teamId,
                         @Param("search") String search,
                         Pageable pageable);

    Page<Member> findByCurrentStatusNot(MemberStatus status, Pageable pageable);

    /**
     * Ids of every member whose account is still active — excludes RETIRED (frozen)
     * and FORMER (deactivated) members (CdC §2.8). Used as the broadcast audience
     * for laboratory-wide notifications.
     */
    @Query("""
            select m.id from Member m
            where m.currentStatus not in (
                com.lias.labmanagement.common.enums.MemberStatus.RETIRED,
                com.lias.labmanagement.common.enums.MemberStatus.FORMER)
            """)
    List<UUID> findActiveMemberIds();
}
