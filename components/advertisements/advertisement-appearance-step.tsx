import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, Hash, Link2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import type { AdvertisementFormValues } from "./advertisement-form-schema";
import { AdvertisementFormStepCard } from "./advertisement-form-step-card";
import { AdvertisementImageThumbnails } from "./advertisement-image-thumbnails";

type AdvertisementAppearanceStepProps = {
  form: UseFormReturn<AdvertisementFormValues>;
  placement: AdvertisementFormValues["advertisementType"];
  imagePreviews: string[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  uploadError: string | null;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  onRemoveImage: (index: number) => void;
  hashtags: string[];
  hashtagInput: string;
  onHashtagInputChange: (value: string) => void;
  onAddHashtag: () => void;
  onRemoveHashtag: (tag: string) => void;
  onHashtagKeyDown: (e: KeyboardEvent) => void;
  onBack: () => void;
  onNext: () => void;
};

export function AdvertisementAppearanceStep({
  form,
  placement,
  imagePreviews,
  fileInputRef,
  isUploading,
  uploadError,
  onFileChange,
  onOpenPicker,
  onRemoveImage,
  hashtags,
  hashtagInput,
  onHashtagInputChange,
  onAddHashtag,
  onRemoveHashtag,
  onHashtagKeyDown,
  onBack,
  onNext,
}: AdvertisementAppearanceStepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  const allowMultiple = placement === "carousel";

  return (
    <TabsContent value="2">
      <AdvertisementFormStepCard
        title="Appearance"
        description="Images, destination link, and optional hashtags"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={onNext}
              className="w-full bg-diplomat-green hover:bg-diplomat-green/90 sm:w-auto"
            >
              Next: Targeting
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Advertisement images</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {allowMultiple
                ? "Carousel: you can select several images at once from the file picker."
                : "Normal and banner use a single image per upload; pick one file at a time."}
            </p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start">
              <Input
                key={allowMultiple ? "carousel-multi" : "single-file"}
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
                {...(allowMultiple ? { multiple: true } : {})}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onOpenPicker}
                disabled={isUploading}
                className="shrink-0"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {allowMultiple ? "Upload images" : "Upload image"}
                  </>
                )}
              </Button>
              <AdvertisementImageThumbnails
                urls={imagePreviews}
                onRemoveAt={onRemoveImage}
                size="sm"
              />
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-500">{uploadError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="link">Destination URL</Label>
            <div className="flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Input
                id="link"
                {...register("link")}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            {errors.link && (
              <p className="text-sm text-red-500">{errors.link.message}</p>
            )}
          </div>

          <div>
            <Label>Hashtags</Label>
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <Input
                value={hashtagInput}
                onChange={(e) => onHashtagInputChange(e.target.value)}
                onKeyDown={onHashtagKeyDown}
                placeholder="Add hashtags"
              />
              <Button type="button" variant="outline" onClick={onAddHashtag}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => onRemoveHashtag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </AdvertisementFormStepCard>
    </TabsContent>
  );
}
