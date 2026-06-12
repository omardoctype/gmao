import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CalendarDays,
  Download,
  Eye,
  FilePlus2,
  FileText,
  LoaderCircle,
  MapPin,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/toast-context";
import { useAccessControl } from "@/hooks/use-access-control";
import { getApiErrorMessage } from "@/services/api";
import {
  deleteEquipmentDocument,
  fetchEquipmentDocumentFile,
  downloadEquipmentDocument,
  generateAiEquipmentDocument,
  getEquipmentDocuments,
  openEquipmentDocumentInNewTab,
  uploadEquipmentDocument,
} from "@/services/equipment-document-service";
import type { Equipment, EquipmentDocument, EquipmentDocumentType } from "@/types/equipment";

interface EquipmentDetailsDrawerProps {
  open: boolean;
  loading: boolean;
  equipment: Equipment | null;
  onClose: () => void;
}

const DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{ value: EquipmentDocumentType; label: string }> = [
  { value: "FICHE_TECHNIQUE", label: "Fiche technique" },
  { value: "MANUEL_MACHINE", label: "Manuel machine" },
  { value: "PHOTO", label: "Photo" },
  { value: "RAPPORT_INTERVENTION", label: "Rapport intervention" },
  { value: "AI_GENERATED_TECHNICAL_NOTE", label: "Document genere par IA" },
  { value: "DOCUMENT_GENERE_PAR_IA", label: "Document IA (legacy)" },
  { value: "AUTRE", label: "Autre" },
];

function statusLabel(status: Equipment["status"]): string {
  if (status === "OPERATIONAL") {
    return "Operationnel";
  }

  if (status === "MAINTENANCE") {
    return "Maintenance";
  }

  return "Hors service";
}

function criticalityLabel(criticality: Equipment["criticality"]): string {
  if (criticality === "LOW") {
    return "Faible";
  }

  if (criticality === "MEDIUM") {
    return "Moyenne";
  }

  if (criticality === "HIGH") {
    return "Haute";
  }

  return "Critique";
}

function infoValue(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return "-";
  }

  return value;
}

function documentTypeLabel(documentType: EquipmentDocumentType): string {
  const option = DOCUMENT_TYPE_OPTIONS.find((entry) => entry.value === documentType);
  return option?.label ?? documentType;
}

