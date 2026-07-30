package com.lias.labmanagement.members.repository;

import com.lias.labmanagement.members.entity.MemberStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MemberStatusHistoryRepository extends JpaRepository<MemberStatusHistory, UUID> {
    List<MemberStatusHistory> findByMemberIdOrderByStartDateDesc(UUID memberId);
}
