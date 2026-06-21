import { type ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/toast-context";
import { getApiErrorMessage } from "@/services/api";
import {
  ATTACHMENT_MAX_FILES,
  formatAttachmentFileSize,
  uploadAttachments,
  validateAttachmentFiles,
} from "@/services/attachment-service";
import type {
  AttachmentCategory,
  AttachmentCategoryOption,
  AttachmentEntityType,
  MediaAttachment,
} from "@/types/attachment";

interface AttachmentUploaderProps {
  entityType: AttachmentEntityType;
  entityId: number;
  categoryOptions: AttachmentCategoryOption[];
  defaultCategory: AttachmentCategory;
  title?: string;
  descriptionPlaceholder?: string;
  disabled?: boolean;
  onUploaded?: (attachments: MediaAttachment[]) => void | Promise<void>;
}

export function AttachmentUploader({
  entityType,
  entityId,
  categoryOptions,
  defaultCategory,
  title = "Ajouter des images",
  descriptionPlaceholder = "Description optionnelle",
  disabled = false,
  onUploaded,
}: AttachmentUploaderProps) {
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory>(defaultCategory);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setSelectedCategory(defaultCategory);
  }, [defaultCategory]);

  const resetSelection = () => {
    setFiles([]);
    setDescription("");
    setFileInputKey((previous) => previous + 1);
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    const validationError = validateAttachmentFiles(nextFiles);

    if (validationError) {
      toast.error(validationError);
      resetSelection();
      return;
    }

    setFiles(nextFiles);
  };

  const handleUpload = async () => {
    const validationError = validateAttachmentFiles(files);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);

    try {
      const uploaded = await uploadAttachments({
        entityType,
        entityId,
        category: selectedCategory,
        description,
        files,
      });
      toast.success(uploaded.length > 1 ? "Images ajoutees avec succes." : "Image ajoutee avec succes.");
      resetSelection();
      await onUploaded?.(uploaded);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible d'ajouter les images."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3">
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP. {ATTACHMENT_MAX_FILES} images maximum.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`attachment-category-${entityType}-${entityId}`}>
            Categorie
          </label>
          <Select
            id={`attachment-category-${entityType}-${entityId}`}
            value={selectedCategory}
            disabled={disabled || uploading || categoryOptions.length === 0}
            onChange={(event) => setSelectedCategory(event.target.value as AttachmentCategory)}
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor={`attachment-files-${entityType}-${entityId}`}>
            Images
          </label>
          <Input
            key={fileInputKey}
            id={`attachment-files-${entityType}-${entityId}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={disabled || uploading}
            onChange={handleFilesChange}
          />
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor={`attachment-description-${entityType}-${entityId}`}>
          Description
        </label>
        <Textarea
          id={`attachment-description-${entityType}-${entityId}`}
          rows={2}
          placeholder={descriptionPlaceholder}
          value={description}
          disabled={disabled || uploading}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {files.length > 0 ? (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatAttachmentFileSize(file.size)}</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Retirer ${file.name}`}
                onClick={() => setFiles((currentFiles) => currentFiles.filter((currentFile) => currentFile !== file))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" disabled={disabled || uploading || files.length === 0} onClick={handleUpload}>
          {uploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {uploading ? "Upload..." : "Ajouter"}
        </Button>
      </div>
    </div>
  );
}
