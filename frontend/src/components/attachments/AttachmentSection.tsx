import { useCallback, useEffect, useState } from "react";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { AttachmentUploader } from "@/components/attachments/AttachmentUploader";
import { getApiErrorMessage } from "@/services/api";
import { deleteAttachment, getAttachments } from "@/services/attachment-service";
import type {
  AttachmentCategory,
  AttachmentCategoryOption,
  AttachmentEntityType,
  MediaAttachment,
} from "@/types/attachment";

interface AttachmentSectionProps {
  entityType: AttachmentEntityType;
  entityId: number;
  title: string;
  eyebrow?: string;
  categoryOptions: AttachmentCategoryOption[];
  defaultCategory: AttachmentCategory;
  canUpload?: boolean;
  canDelete?: boolean;
  uploadTitle?: string;
  descriptionPlaceholder?: string;
  emptyMessage?: string;
}

export function AttachmentSection({
  entityType,
  entityId,
  title,
  eyebrow = "Images",
  categoryOptions,
  defaultCategory,
  canUpload = false,
  canDelete = false,
  uploadTitle,
  descriptionPlaceholder,
  emptyMessage,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAttachments = useCallback(
    async (showLoader: boolean) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await getAttachments(entityType, entityId);
        setAttachments(data);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Impossible de charger les images."));
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [entityId, entityType],
  );

  useEffect(() => {
    void refreshAttachments(true);
  }, [refreshAttachments]);

  const handleDelete = async (attachment: MediaAttachment) => {
    await deleteAttachment(attachment.id);
    setAttachments((currentAttachments) => currentAttachments.filter((current) => current.id !== attachment.id));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>

      {canUpload ? (
        <AttachmentUploader
          entityType={entityType}
          entityId={entityId}
          categoryOptions={categoryOptions}
          defaultCategory={defaultCategory}
          title={uploadTitle}
          descriptionPlaceholder={descriptionPlaceholder}
          onUploaded={() => refreshAttachments(false)}
        />
      ) : null}

      <AttachmentGallery
        attachments={attachments}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        canDelete={canDelete}
        onDelete={canDelete ? handleDelete : undefined}
        onRetry={() => void refreshAttachments(true)}
      />
    </div>
  );
}
