package com.lias.labmanagement.publication.repository;

import com.lias.labmanagement.publication.entity.PublicationAuthor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PublicationAuthorRepository extends JpaRepository<PublicationAuthor, UUID> {
    List<PublicationAuthor> findByPublicationId(UUID publicationId);

    List<PublicationAuthor> findByMemberId(UUID memberId);

    void deleteByPublicationId(UUID publicationId);
}
