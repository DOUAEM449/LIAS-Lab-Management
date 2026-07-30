package com.lias.labmanagement.publication.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import com.lias.labmanagement.governance.entity.Team;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "publications", indexes = {
        @Index(name = "idx_publications_year", columnList = "year"),
        @Index(name = "idx_publications_team", columnList = "team_id"),
        @Index(name = "idx_publications_doi", columnList = "doi")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Publication extends BaseEntity {

    @Column(nullable = false, length = 500)
    private String title;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    private String abstractText;

    @Column(length = 500)
    private String keywords;

    @Column(nullable = false)
    private int year;

    @Column(length = 190)
    private String doi;

    @Column(name = "pdf_path")
    private String pdfPath;

    @Column(name = "pdf_original_name")
    private String pdfOriginalName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
}
