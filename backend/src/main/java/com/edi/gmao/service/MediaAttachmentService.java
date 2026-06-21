package com.edi.gmao.service;

import com.edi.gmao.config.DocumentStorageProperties;
import com.edi.gmao.dto.attachment.AttachmentContentPayload;
import com.edi.gmao.dto.attachment.AttachmentResponse;
import com.edi.gmao.dto.attachment.AttachmentUpdateRequest;
import com.edi.gmao.dto.attachment.AttachmentUploadRequest;
import com.edi.gmao.entity.AttachmentCategory;
import com.edi.gmao.entity.AttachmentEntityType;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.MediaAttachment;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.AttachmentNotFoundException;
import com.edi.gmao.exception.BreakdownNotFoundException;
import com.edi.gmao.exception.DocumentStorageException;
import com.edi.gmao.exception.EquipmentNotFoundException;
import com.edi.gmao.exception.InvalidDocumentUploadException;
import com.edi.gmao.exception.WorkOrderNotFoundException;
import com.edi.gmao.mapper.MediaAttachmentMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.MediaAttachmentRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaAttachmentService {

    private static final int MAX_FILES_PER_UPLOAD = 5;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Map<AttachmentCategory, Set<AttachmentEntityType>> CATEGORY_ENTITY_TYPES = Map.of(
            AttachmentCategory.GENERAL, Set.of(AttachmentEntityType.values()),
            AttachmentCategory.EQUIPMENT_PHOTO, Set.of(AttachmentEntityType.EQUIPMENT),
            AttachmentCategory.NAMEPLATE, Set.of(AttachmentEntityType.EQUIPMENT),
            AttachmentCategory.BREAKDOWN_PHOTO, Set.of(AttachmentEntityType.BREAKDOWN),
            AttachmentCategory.BEFORE_INTERVENTION, Set.of(AttachmentEntityType.WORK_ORDER),
            AttachmentCategory.AFTER_INTERVENTION, Set.of(AttachmentEntityType.WORK_ORDER),
            AttachmentCategory.FINAL_REPORT_PHOTO, Set.of(AttachmentEntityType.INTERVENTION_REPORT)
    );

    private final MediaAttachmentRepository mediaAttachmentRepository;
    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final WorkOrderRepository workOrderRepository;
    private final InterventionReportRepository interventionReportRepository;
    private final UserRepository userRepository;
    private final MediaAttachmentMapper mediaAttachmentMapper;
    private final DocumentStorageProperties documentStorageProperties;
    private final AuditLogService auditLogService;
    private final Path storageRoot;

    public MediaAttachmentService(
            MediaAttachmentRepository mediaAttachmentRepository,
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            WorkOrderRepository workOrderRepository,
            InterventionReportRepository interventionReportRepository,
            UserRepository userRepository,
            MediaAttachmentMapper mediaAttachmentMapper,
            DocumentStorageProperties documentStorageProperties,
            AuditLogService auditLogService
    ) {
        this.mediaAttachmentRepository = mediaAttachmentRepository;
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.workOrderRepository = workOrderRepository;
        this.interventionReportRepository = interventionReportRepository;
        this.userRepository = userRepository;
        this.mediaAttachmentMapper = mediaAttachmentMapper;
        this.documentStorageProperties = documentStorageProperties;
        this.auditLogService = auditLogService;
        this.storageRoot = Paths.get(documentStorageProperties.getStorageDir())
                .resolve("media-attachments")
                .toAbsolutePath()
                .normalize();
        initializeStorageRoot();
    }

    @Transactional
    public List<AttachmentResponse> upload(AttachmentUploadRequest request, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(request.getEntityType(), request.getEntityId());
        validateCategory(request.getEntityType(), request.getCategory());
        validateUploadAuthorization(parentContext, currentUser, authentication);
        validateFiles(request.getFiles());

        int nextDisplayOrder = request.getDisplayOrder() == null
                ? mediaAttachmentRepository.findMaxDisplayOrder(request.getEntityType(), request.getEntityId()) + 1
                : request.getDisplayOrder();

        List<AttachmentResponse> responses = new ArrayList<>();
        int index = 0;
        for (MultipartFile file : request.getFiles()) {
            StoredImage storedImage = storeImage(file, request.getEntityType(), request.getEntityId());

            MediaAttachment attachment = new MediaAttachment();
            attachment.setOriginalFileName(storedImage.originalFileName());
            attachment.setStoredFileName(storedImage.storedFileName());
            attachment.setMimeType(storedImage.mimeType());
            attachment.setFileSizeBytes(storedImage.fileSizeBytes());
            attachment.setUploadedBy(currentUser);
            attachment.setEntityType(request.getEntityType());
            attachment.setEntityId(request.getEntityId());
            attachment.setCategory(request.getCategory());
            attachment.setDescription(normalizeOptionalText(request.getDescription()));
            attachment.setDisplayOrder(nextDisplayOrder + index);
            attachment.setStoragePath(storedImage.storagePath());

            MediaAttachment saved = mediaAttachmentRepository.save(attachment);
            saved.setFileUrl("/api/attachments/" + saved.getId() + "/content");
            MediaAttachment updated = mediaAttachmentRepository.save(saved);
            auditLogService.record(
                    "MEDIA_ATTACHMENT_ADDED",
                    "MEDIA_ATTACHMENT",
                    updated.getId(),
                    buildAddedAuditMessage(updated, parentContext)
            );
            responses.add(mediaAttachmentMapper.toResponse(updated));
            index++;
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> list(
            AttachmentEntityType entityType,
            Long entityId,
            Authentication authentication
    ) {
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(entityType, entityId);
        validateViewAuthorization(parentContext, currentUser, authentication);
        return mediaAttachmentRepository.findByEntityTypeAndEntityIdOrderByDisplayOrderAscUploadedAtDesc(entityType, entityId)
                .stream()
                .map(mediaAttachmentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttachmentResponse getMetadata(Long attachmentId, Authentication authentication) {
        MediaAttachment attachment = getAttachmentOrThrow(attachmentId);
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(attachment.getEntityType(), attachment.getEntityId());
        validateViewAuthorization(parentContext, currentUser, authentication);
        return mediaAttachmentMapper.toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public AttachmentContentPayload getContent(Long attachmentId, Authentication authentication) {
        MediaAttachment attachment = getAttachmentOrThrow(attachmentId);
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(attachment.getEntityType(), attachment.getEntityId());
        validateViewAuthorization(parentContext, currentUser, authentication);

        Path filePath = resolveStoredFilePath(attachment.getStoragePath());
        ensurePathInsideStorage(filePath);
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new DocumentStorageException("Le fichier image stocke est introuvable ou illisible.");
        }

        try {
            return new AttachmentContentPayload(
                    Files.readAllBytes(filePath),
                    attachment.getMimeType(),
                    attachment.getOriginalFileName(),
                    attachment.getFileSizeBytes()
            );
        } catch (IOException ex) {
            throw new DocumentStorageException("Impossible de lire le fichier image stocke.");
        }
    }

    @Transactional
    public AttachmentResponse update(
            Long attachmentId,
            AttachmentUpdateRequest request,
            Authentication authentication
    ) {
        MediaAttachment attachment = getAttachmentOrThrow(attachmentId);
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(attachment.getEntityType(), attachment.getEntityId());
        validateDeleteOrUpdateAuthorization(attachment, parentContext, currentUser, authentication);

        AttachmentCategory previousCategory = attachment.getCategory();
        String previousDescription = attachment.getDescription();
        if (request.getCategory() != null) {
            validateCategory(attachment.getEntityType(), request.getCategory());
            attachment.setCategory(request.getCategory());
        }
        attachment.setDescription(normalizeOptionalText(request.getDescription()));
        if (request.getDisplayOrder() != null) {
            attachment.setDisplayOrder(request.getDisplayOrder());
        }

        MediaAttachment updated = mediaAttachmentRepository.save(attachment);
        if (!Objects.equals(previousCategory, updated.getCategory())) {
            auditLogService.record(
                    "MEDIA_ATTACHMENT_CATEGORY_CHANGED",
                    "MEDIA_ATTACHMENT",
                    updated.getId(),
                    "Categorie de la piece jointe modifiee : " + updated.getCategory() + "."
            );
        }
        if (!Objects.equals(previousDescription, updated.getDescription())) {
            auditLogService.record(
                    "MEDIA_ATTACHMENT_DESCRIPTION_CHANGED",
                    "MEDIA_ATTACHMENT",
                    updated.getId(),
                    "Description de la piece jointe modifiee."
            );
        }
        return mediaAttachmentMapper.toResponse(updated);
    }

    @Transactional
    public void delete(Long attachmentId, Authentication authentication) {
        MediaAttachment attachment = getAttachmentOrThrow(attachmentId);
        User currentUser = getCurrentUser(authentication);
        ParentContext parentContext = resolveParentContext(attachment.getEntityType(), attachment.getEntityId());
        validateDeleteOrUpdateAuthorization(attachment, parentContext, currentUser, authentication);

        Path filePath = resolveStoredFilePath(attachment.getStoragePath());
        ensurePathInsideStorage(filePath);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new DocumentStorageException("Impossible de supprimer le fichier image stocke.");
        }

        mediaAttachmentRepository.delete(attachment);
        auditLogService.record(
                "MEDIA_ATTACHMENT_DELETED",
                "MEDIA_ATTACHMENT",
                attachmentId,
                buildDeletedAuditMessage(attachment, parentContext)
        );
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new InvalidDocumentUploadException("Au moins une image est requise.");
        }
        if (files.size() > MAX_FILES_PER_UPLOAD) {
            throw new InvalidDocumentUploadException("Vous pouvez ajouter au maximum 5 images par envoi.");
        }
    }

    private StoredImage storeImage(MultipartFile file, AttachmentEntityType entityType, Long entityId) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDocumentUploadException("Au moins une image est requise.");
        }
        if (file.getSize() > documentStorageProperties.getMaxFileSizeBytes()) {
            throw new InvalidDocumentUploadException("Le fichier depasse la taille maximale autorisee de 10 Mo.");
        }

        String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
        String extension = extractExtension(originalFileName);
        String declaredMimeType = normalizeMimeType(file.getContentType());
        validateDeclaredType(declaredMimeType, extension);

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new DocumentStorageException("Impossible de lire l'image envoyee.");
        }

        String detectedMimeType = detectImageMimeType(content);
        if (!mimeTypesMatch(declaredMimeType, detectedMimeType, extension)) {
            throw new InvalidDocumentUploadException("Le contenu du fichier ne correspond pas a une image JPG, PNG ou WEBP valide.");
        }

        String storedFileName = buildStoredFileName(extension);
        Path targetDirectory = resolveAttachmentDirectory(entityType, entityId);
        Path targetFile = targetDirectory.resolve(storedFileName).normalize();
        ensurePathInsideStorage(targetFile);

        try {
            Files.write(targetFile, content);
        } catch (IOException ex) {
            throw new DocumentStorageException("Impossible de stocker l'image.");
        }

        return new StoredImage(
                originalFileName,
                storedFileName,
                detectedMimeType,
                (long) content.length,
                storageRoot.relativize(targetFile).toString().replace("\\", "/")
        );
    }

    private void validateDeclaredType(String mimeType, String extension) {
        if (!ALLOWED_MIME_TYPES.contains(mimeType) || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidDocumentUploadException("Seuls les formats JPG, PNG et WEBP sont acceptes.");
        }
    }

    private String detectImageMimeType(byte[] content) {
        if (content == null || content.length < 4) {
            throw new InvalidDocumentUploadException("Le fichier image est invalide.");
        }
        if ((content[0] & 0xFF) == 0xFF && (content[1] & 0xFF) == 0xD8 && (content[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (content.length >= 8) {
            String pngSignature = HexFormat.of().formatHex(content, 0, 8);
            if ("89504e470d0a1a0a".equals(pngSignature)) {
                return "image/png";
            }
        }
        if (content.length >= 12
                && content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P') {
            return "image/webp";
        }
        throw new InvalidDocumentUploadException("Seuls les formats JPG, PNG et WEBP sont acceptes.");
    }

    private boolean mimeTypesMatch(String declaredMimeType, String detectedMimeType, String extension) {
        if (("image/jpeg".equals(declaredMimeType) || "image/jpg".equals(declaredMimeType))
                && "image/jpeg".equals(detectedMimeType)
                && ("jpg".equals(extension) || "jpeg".equals(extension))) {
            return true;
        }
        return declaredMimeType.equals(detectedMimeType);
    }

    private void validateCategory(AttachmentEntityType entityType, AttachmentCategory category) {
        Set<AttachmentEntityType> allowedEntityTypes = CATEGORY_ENTITY_TYPES.get(category);
        if (allowedEntityTypes == null || !allowedEntityTypes.contains(entityType)) {
            throw new InvalidDocumentUploadException("La categorie selectionnee n'est pas compatible avec cette entite.");
        }
    }

    private ParentContext resolveParentContext(AttachmentEntityType entityType, Long entityId) {
        return switch (entityType) {
            case EQUIPMENT -> {
                Equipment equipment = equipmentRepository.findById(entityId)
                        .orElseThrow(() -> new EquipmentNotFoundException(entityId));
                yield new ParentContext(entityType, entityId, equipment.getCode(), null, null);
            }
            case BREAKDOWN -> {
                Breakdown breakdown = breakdownRepository.findById(entityId)
                        .orElseThrow(() -> new BreakdownNotFoundException(entityId));
                yield new ParentContext(entityType, entityId, breakdown.getReference(), null, null);
            }
            case WORK_ORDER -> {
                WorkOrder workOrder = workOrderRepository.findById(entityId)
                        .orElseThrow(() -> new WorkOrderNotFoundException(entityId));
                Long assignedTechnicianId = workOrder.getAssignedTechnician() == null
                        ? null
                        : workOrder.getAssignedTechnician().getId();
                yield new ParentContext(entityType, entityId, workOrder.getReference(), assignedTechnicianId, null);
            }
            case INTERVENTION_REPORT -> {
                InterventionReport report = interventionReportRepository.findById(entityId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Rapport d'intervention introuvable: " + entityId));
                Long technicianId = report.getTechnician() == null ? null : report.getTechnician().getId();
                Long assignedTechnicianId = report.getWorkOrder() == null || report.getWorkOrder().getAssignedTechnician() == null
                        ? null
                        : report.getWorkOrder().getAssignedTechnician().getId();
                yield new ParentContext(entityType, entityId, report.getWorkOrder().getReference(), assignedTechnicianId, technicianId);
            }
        };
    }

    private void validateViewAuthorization(ParentContext parentContext, User currentUser, Authentication authentication) {
        if (hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_RESPONSABLE_MAINTENANCE")) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.EQUIPMENT && isAuthenticated(authentication)) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.WORK_ORDER
                && hasRole(authentication, "ROLE_TECHNICIAN")
                && Objects.equals(parentContext.assignedTechnicianId(), currentUser.getId())) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.INTERVENTION_REPORT
                && hasRole(authentication, "ROLE_TECHNICIAN")
                && (Objects.equals(parentContext.technicianId(), currentUser.getId())
                || Objects.equals(parentContext.assignedTechnicianId(), currentUser.getId()))) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Vous n'etes pas autorise a consulter cette piece jointe.");
    }

    private void validateUploadAuthorization(ParentContext parentContext, User currentUser, Authentication authentication) {
        if (hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_RESPONSABLE_MAINTENANCE")) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.BREAKDOWN && hasRole(authentication, "ROLE_OPERATOR")) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.WORK_ORDER
                && hasRole(authentication, "ROLE_TECHNICIAN")
                && Objects.equals(parentContext.assignedTechnicianId(), currentUser.getId())) {
            return;
        }
        if (parentContext.entityType() == AttachmentEntityType.INTERVENTION_REPORT
                && hasRole(authentication, "ROLE_TECHNICIAN")
                && (Objects.equals(parentContext.technicianId(), currentUser.getId())
                || Objects.equals(parentContext.assignedTechnicianId(), currentUser.getId()))) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Vous n'etes pas autorise a ajouter une image a cette entite.");
    }

    private void validateDeleteOrUpdateAuthorization(
            MediaAttachment attachment,
            ParentContext parentContext,
            User currentUser,
            Authentication authentication
    ) {
        if (hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_RESPONSABLE_MAINTENANCE")) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Vous n'etes pas autorise a modifier cette piece jointe.");
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur courant introuvable."));
    }

    private MediaAttachment getAttachmentOrThrow(Long attachmentId) {
        return mediaAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new AttachmentNotFoundException(attachmentId));
    }

    private String sanitizeOriginalFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new InvalidDocumentUploadException("Le nom du fichier est obligatoire.");
        }
        if (originalFileName.contains("../") || originalFileName.contains("..\\")
                || originalFileName.contains("/") || originalFileName.contains("\\")) {
            throw new InvalidDocumentUploadException("Le nom du fichier est invalide.");
        }
        Path rawPath = Paths.get(originalFileName);
        if (rawPath.isAbsolute()) {
            throw new InvalidDocumentUploadException("Le nom du fichier est invalide.");
        }

        String cleaned = StringUtils.cleanPath(originalFileName);
        if (cleaned.contains("..")) {
            throw new InvalidDocumentUploadException("Le nom du fichier est invalide.");
        }
        String finalName = Paths.get(cleaned).getFileName().toString().trim();
        if (finalName.isBlank()) {
            throw new InvalidDocumentUploadException("Le nom du fichier est invalide.");
        }
        return finalName;
    }

    private String extractExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0 || lastDot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }

    private String normalizeMimeType(String contentType) {
        return contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String buildStoredFileName(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + "." + extension.toLowerCase(Locale.ROOT);
    }

    private Path resolveAttachmentDirectory(AttachmentEntityType entityType, Long entityId) {
        Path directory = storageRoot.resolve(entityType.name().toLowerCase(Locale.ROOT))
                .resolve(String.valueOf(entityId))
                .normalize();
        ensurePathInsideStorage(directory);
        try {
            Files.createDirectories(directory);
        } catch (IOException ex) {
            throw new DocumentStorageException("Impossible de creer le dossier de stockage des images.");
        }
        return directory;
    }

    private Path resolveStoredFilePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new DocumentStorageException("Le chemin de stockage est invalide.");
        }
        return storageRoot.resolve(storagePath).normalize();
    }

    private void ensurePathInsideStorage(Path targetPath) {
        if (!targetPath.startsWith(storageRoot)) {
            throw new InvalidDocumentUploadException("Le chemin de stockage est invalide.");
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String buildAddedAuditMessage(MediaAttachment attachment, ParentContext parentContext) {
        return switch (attachment.getCategory()) {
            case EQUIPMENT_PHOTO, NAMEPLATE -> "Photo ajoutee a l'equipement " + parentContext.reference() + ".";
            case BREAKDOWN_PHOTO -> "Photo de panne ajoutee.";
            case BEFORE_INTERVENTION -> "Photo avant intervention ajoutee a l'ordre de travail.";
            case AFTER_INTERVENTION -> "Photo apres intervention ajoutee a l'ordre de travail.";
            case FINAL_REPORT_PHOTO -> "Photo finale ajoutee au rapport d'intervention.";
            case GENERAL -> "Photo ajoutee a " + parentContext.entityType() + " " + parentContext.reference() + ".";
        };
    }

    private String buildDeletedAuditMessage(MediaAttachment attachment, ParentContext parentContext) {
        return switch (attachment.getEntityType()) {
            case EQUIPMENT -> "Photo supprimee de l'equipement " + parentContext.reference() + ".";
            case BREAKDOWN -> "Photo supprimee de la panne " + parentContext.reference() + ".";
            case WORK_ORDER -> "Photo supprimee de l'ordre de travail " + parentContext.reference() + ".";
            case INTERVENTION_REPORT -> "Photo supprimee du rapport d'intervention.";
        };
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    private boolean hasAnyRole(Authentication authentication, String... roles) {
        for (String role : roles) {
            if (hasRole(authentication, role)) {
                return true;
            }
        }
        return false;
    }

    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }

    private void initializeStorageRoot() {
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to initialize media attachment storage directory: " + storageRoot, ex);
        }
    }

    private record StoredImage(
            String originalFileName,
            String storedFileName,
            String mimeType,
            Long fileSizeBytes,
            String storagePath
    ) {
    }

    private record ParentContext(
            AttachmentEntityType entityType,
            Long entityId,
            String reference,
            Long assignedTechnicianId,
            Long technicianId
    ) {
    }
}