function formatFileSize(sizeInBytes: number): string {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes < 0) {
    return "-";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  let value = sizeInBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function formatUploadDate(uploadedAt: string): string {
  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex < 0 || lastDotIndex === fileName.length - 1) {
    return "";
  }
  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function isInlineTextPreviewDocument(document: EquipmentDocument): boolean {
  const contentType = (document.contentType || "").toLowerCase();
  const extension = getFileExtension(document.originalFileName);

  if (contentType.startsWith("text/")) {
    return true;
  }

  if (contentType.includes("markdown")) {
    return true;
  }

  if (document.generatedByAi && (extension === "md" || extension === "txt")) {
    return true;
  }

  return extension === "md" || extension === "txt";
}

export function EquipmentDetailsDrawer({ open, loading, equipment, onClose }: EquipmentDetailsDrawerProps) {
  const { can } = useAccessControl();
  const toast = useToast();

  const canReadDocuments = can("equipmentDocumentRead");
  const canUploadDocuments = can("equipmentDocumentUpload");
  const canDeleteDocuments = can("equipmentDocumentDelete");
  const canGenerateAiDocument = can("equipmentDocumentGenerateAi");

  const [documents, setDocuments] = useState<EquipmentDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState<EquipmentDocumentType>("FICHE_TECHNIQUE");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [generatingAiDocument, setGeneratingAiDocument] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<number | null>(null);
  const [openingDocumentId, setOpeningDocumentId] = useState<number | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<EquipmentDocument | null>(null);
  const [previewContent, setPreviewContent] = useState("");

  const refreshDocuments = useCallback(
    async (showLoader: boolean) => {
      if (!canReadDocuments || !equipment) {
        return;
      }

      if (showLoader) {
        setDocumentsLoading(true);
      }

      try {
        const data = await getEquipmentDocuments(equipment.id);
        setDocuments(data);
        setDocumentsError(null);
      } catch (error) {
        setDocumentsError(getApiErrorMessage(error, "Impossible de charger les documents de l'equipement."));
      } finally {
        if (showLoader) {
          setDocumentsLoading(false);
        }
      }
    },
    [canReadDocuments, equipment],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setUploadDocumentType("FICHE_TECHNIQUE");
    setUploadFile(null);
    setFileInputKey((previous) => previous + 1);
    setDocumentsError(null);
    setOpeningDocumentId(null);
    setDownloadingDocumentId(null);
    setDeletingDocumentId(null);
    setGeneratingAiDocument(false);
    setUploadingDocument(false);
    setPreviewOpen(false);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewDocument(null);
    setPreviewContent("");

    if (!canReadDocuments || !equipment) {
      setDocuments([]);
      setDocumentsLoading(false);
      return;
    }

    void refreshDocuments(true);
  }, [canReadDocuments, equipment, open, refreshDocuments]);

  if (!open) {
    return null;
  }

  const handleUploadDocument = async () => {
    if (!equipment || !canUploadDocuments) {
      return;
    }

    if (!uploadFile) {
      toast.error("Selectionnez un fichier avant l'upload.");
      return;
    }

    setUploadingDocument(true);

    try {
      await uploadEquipmentDocument(equipment.id, {
        file: uploadFile,
        documentType: uploadDocumentType,
      });
      toast.success("Document ajoute avec succes.");
      setUploadFile(null);
      setFileInputKey((previous) => previous + 1);
      await refreshDocuments(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible d'ajouter le document."));
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleGenerateAiDocument = async () => {
    if (!equipment || !canGenerateAiDocument) {
      return;
    }

    setGeneratingAiDocument(true);

    try {
      await generateAiEquipmentDocument(equipment.id);
      toast.success("Document IA genere et attache a l'equipement.");
      await refreshDocuments(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de generer le document IA."));
    } finally {
      setGeneratingAiDocument(false);
    }
  };

  const closePreviewPanel = () => {
    setPreviewOpen(false);
    setPreviewLoading(false);
    setPreviewError(null);
    setPreviewDocument(null);
    setPreviewContent("");
  };

  const handleOpenDocument = async (document: EquipmentDocument) => {
    if (!equipment || !canReadDocuments) {
      return;
    }

    setOpeningDocumentId(document.id);

    try {
      if (isInlineTextPreviewDocument(document)) {
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewDocument(document);
        setPreviewContent("");

        const payload = await fetchEquipmentDocumentFile(equipment.id, document);
        const content = await payload.blob.text();
        setPreviewContent(content || "Document vide.");
      } else {
        await openEquipmentDocumentInNewTab(equipment.id, document);
      }
    } catch (error) {
      if (isInlineTextPreviewDocument(document)) {
        setPreviewError(getApiErrorMessage(error, "Impossible d'ouvrir le document."));
      } else {
        toast.error(getApiErrorMessage(error, "Impossible d'ouvrir le document dans un nouvel onglet."));
      }
    } finally {
      setPreviewLoading(false);
      setOpeningDocumentId(null);
    }
  };

  const handleDownloadDocument = async (document: EquipmentDocument) => {
    if (!equipment || !canReadDocuments) {
      return;
    }

    setDownloadingDocumentId(document.id);

    try {
      await downloadEquipmentDocument(equipment.id, document);
      toast.success("Document telecharge avec succes.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de telecharger le document."));
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  const handleDeleteDocument = async (document: EquipmentDocument) => {
    if (!equipment || !canDeleteDocuments) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le document ${document.originalFileName} ?`);
    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(document.id);

    try {
      await deleteEquipmentDocument(equipment.id, document.id);
      toast.success("Document supprime avec succes.");
      await refreshDocuments(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de supprimer le document."));
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/30"
        aria-label="Fermer le detail"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-border bg-surface shadow-panel">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Detail equipement</h2>
              <p className="text-sm text-muted-foreground">Fiche technique resumee pour consultation rapide.</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : equipment ? (
              <div className="space-y-4">
                <Card className="border-border/90">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Identification</p>
                    <p className="text-lg font-semibold text-foreground">{equipment.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {equipment.code} - {equipment.category}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Etat operationnel</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
                        <p className="text-xs text-muted-foreground">Statut</p>
                        <p className="text-sm font-semibold text-foreground">{statusLabel(equipment.status)}</p>
                      </div>
                      <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
                        <p className="text-xs text-muted-foreground">Criticite</p>
                        <p className="text-sm font-semibold text-foreground">{criticalityLabel(equipment.criticality)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Informations techniques</p>
                    <InfoLine icon={Settings} label="Marque" value={infoValue(equipment.brand)} />
                    <InfoLine icon={Settings} label="Modele" value={infoValue(equipment.model)} />
                    <InfoLine icon={ShieldAlert} label="Numero de serie" value={infoValue(equipment.serialNumber)} />
                    <InfoLine icon={MapPin} label="Localisation" value={infoValue(equipment.location)} />
                    <InfoLine icon={CalendarDays} label="Installation" value={infoValue(equipment.installationDate)} />
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">{infoValue(equipment.description)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/90">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Documents</p>
                        <h3 className="text-base font-semibold text-foreground">Documents de l'equipement</h3>
                      </div>
                      {canGenerateAiDocument ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={generatingAiDocument}
                          onClick={() => void handleGenerateAiDocument()}
                        >
                          {generatingAiDocument ? (
                            <>
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                              Generation IA...
                            </>
                          ) : (
                            <>
                              <Bot className="mr-2 h-4 w-4" />
                              Generer document IA
                            </>
                          )}
                        </Button>
                      ) : null}
                    </div>

                    {!canReadDocuments ? (
                      <p className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-muted-foreground">
                        Votre role ne permet pas la consultation des documents de cet equipement.
                      </p>
                    ) : (
                      <>
                        {canUploadDocuments ? (
                          <div className="rounded-lg border border-border bg-surface-elevated p-3">
                            <p className="mb-3 text-sm font-medium text-foreground">Ajouter un document</p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor="equipment-document-type">
                                  Type document
                                </label>
                                <Select
                                  id="equipment-document-type"
                                  value={uploadDocumentType}
                                  onChange={(event) =>
                                    setUploadDocumentType(event.target.value as EquipmentDocumentType)
                                  }
                                >
                                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground" htmlFor="equipment-document-file">
                                  Fichier
                                </label>
                                <Input
                                  key={fileInputKey}
                                  id="equipment-document-file"
                                  type="file"
                                  onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                                />
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button
                                type="button"
                                size="sm"
                                disabled={uploadingDocument || !uploadFile}
                                onClick={() => void handleUploadDocument()}
                              >
                                {uploadingDocument ? (
                                  <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Upload...
                                  </>
                                ) : (
                                  <>
                                    <FilePlus2 className="mr-2 h-4 w-4" />
                                    Ajouter un document
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {documentsLoading ? (
                          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                              Chargement des documents...
                            </span>
                          </div>
                        ) : documentsError ? (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                            <p className="text-sm text-destructive">{documentsError}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => void refreshDocuments(true)}
                            >
                              Reessayer
                            </Button>
                          </div>
                        ) : documents.length === 0 ? (
                          <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
                            Aucun document attache a cet equipement pour le moment.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {documents.map((document) => (
                              <article key={document.id} className="rounded-lg border border-border bg-surface-elevated p-3">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0 space-y-1">
                                    <p className="flex items-start gap-2 text-sm font-semibold text-foreground">
                                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                      <span className="truncate">{document.originalFileName}</span>
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="secondary" className="text-[11px]">
                                        {documentTypeLabel(document.documentType)}
                                      </Badge>
                                      <Badge variant={document.generatedByAi ? "success" : "outline"} className="text-[11px]">
                                        {document.generatedByAi ? "Genere par IA" : "Ajout manuel"}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(document.size)} - Upload {formatUploadDate(document.uploadedAt)}
                                    </p>
                                  </div>

                                  <div className="flex gap-2 sm:justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={openingDocumentId === document.id}
                                      onClick={() => void handleOpenDocument(document)}
                                    >
                                      {openingDocumentId === document.id ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      disabled={downloadingDocumentId === document.id}
                                      onClick={() => void handleDownloadDocument(document)}
                                    >
                                      {downloadingDocumentId === document.id ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Download className="h-4 w-4" />
                                      )}
                                    </Button>
                                    {canDeleteDocuments ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="text-destructive hover:text-destructive"
                                        disabled={deletingDocumentId === document.id}
                                        onClick={() => void handleDeleteDocument(document)}
                                      >
                                        {deletingDocumentId === document.id ? (
                                          <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Aucune donnee disponible.</div>
            )}
          </div>
        </div>
      </aside>

      {previewOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-foreground/40"
            aria-label="Fermer la lecture du document"
            onClick={closePreviewPanel}
          />
          <section className="fixed inset-0 z-[70] flex items-end justify-stretch p-0 md:items-center md:justify-center md:p-6">
            <div className="flex h-[92dvh] w-full flex-col rounded-t-2xl border border-border bg-surface shadow-panel md:h-auto md:max-h-[90dvh] md:max-w-5xl md:rounded-2xl">
              <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {previewDocument ? `Lecture document - ${previewDocument.originalFileName}` : "Lecture document"}
                  </h3>
                  <p className="text-sm text-muted-foreground">Apercu texte/markdown du document attache.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={closePreviewPanel} aria-label="Fermer la lecture">
                  <X className="h-4 w-4" />
                </Button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                {previewLoading ? (
                  <Card className="border-border/90 bg-surface">
                    <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                      Chargement du contenu...
                    </CardContent>
                  </Card>
                ) : previewError ? (
                  <Card className="border-destructive/30 bg-destructive/10">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-sm text-destructive">{previewError}</p>
                      {previewDocument ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => void handleOpenDocument(previewDocument)}>
                          Reessayer
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border/90 bg-surface">
                    <CardContent className="p-4">
                      <pre className="max-h-[68dvh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-surface-elevated p-4 text-sm leading-relaxed text-foreground">
                        {previewContent || "Document vide."}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Settings;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
