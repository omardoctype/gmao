package com.edi.gmao.service;

import com.edi.gmao.config.DocumentStorageProperties;
import com.edi.gmao.dto.ai.AiAskRequest;
import com.edi.gmao.dto.ai.AiAskResponse;
import com.edi.gmao.dto.ai.AiSourceResponse;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentDownloadPayload;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentUploadRequest;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentDocument;
import com.edi.gmao.entity.EquipmentDocumentType;
import com.edi.gmao.exception.DocumentStorageException;
import com.edi.gmao.exception.EquipmentDocumentNotFoundException;
import com.edi.gmao.exception.EquipmentNotFoundException;
import com.edi.gmao.exception.InvalidDocumentUploadException;
import com.edi.gmao.mapper.EquipmentDocumentMapper;
import com.edi.gmao.repository.EquipmentDocumentRepository;
import com.edi.gmao.repository.EquipmentRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EquipmentDocumentService {

    private static final String MISSING_INFORMATION_TEXT = "Information non disponible dans la base documentaire.";
    private static final List<String> REQUIRED_AI_SECTIONS = List.of(
            "Description technique",
            "Risques principaux",
            "Symptomes possibles",
            "Procedure de maintenance preventive",
            "Points de controle",
            "Pieces recommandees",
            "Consignes de securite"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "text/plain",
            "text/markdown",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf",
            "txt",
            "md",
            "jpg",
            "jpeg",
            "png",
            "webp",
            "doc",
            "docx"
    );

    private final EquipmentRepository equipmentRepository;
    private final EquipmentDocumentRepository equipmentDocumentRepository;
    private final EquipmentDocumentMapper equipmentDocumentMapper;
    private final DocumentStorageProperties documentStorageProperties;
    private final AuditLogService auditLogService;
    private final AiAssistantService aiAssistantService;
    private final Path storageRoot;

    public EquipmentDocumentService(
            EquipmentRepository equipmentRepository,
            EquipmentDocumentRepository equipmentDocumentRepository,
            EquipmentDocumentMapper equipmentDocumentMapper,
            DocumentStorageProperties documentStorageProperties,
            AuditLogService auditLogService,
            AiAssistantService aiAssistantService
    ) {
        this.equipmentRepository = equipmentRepository;
        this.equipmentDocumentRepository = equipmentDocumentRepository;
        this.equipmentDocumentMapper = equipmentDocumentMapper;
        this.documentStorageProperties = documentStorageProperties;
        this.auditLogService = auditLogService;
        this.aiAssistantService = aiAssistantService;
        this.storageRoot = Paths.get(documentStorageProperties.getStorageDir()).toAbsolutePath().normalize();
        initializeStorageRoot();
    }

    @Transactional
    public EquipmentDocumentResponse upload(Long equipmentId, EquipmentDocumentUploadRequest request) {
        Equipment equipment = getEquipmentOrThrow(equipmentId);
        MultipartFile file = request.getFile();
        validateFile(file);

        String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
        String extension = extractExtension(originalFileName);
        validateFileType(file.getContentType(), extension);

        String storedFileName = buildStoredFileName(extension);
        Path equipmentDir = resolveEquipmentDirectory(equipmentId);
        Path targetFile = equipmentDir.resolve(storedFileName).normalize();
        ensurePathInsideStorage(targetFile);

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to store document file");
        }

        EquipmentDocument document = new EquipmentDocument();
        document.setOriginalFileName(originalFileName);
        document.setStoredFileName(storedFileName);
        document.setContentType(normalizeContentType(file.getContentType()));
        document.setSize(file.getSize());
        document.setDocumentType(request.getDocumentType());
        document.setStoragePath(storageRoot.relativize(targetFile).toString().replace("\\", "/"));
        document.setUploadedAt(Instant.now());
        document.setGeneratedByAi(Boolean.TRUE.equals(request.getGeneratedByAi()));
        document.setEquipment(equipment);

        EquipmentDocument savedDocument = equipmentDocumentRepository.save(document);
        auditLogService.record(
                "EQUIPMENT_DOCUMENT_UPLOADED",
                "EQUIPMENT_DOCUMENT",
                savedDocument.getId(),
                "Document " + savedDocument.getOriginalFileName() + " uploaded for equipment " + equipment.getCode()
        );

        return equipmentDocumentMapper.toResponse(savedDocument);
    }

    @Transactional(readOnly = true)
    public List<EquipmentDocumentResponse> list(Long equipmentId) {
        getEquipmentOrThrow(equipmentId);
        return equipmentDocumentRepository.findByEquipmentIdOrderByUploadedAtDesc(equipmentId).stream()
                .map(equipmentDocumentMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EquipmentDocumentResponse getMetadata(Long equipmentId, Long documentId) {
        EquipmentDocument document = getDocumentOrThrow(equipmentId, documentId);
        return equipmentDocumentMapper.toResponse(document);
    }

    @Transactional(readOnly = true)
    public EquipmentDocumentDownloadPayload download(Long equipmentId, Long documentId) {
        EquipmentDocument document = getDocumentOrThrow(equipmentId, documentId);
        Path filePath = resolveStoredFilePath(document.getStoragePath());
        ensurePathInsideStorage(filePath);
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            throw new DocumentStorageException("Stored document file is missing or unreadable");
        }

        byte[] content;
        try {
            content = Files.readAllBytes(filePath);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to read stored document file");
        }

        return new EquipmentDocumentDownloadPayload(
                content,
                normalizeContentType(document.getContentType()),
                document.getOriginalFileName(),
                document.getSize()
        );
    }

    @Transactional
    public EquipmentDocumentResponse generateAiDocument(Long equipmentId) {
        Equipment equipment = getEquipmentOrThrow(equipmentId);
        AiAskResponse aiResponse = requestAiTechnicalNote(equipment);
        String aiSections = normalizeAiSections(aiResponse.getAnswer());
        String markdownDocument = buildGeneratedMarkdownDocument(equipment, aiSections, aiResponse.getSources());
        byte[] content = markdownDocument.getBytes(StandardCharsets.UTF_8);

        String originalFileName = "equipment_" + sanitizeFileNamePart(equipment.getCode()) + "_ai_document.md";
        String storedFileName = buildStoredFileName("md");
        Path equipmentDir = resolveEquipmentDirectory(equipmentId);
        Path targetFile = equipmentDir.resolve(storedFileName).normalize();
        ensurePathInsideStorage(targetFile);

        try {
            Files.write(targetFile, content);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to store AI generated document file");
        }

        EquipmentDocument document = new EquipmentDocument();
        document.setOriginalFileName(originalFileName);
        document.setStoredFileName(storedFileName);
        document.setContentType("text/markdown");
        document.setSize((long) content.length);
        document.setDocumentType(EquipmentDocumentType.AI_GENERATED_TECHNICAL_NOTE);
        document.setStoragePath(storageRoot.relativize(targetFile).toString().replace("\\", "/"));
        document.setUploadedAt(Instant.now());
        document.setGeneratedByAi(true);
        document.setEquipment(equipment);

        EquipmentDocument savedDocument = equipmentDocumentRepository.save(document);
        auditLogService.record(
                "EQUIPMENT_DOCUMENT_GENERATED_AI",
                "EQUIPMENT_DOCUMENT",
                savedDocument.getId(),
                "AI technical note generated for equipment " + equipment.getCode()
        );

        return equipmentDocumentMapper.toResponse(savedDocument);
    }

    @Transactional
    public EquipmentDocument createInterventionReportDocument(
            Equipment equipment,
            String originalFileName,
            String markdownContent
    ) {
        if (equipment == null || equipment.getId() == null) {
            throw new DocumentStorageException("Equipment is required to create intervention report document");
        }
        if (markdownContent == null || markdownContent.isBlank()) {
            throw new DocumentStorageException("Intervention report content is required");
        }

        byte[] content = markdownContent.getBytes(StandardCharsets.UTF_8);
        String storedFileName = buildStoredFileName("md");
        Path equipmentDir = resolveEquipmentDirectory(equipment.getId());
        Path targetFile = equipmentDir.resolve(storedFileName).normalize();
        ensurePathInsideStorage(targetFile);

        try {
            Files.write(targetFile, content);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to store intervention report document file");
        }

        EquipmentDocument document = new EquipmentDocument();
        document.setOriginalFileName(sanitizeOriginalFileName(originalFileName));
        document.setStoredFileName(storedFileName);
        document.setContentType("text/markdown");
        document.setSize((long) content.length);
        document.setDocumentType(EquipmentDocumentType.RAPPORT_INTERVENTION);
        document.setStoragePath(storageRoot.relativize(targetFile).toString().replace("\\", "/"));
        document.setUploadedAt(Instant.now());
        document.setGeneratedByAi(false);
        document.setEquipment(equipment);

        EquipmentDocument savedDocument = equipmentDocumentRepository.save(document);
        auditLogService.record(
                "EQUIPMENT_DOCUMENT_INTERVENTION_REPORT_CREATED",
                "EQUIPMENT_DOCUMENT",
                savedDocument.getId(),
                "Intervention report document generated for equipment " + equipment.getCode()
        );

        return savedDocument;
    }

    @Transactional
    public void delete(Long equipmentId, Long documentId) {
        EquipmentDocument document = getDocumentOrThrow(equipmentId, documentId);
        Path filePath = resolveStoredFilePath(document.getStoragePath());
        ensurePathInsideStorage(filePath);

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to delete stored document file");
        }

        equipmentDocumentRepository.delete(document);
        auditLogService.record(
                "EQUIPMENT_DOCUMENT_DELETED",
                "EQUIPMENT_DOCUMENT",
                documentId,
                "Document " + document.getOriginalFileName() + " deleted for equipment " + equipmentId
        );
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDocumentUploadException("Document file is required");
        }

        if (file.getSize() > documentStorageProperties.getMaxFileSizeBytes()) {
            throw new InvalidDocumentUploadException(
                    "File size exceeds maximum allowed size of " + documentStorageProperties.getMaxFileSizeBytes() + " bytes"
            );
        }
    }

    private void validateFileType(String contentType, String extension) {
        String normalizedContentType = normalizeContentType(contentType);
        boolean contentTypeAllowed = ALLOWED_CONTENT_TYPES.contains(normalizedContentType);
        boolean extensionAllowed = ALLOWED_EXTENSIONS.contains(extension);

        if (!contentTypeAllowed && !extensionAllowed) {
            throw new InvalidDocumentUploadException(
                    "Unsupported file type. Allowed: PDF, TXT/MD, JPG, JPEG, PNG, WEBP, DOC, DOCX"
            );
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String sanitizeOriginalFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new InvalidDocumentUploadException("Original file name is required");
        }

        String cleaned = StringUtils.cleanPath(originalFileName);
        if (cleaned.contains("..")) {
            throw new InvalidDocumentUploadException("Invalid file name");
        }

        Path normalizedPath = Paths.get(cleaned).getFileName();
        if (normalizedPath == null) {
            throw new InvalidDocumentUploadException("Invalid file name");
        }

        String finalName = normalizedPath.toString().trim();
        if (finalName.isBlank()) {
            throw new InvalidDocumentUploadException("Invalid file name");
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

    private String buildStoredFileName(String extension) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        if (extension.isBlank()) {
            return uuid;
        }
        return uuid + "." + extension;
    }

    private AiAskResponse requestAiTechnicalNote(Equipment equipment) {
        AiAskRequest request = new AiAskRequest();
        request.setEquipmentCode(equipment.getCode());
        request.setQuestion(buildAiDocumentPrompt(equipment));
        return aiAssistantService.ask(request);
    }

    private String buildAiDocumentPrompt(Equipment equipment) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Tu es un assistant de maintenance industrielle.\n");
        prompt.append("Redige une note technique en francais professionnel, basee uniquement sur les informations documentaires disponibles.\n");
        prompt.append("N'invente aucune piece, procedure ou historique absent des sources.\n");
        prompt.append("Retourne uniquement du Markdown, avec exactement ces sections et dans cet ordre :\n");
        for (String section : REQUIRED_AI_SECTIONS) {
            prompt.append("## ").append(section).append("\n");
        }
        prompt.append("Chaque action doit etre une phrase complete et exploitable sur le terrain.\n");
        prompt.append("Si une information est absente, ecris exactement : ").append(MISSING_INFORMATION_TEXT).append("\n\n");
        prompt.append("Contexte equipement :\n");
        prompt.append("- Code: ").append(safeValue(equipment.getCode())).append("\n");
        prompt.append("- Nom: ").append(safeValue(equipment.getName())).append("\n");
        prompt.append("- Categorie: ").append(safeValue(equipment.getCategory())).append("\n");
        prompt.append("- Marque: ").append(safeValue(equipment.getBrand())).append("\n");
        prompt.append("- Modele: ").append(safeValue(equipment.getModel())).append("\n");
        prompt.append("- Numero de serie: ").append(safeValue(equipment.getSerialNumber())).append("\n");
        prompt.append("- Localisation: ").append(safeValue(equipment.getLocation())).append("\n");
        prompt.append("- Statut: ").append(safeValue(formatEnum(equipment.getStatus()))).append("\n");
        prompt.append("- Criticite: ").append(safeValue(formatEnum(equipment.getCriticality()))).append("\n");
        prompt.append("- Description: ").append(safeValue(equipment.getDescription())).append("\n");
        return prompt.toString();
    }

    private String normalizeAiSections(String aiAnswer) {
        String content = aiAnswer == null ? "" : aiAnswer.trim();
        if (content.isBlank()) {
            content = "## Description technique\n" + MISSING_INFORMATION_TEXT;
        }

        for (String section : REQUIRED_AI_SECTIONS) {
            content = ensureSection(content, section);
        }

        return content;
    }

    private String ensureSection(String content, String section) {
        String expectedHeading = "## " + section;
        String normalizedContent = content.toLowerCase(Locale.ROOT);
        if (normalizedContent.contains(expectedHeading.toLowerCase(Locale.ROOT))) {
            return content;
        }
        return content + "\n\n" + expectedHeading + "\n" + MISSING_INFORMATION_TEXT;
    }

    private String buildGeneratedMarkdownDocument(Equipment equipment, String aiSections, List<AiSourceResponse> sources) {
        StringBuilder markdown = new StringBuilder();
        markdown.append("# Fiche technique IA - ").append(safeValue(equipment.getCode())).append("\n\n");
        markdown.append("Document genere le ")
                .append(DateTimeFormatter.ISO_INSTANT.format(Instant.now().atOffset(ZoneOffset.UTC)))
                .append(".\n\n");

        markdown.append("## Informations equipement\n");
        markdown.append("- Code: ").append(safeValue(equipment.getCode())).append("\n");
        markdown.append("- Nom: ").append(safeValue(equipment.getName())).append("\n");
        markdown.append("- Categorie: ").append(safeValue(equipment.getCategory())).append("\n");
        markdown.append("- Marque: ").append(safeValue(equipment.getBrand())).append("\n");
        markdown.append("- Modele: ").append(safeValue(equipment.getModel())).append("\n");
        markdown.append("- Numero de serie: ").append(safeValue(equipment.getSerialNumber())).append("\n");
        markdown.append("- Localisation: ").append(safeValue(equipment.getLocation())).append("\n");
        markdown.append("- Statut: ").append(safeValue(formatEnum(equipment.getStatus()))).append("\n");
        markdown.append("- Criticite: ").append(safeValue(formatEnum(equipment.getCriticality()))).append("\n");
        markdown.append("- Description: ").append(safeValue(equipment.getDescription())).append("\n\n");

        markdown.append(aiSections.trim()).append("\n\n");

        markdown.append("## Informations utiles pour le RAG\n");
        markdown.append("- Identifiants: ")
                .append(safeValue(equipment.getCode()))
                .append(", ")
                .append(safeValue(equipment.getName()))
                .append(".\n");
        markdown.append("- Mots-cles techniques: ")
                .append(safeValue(equipment.getCategory()))
                .append(", ")
                .append(safeValue(equipment.getBrand()))
                .append(", ")
                .append(safeValue(equipment.getModel()))
                .append(".\n");
        markdown.append("- Sources documentaires utilisees:\n");
        if (sources == null || sources.isEmpty()) {
            markdown.append("  - Aucune source documentaire explicite retournee par le service IA.\n");
        } else {
            boolean sourceAdded = false;
            for (AiSourceResponse source : sources) {
                if (source == null) {
                    continue;
                }
                String sourceFile = source.getFile();
                if (sourceFile == null || sourceFile.isBlank()) {
                    continue;
                }
                markdown.append("  - ").append(sourceFile.trim()).append("\n");
                sourceAdded = true;
            }
            if (!sourceAdded) {
                markdown.append("  - Aucune source documentaire explicite retournee par le service IA.\n");
            }
        }

        return markdown.toString();
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "Non renseigne";
        }
        return value.trim();
    }

    private String formatEnum(Enum<?> value) {
        if (value == null) {
            return "Non renseigne";
        }
        return value.name();
    }

    private String sanitizeFileNamePart(String value) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }
        String sanitized = value.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
        sanitized = sanitized.replaceAll("_+", "_");
        if (sanitized.isBlank()) {
            return "UNKNOWN";
        }
        return sanitized;
    }

    private Path resolveEquipmentDirectory(Long equipmentId) {
        Path equipmentDirectory = storageRoot.resolve(String.valueOf(equipmentId)).normalize();
        ensurePathInsideStorage(equipmentDirectory);
        try {
            Files.createDirectories(equipmentDirectory);
        } catch (IOException ex) {
            throw new DocumentStorageException("Failed to create equipment document directory");
        }
        return equipmentDirectory;
    }

    private Path resolveStoredFilePath(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new DocumentStorageException("Stored document path is invalid");
        }
        return storageRoot.resolve(storagePath).normalize();
    }

    private void ensurePathInsideStorage(Path targetPath) {
        if (!targetPath.startsWith(storageRoot)) {
            throw new InvalidDocumentUploadException("Invalid storage path");
        }
    }

    private Equipment getEquipmentOrThrow(Long equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));
    }

    private EquipmentDocument getDocumentOrThrow(Long equipmentId, Long documentId) {
        return equipmentDocumentRepository.findByIdAndEquipmentId(documentId, equipmentId)
                .orElseThrow(() -> new EquipmentDocumentNotFoundException(equipmentId, documentId));
    }

    private void initializeStorageRoot() {
        try {
            Files.createDirectories(storageRoot);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to initialize documents storage directory: " + storageRoot, ex);
        }
    }
}
