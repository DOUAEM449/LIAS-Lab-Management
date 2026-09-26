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

    /*
     * The two queries below are native on purpose. @SQLRestriction("deleted = false") adds
     * its filter to every JPQL, derived and by-id query on Member, so no ordinary query can
     * see an archived profile at all.
     */

    /**
     * Whether this account belongs to an archived member profile. Without it, an archived
     * member's account had no visible profile and passed for a technical one — which stays
     * enabled — so archiving a member did not end their access.
     */
    @Query(value = "select count(*) from members m where m.user_id = :userId and m.deleted = true",
            nativeQuery = true)
    long countArchivedProfilesByUserId(@Param("userId") UUID userId);

    /** Loads a member whether archived or not: the only way back from an archive. */
    @Query(value = "select * from members m where m.id = :id", nativeQuery = true)
    Optional<Member> findByIdIncludingArchived(@Param("id") UUID id);

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
