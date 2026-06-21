import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { AttachmentCard } from "@/components/attachments/AttachmentCard";
import { AttachmentImagePreviewDialog } from "@/components/attachments/AttachmentImagePreviewDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toast-context";
import { getApiErrorMessage } from "@/services/api";
import { fetchAttachmentContent } from "@/services/attachment-service";
import type { MediaAttachment } from "@/types/attachment";

interface AttachmentGalleryProps {
  attachments: MediaAttachment[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  canDelete?: boolean;
  onDelete?: (attachment: MediaAttachment) => Promise<void>;
  onRetry?: () => void;
}

export function AttachmentGallery({
  attachments,
  loading = false,
  error = null,
  emptyMessage = "Aucune image attachee pour le moment.",
  canDelete = false,
  onDelete,
  onRetry,
}: AttachmentGalleryProps) {
  const toast = useToast();
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadingImageIds, setLoadingImageIds] = useState<Set<number>>(new Set());
  const [selectedAttachment, setSelectedAttachment] = useState<MediaAttachment | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const imageKey = useMemo(
    () => attachments.map((attachment) => `${attachment.id}:${attachment.storedFileName}`).join("|"),
    [attachments],
  );

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    setImageUrls({});
    setLoadingImageIds(new Set(attachments.map((attachment) => attachment.id)));

    async function loadImages() {
      const entries = await Promise.all(
        attachments.map(async (attachment) => {
          try {
            const blob = await fetchAttachmentContent(attachment);
            const objectUrl = window.URL.createObjectURL(blob);
            objectUrls.push(objectUrl);
            return [attachment.id, objectUrl] as const;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) {
        objectUrls.forEach((objectUrl) => window.URL.revokeObjectURL(objectUrl));
        return;
      }

      setImageUrls(Object.fromEntries(entries.filter((entry): entry is readonly [number, string] => entry !== null)));
      setLoadingImageIds(new Set());
    }

    if (attachments.length > 0) {
      void loadImages();
    }

    return () => {
      cancelled = true;
      objectUrls.forEach((objectUrl) => window.URL.revokeObjectURL(objectUrl));
    };
  }, [attachments, imageKey]);

  const handleDelete = async (attachment: MediaAttachment) => {
    if (!onDelete) {
      return;
    }

    const confirmed = window.confirm(`Supprimer l'image ${attachment.originalFileName} ?`);
    if (!confirmed) {
      return;
    }

    setDeletingAttachmentId(attachment.id);

    try {
      await onDelete(attachment);
      toast.success("Image supprimee avec succes.");
      if (selectedAttachment?.id === attachment.id) {
        setSelectedAttachment(null);
      }
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Impossible de supprimer l'image."));
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
          Chargement des images...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry ? (
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={onRetry}>
            Reessayer
          </Button>
        ) : null}
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-elevated p-3 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
            imageUrl={imageUrls[attachment.id]}
            loadingImage={loadingImageIds.has(attachment.id)}
            canDelete={canDelete && Boolean(onDelete)}
            deleting={deletingAttachmentId === attachment.id}
            onPreview={setSelectedAttachment}
            onDelete={(targetAttachment) => void handleDelete(targetAttachment)}
          />
        ))}
      </div>

      <AttachmentImagePreviewDialog
        open={selectedAttachment !== null}
        attachment={selectedAttachment}
        imageUrl={selectedAttachment ? imageUrls[selectedAttachment.id] : undefined}
        loadingImage={selectedAttachment ? loadingImageIds.has(selectedAttachment.id) : false}
        onClose={() => setSelectedAttachment(null)}
      />
    </>
  );
}
