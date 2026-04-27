"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  IAdvertisement,
  normalizeImageUrls,
  normalizeAdvertisementType,
} from "@/lib/models/advertisement.types";
import { Tabs } from "@/components/ui/tabs";
import {
  advertisementFormSchema,
  type AdvertisementFormValues,
  validateAdvertisementBeforeSubmit,
} from "./advertisement-form-schema";
import { AdvertisementFormStepper } from "./advertisement-form-stepper";
import { AdvertisementBasicStep } from "./advertisement-basic-step";
import { AdvertisementAppearanceStep } from "./advertisement-appearance-step";
import { AdvertisementTargetingStep } from "./advertisement-targeting-step";
import { AdvertisementReviewStep } from "./advertisement-review-step";
import { useAdvertisementImageUpload } from "./use-advertisement-image-upload";

interface AdvertisementFormProps {
  mode: "create" | "edit";
  initialData?: IAdvertisement;
  onSuccess?: () => void;
}

export function AdvertisementForm({
  mode,
  initialData,
  onSuccess,
}: AdvertisementFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [hashtags, setHashtags] = useState<string[]>(
    initialData?.hashtags || []
  );
  const [hashtagInput, setHashtagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialUrls = initialData
    ? normalizeImageUrls({
        imageUrls: initialData.imageUrls,
        imageUrl: initialData.imageUrl,
      })
    : [];
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialUrls);

  const defaultPlacement = initialData
    ? normalizeAdvertisementType(String(initialData.advertisementType))
    : "normal";

  const form = useForm<AdvertisementFormValues>({
    resolver: zodResolver(advertisementFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      advertisementType: defaultPlacement,
      status: initialData?.status || "Draft",
      priority: initialData?.priority || "Medium",
      hashtags: initialData?.hashtags || [],
      link: initialData?.link || "",
      imageUrls: initialUrls,
      targetAudience: initialData?.targetAudience || "",
      startTime: initialData?.startTime || "",
      endTime: initialData?.endTime || "",
      performanceMetrics: initialData?.performanceMetrics || "",
    },
  });

  const { watch, setValue, getValues, trigger } = form;
  const placement = watch("advertisementType");

  const appendImageUrl = useCallback(
    (url: string) => {
      const prev = getValues("imageUrls");
      setValue("imageUrls", [...prev, url], { shouldValidate: true });
    },
    [getValues, setValue]
  );

  const setImageUrls = useCallback(
    (urls: string[]) => {
      setValue("imageUrls", urls, { shouldValidate: true });
    },
    [setValue]
  );

  const getImageUrls = useCallback(
    () => getValues("imageUrls"),
    [getValues]
  );

  const {
    fileInputRef,
    isUploading,
    uploadError,
    setUploadError,
    removeImageAt,
    handleFileInputChange,
    openFilePicker,
  } = useAdvertisementImageUpload({
    getImageUrls,
    setImageUrls,
    appendImageUrl,
    setImagePreviews,
  });

  const handleAddHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      const next = [
        ...hashtags,
        hashtagInput.startsWith("#") ? hashtagInput : `#${hashtagInput}`,
      ];
      setHashtags(next);
      setValue("hashtags", next);
      setHashtagInput("");
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    const next = hashtags.filter((t) => t !== tag);
    setHashtags(next);
    setValue("hashtags", next);
  };

  const handleHashtagKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && hashtagInput) {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const onSubmit = async (data: AdvertisementFormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const preCheck = validateAdvertisementBeforeSubmit(data);
      if (preCheck) {
        setError(preCheck);
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      const submissionData = {
        ...data,
        imageUrls: data.imageUrls,
        hashtags: data.hashtags || hashtags || [],
        startTime: data.startTime
          ? new Date(data.startTime).toISOString()
          : undefined,
        endTime: data.endTime
          ? new Date(data.endTime).toISOString()
          : undefined,
      };

      const endpoint =
        mode === "create"
          ? "/api/advertisements"
          : `/api/advertisements/${initialData?._id}`;

      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save advertisement");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/advertisements");
      }
    } catch (err) {
      console.error("Error saving advertisement:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNextFromStep1 = async () => {
    const ok = await trigger([
      "title",
      "description",
      "advertisementType",
      "status",
    ]);
    if (ok) {
      setUploadError(null);
      setCurrentStep(2);
    }
  };

  const goNextFromStep2 = async () => {
    const linkOk = await trigger("link");
    if (!linkOk) return;
    const imgs = getValues("imageUrls");
    const type = getValues("advertisementType");
    if (imgs.length < 1) {
      setUploadError("Add at least one image before continuing.");
      return;
    }
    if (type === "carousel" && imgs.length < 2) {
      setUploadError("Carousel placements need at least two images.");
      return;
    }
    setUploadError(null);
    setCurrentStep(3);
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="mx-auto max-w-4xl space-y-8"
    >
      <AdvertisementFormStepper currentStep={currentStep} />

      <Tabs value={currentStep.toString()} className="space-y-8">
        <AdvertisementBasicStep
          form={form}
          onCancel={() => router.back()}
          onNext={() => void goNextFromStep1()}
        />

        <AdvertisementAppearanceStep
          form={form}
          placement={placement}
          imagePreviews={imagePreviews}
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          uploadError={uploadError}
          onFileChange={(e) => {
            void handleFileInputChange(e, placement === "carousel");
          }}
          onOpenPicker={openFilePicker}
          onRemoveImage={removeImageAt}
          hashtags={hashtags}
          hashtagInput={hashtagInput}
          onHashtagInputChange={setHashtagInput}
          onAddHashtag={handleAddHashtag}
          onRemoveHashtag={handleRemoveHashtag}
          onHashtagKeyDown={handleHashtagKeyDown}
          onBack={() => setCurrentStep(1)}
          onNext={() => void goNextFromStep2()}
        />

        <AdvertisementTargetingStep
          form={form}
          onBack={() => setCurrentStep(2)}
          onNext={() => setCurrentStep(4)}
        />

        <AdvertisementReviewStep
          form={form}
          imagePreviews={imagePreviews}
          hashtags={hashtags}
          mode={mode}
          isSubmitting={isSubmitting}
          onBack={() => setCurrentStep(3)}
        />
      </Tabs>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}
    </form>
  );
}
