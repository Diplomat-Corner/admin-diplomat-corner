"use client";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";

const UPLOAD_ENDPOINT = "/api/advertisements/upload";

async function uploadOneImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to upload image");
  }
  return result.imageUrl as string;
}

export function useAdvertisementImageUpload(options: {
  getImageUrls: () => string[];
  setImageUrls: (urls: string[]) => void;
  /** Must append using fresh form state (e.g. getValues inside setValue). */
  appendImageUrl: (url: string) => void;
  setImagePreviews: Dispatch<SetStateAction<string[]>>;
}) {
  const { getImageUrls, setImageUrls, appendImageUrl, setImagePreviews } =
    options;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const removeImageAt = useCallback(
    (index: number) => {
      const urls = getImageUrls();
      const next = urls.filter((_, i) => i !== index);
      setImageUrls(next);
      setImagePreviews((p) => p.filter((_, i) => i !== index));
    },
    [getImageUrls, setImageUrls, setImagePreviews]
  );

  /**
   * Carousel: multiple files in one picker (same pattern as manage-car).
   * Normal / banner: only the first selected file is used.
   */
  const handleFileInputChange = useCallback(
    async (
      e: ChangeEvent<HTMLInputElement>,
      allowMultiple: boolean
    ) => {
      const input = e.target;
      const raw = input.files;
      if (!raw?.length) return;

      let files = Array.from(raw);
      if (!allowMultiple && files.length > 1) {
        files = [files[0]];
      }

      setUploadError(null);
      setIsUploading(true);

      const blobs: string[] = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...blobs]);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const blobUrl = blobs[i];
          try {
            const imageUrl = await uploadOneImage(file);
            appendImageUrl(imageUrl);
            setImagePreviews((p) => {
              const next = [...p];
              const idx = next.indexOf(blobUrl);
              if (idx !== -1) next[idx] = imageUrl;
              return next;
            });
            URL.revokeObjectURL(blobUrl);
          } catch (err) {
            console.error("Error uploading image:", err);
            const message =
              err instanceof Error ? err.message : "Upload failed";
            setUploadError(message);
            setImagePreviews((p) => p.filter((u) => u !== blobUrl));
            URL.revokeObjectURL(blobUrl);
          }
        }
      } finally {
        setIsUploading(false);
        input.value = "";
      }
    },
    [appendImageUrl, setImagePreviews]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    isUploading,
    uploadError,
    setUploadError,
    removeImageAt,
    handleFileInputChange,
    openFilePicker,
  };
}
