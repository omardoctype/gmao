package com.edi.gmao.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "media_attachments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_media_attachments_stored_file_name", columnNames = "stored_file_name")
        },
        indexes = {
                @Index(name = "idx_media_attachments_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_media_attachments_uploaded_by", columnList = "uploaded_by_id"),
                @Index(name = "idx_media_attachments_uploaded_at", columnList = "uploaded_at")
        }
)
public class MediaAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 255)
    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @NotBlank
    @Size(max = 255)
    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName;

    @Size(max = 500)
    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @NotBlank
    @Size(max = 150)
    @Column(name = "mime_type", nullable = false, length = 150)
    private String mimeType;

    @NotNull
    @PositiveOrZero
    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @NotNull
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "uploaded_by_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_media_attachments_uploaded_by")
    )
    private User uploadedBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 40)
    private AttachmentEntityType entityType;

    @NotNull
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private AttachmentCategory category;

    @Size(max = 1000)
    @Column(length = 1000)
    private String description;

    @NotNull
    @PositiveOrZero
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @NotBlank
    @Size(max = 500)
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = Instant.now();
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }
}
