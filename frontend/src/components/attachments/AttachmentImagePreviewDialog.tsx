import { ImageIcon, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResponsiveCrudPanel } from "@/components/ui/responsive-crud-panel";
import {
  formatAttachmentDate,
  formatAttachmentFileSize,
} from "@/services/attachment-service";
import { ATTACHMENT_CATEGORY_LABELS, type MediaAttachment } from "@/types/attachment";

interface AttachmentImagePreviewDialogProps {
  open: boolean;
  attachment: MediaAttachment | null;
  imageUrl?: string;
  loadingImage?: boolean;
  onClose: () => void;
}

export function AttachmentImagePreviewDialog({
  open,
  attachment,
  imageUrl,
  loadingImage = false,
  onClose,
}: AttachmentImagePreviewDialogProps) {
  if (!open || !attachment) {
    return null;
  }

  return (
    <ResponsiveCrudPanel
      open={open}
      onClose={onClose}
      closeLabel="Fermer l'apercu image"
      title={attachment.originalFileName}
      description={attachment.description || "Image attachee"}
      maxWidthClassName="md:max-w-5xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{ATTACHMENT_CATEGORY_LABELS[attachment.category]}</Badge>
          <Badge variant="outline">{formatAttachmentFileSize(attachment.fileSizeBytes)}</Badge>
          <Badge variant="outline">{formatAttachmentDate(attachment.uploadedAt)}</Badge>
          {attachment.uploadedByName ? <Badge variant="outline">{attachment.uploadedByName}</Badge> : null}
        </div>

        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={attachment.description || attachment.originalFileName}
              className="max-h-[72dvh] w-full object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              {loadingImage ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              Chargement de l'image...
            </div>
          )}
        </div>
      </div>
    </ResponsiveCrudPanel>
  );
}
