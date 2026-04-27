import type { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { computeAdvertisementEffectiveStatus } from "@/lib/models/advertisement.types";
import type { AdvertisementFormValues } from "./advertisement-form-schema";
import { AdvertisementFormStepCard } from "./advertisement-form-step-card";
import { AdvertisementImageThumbnails } from "./advertisement-image-thumbnails";

function formatOptionalDate(value: string | undefined): string {
  if (!value || typeof value !== "string" || value.length === 0) {
    return "Not set";
  }
  try {
    return format(new Date(value), "PPP 'at' p");
  } catch {
    return "Not set";
  }
}

type AdvertisementReviewStepProps = {
  form: UseFormReturn<AdvertisementFormValues>;
  imagePreviews: string[];
  hashtags: string[];
  mode: "create" | "edit";
  isSubmitting: boolean;
  onBack: () => void;
};

export function AdvertisementReviewStep({
  form,
  imagePreviews,
  hashtags,
  mode,
  isSubmitting,
  onBack,
}: AdvertisementReviewStepProps) {
  const { watch } = form;
  const previewEffective = computeAdvertisementEffectiveStatus({
    status: watch("status"),
    startTime: watch("startTime"),
    endTime: watch("endTime"),
  });

  return (
    <TabsContent value="4">
      <AdvertisementFormStepCard
        title="Review & submit"
        description="Confirm everything looks correct, then create or save"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-diplomat-green hover:bg-diplomat-green/90 sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : mode === "create" ? (
                "Create Advertisement"
              ) : (
                "Save Changes"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Basic Information</h3>
            <div className="mt-2 space-y-2">
              <p>
                <span className="font-medium">Title:</span> {watch("title")}
              </p>
              <p>
                <span className="font-medium">Type:</span>{" "}
                {watch("advertisementType")}
              </p>
              <p>
                <span className="font-medium">Description:</span>{" "}
                {watch("description")}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Appearance</h3>
            <div className="mt-2 space-y-2">
              {imagePreviews.length > 0 && (
                <AdvertisementImageThumbnails
                  urls={imagePreviews}
                  size="md"
                />
              )}
              <p>
                <span className="font-medium">Link:</span> {watch("link")}
              </p>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Targeting & Schedule</h3>
            <div className="mt-2 space-y-2">
              <p>
                <span className="font-medium">Target Audience:</span>{" "}
                {watch("targetAudience")}
              </p>
              <p>
                <span className="font-medium">Start Date:</span>{" "}
                {formatOptionalDate(watch("startTime"))}
              </p>
              <p>
                <span className="font-medium">End Date:</span>{" "}
                {formatOptionalDate(watch("endTime"))}
              </p>
              <p>
                <span className="font-medium">Priority:</span>{" "}
                {watch("priority")}
              </p>
              <p>
                <span className="font-medium">Publication:</span>{" "}
                {watch("status")}
              </p>
              <p>
                <span className="font-medium">Live state (preview):</span>{" "}
                {previewEffective}
              </p>
            </div>
          </div>
        </div>
      </AdvertisementFormStepCard>
    </TabsContent>
  );
}
