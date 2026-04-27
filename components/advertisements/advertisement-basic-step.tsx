import type { UseFormReturn } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import type { AdvertisementFormValues } from "./advertisement-form-schema";
import { AdvertisementFormStepCard } from "./advertisement-form-step-card";

type AdvertisementBasicStepProps = {
  form: UseFormReturn<AdvertisementFormValues>;
  onCancel: () => void;
  onNext: () => void;
};

export function AdvertisementBasicStep({
  form,
  onCancel,
  onNext,
}: AdvertisementBasicStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  return (
    <TabsContent value="1">
      <AdvertisementFormStepCard
        title="Basic Information"
        description="Title, description, and where this ad appears on the site"
        footerClassName="flex flex-col-reverse gap-3 border-t bg-muted/20 sm:flex-row sm:justify-between sm:gap-0"
        footer={
          <>
            <Button
              variant="outline"
              onClick={onCancel}
              type="button"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onNext}
              className="w-full bg-diplomat-green hover:bg-diplomat-green/90 sm:w-auto"
            >
              Next: Appearance
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter advertisement title"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter advertisement description"
              className="min-h-[100px]"
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Advertisement Type</Label>
            <Select
              value={watch("advertisementType")}
              onValueChange={(value) =>
                setValue(
                  "advertisementType",
                  value as AdvertisementFormValues["advertisementType"],
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carousel">Carousel (hero)</SelectItem>
                <SelectItem value="normal">Normal (two tiles)</SelectItem>
                <SelectItem value="banner">Banner (full-width)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdvertisementFormStepCard>
    </TabsContent>
  );
}
