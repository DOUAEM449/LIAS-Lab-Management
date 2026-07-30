package com.lias.labmanagement.notification.repository;

import com.lias.labmanagement.notification.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByDiscussionIdOrderByTimestampAsc(UUID discussionId);
}
