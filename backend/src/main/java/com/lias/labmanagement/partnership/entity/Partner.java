package com.lias.labmanagement.partnership.entity;

import com.lias.labmanagement.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "partners", indexes = {
        @Index(name = "idx_partners_country", columnList = "country")
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public class Partner extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 100)
    private String type;

    @Column(length = 100)
    private String country;

    @Column(name = "contact_info", columnDefinition = "TEXT")
    private String contactInfo;

    @Column(name = "logo_path")
    private String logoPath;
}
