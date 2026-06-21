import { Eye, ImageIcon, LoaderCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatAttachmentDate,
  formatAttachmentFileSize,
} from "@/services/attachment-service";
import { ATTACHMENT_CATEGORY_LABELS, type MediaAttachment } from "@/types/attachment";

interface AttachmentCardProps {
  attachment: MediaAttachment;
  imageUrl?: string;
  loadingImage?: boolean;
  deleting?: boolean;
  canDelete?: boolean;
  onPreview: (attachment: MediaAttachment) => void;
  onDelete?: (attachment: MediaAttachment) => void;
}

export function AttachmentCard({
  attachment,
  imageUrl,
  loadingImage = false,
  deleting = false,
  canDelete = false,
  onPreview,
  onDelete,
}: AttachmentCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface-elevated">
      <button
        type="button"
        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted text-left"
        onClick={() => onPreview(attachment)}
        aria-label={`Apercu ${attachment.originalFileName}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={attachment.description || attachment.originalFileName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {loadingImage ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow-soft">
          <Eye className="mr-1 inline h-3.5 w-3.5" />
          Voir
        </span>
      </button>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{attachment.originalFileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatAttachmentFileSize(attachment.fileSizeBytes)} - {formatAttachmentDate(attachment.uploadedAt)}
            </p>
          </div>
          {canDelete && onDelete ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 text-destructive hover:text-destructive"
              disabled={deleting}
              onClick={() => onDelete(attachment)}
              aria-label={`Supprimer ${attachment.originalFileName}`}
            >
              {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-[11px]">
            {ATTACHMENT_CATEGORY_LABELS[attachment.category]}
          </Badge>
          {attachment.uploadedByName ? (
            <Badge variant="outline" className="text-[11px]">
              {attachment.uploadedByName}
            </Badge>
          ) : null}
        </div>

        {attachment.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{attachment.description}</p>
        ) : null}
      </div>
    </article>
  );
}
