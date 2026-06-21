package com.edi.gmao.repository;

import com.edi.gmao.entity.AttachmentEntityType;
import com.edi.gmao.entity.MediaAttachment;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MediaAttachmentRepository extends JpaRepository<MediaAttachment, Long> {

    @EntityGraph(attributePaths = {"uploadedBy"})
    List<MediaAttachment> findByEntityTypeAndEntityIdOrderByDisplayOrderAscUploadedAtDesc(
            AttachmentEntityType entityType,
            Long entityId
    );

    @Query("""
            select coalesce(max(attachment.displayOrder), -1)
            from MediaAttachment attachment
            where attachment.entityType = :entityType
              and attachment.entityId = :entityId
            """)
    int findMaxDisplayOrder(
            @Param("entityType") AttachmentEntityType entityType,
            @Param("entityId") Long entityId
    );
}
