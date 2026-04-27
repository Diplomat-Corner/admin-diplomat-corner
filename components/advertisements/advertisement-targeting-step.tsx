import type { UseFormReturn } from "react-hook-form";
import { ArrowLeft, ArrowRight, BarChart3, CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type AdvertisementTargetingStepProps = {
  form: UseFormReturn<AdvertisementFormValues>;
  onBack: () => void;
  onNext: () => void;
};

export function AdvertisementTargetingStep({
  form,
  onBack,
  onNext,
}: AdvertisementTargetingStepProps) {
  const { register, watch, setValue } = form;

  return (
    <TabsContent value="3">
      <AdvertisementFormStepCard
        title="Targeting & schedule"
        description="Audience, dates, priority, and performance notes"
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
              Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                id="targetAudience"
                {...register("targetAudience")}
                placeholder="Define your target audience"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" {...register("startTime")} />
              </div>
            </div>
            <div>
              <Label>End Date</Label>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" {...register("endTime")} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="publication-status">Publication status</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose Draft, Inactive, or Active. When Active, the live state is
              Scheduled (before start), Active (in window), or Expired (after
              end) based on the schedule.
            </p>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue(
                  "status",
                  value as AdvertisementFormValues["status"],
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger id="publication-status" className="mt-2 max-w-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active (eligible to run)</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <RadioGroup
              value={watch("priority")}
              onValueChange={(value) =>
                setValue("priority", value as "High" | "Medium" | "Low")
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="High" id="high" />
                <Label htmlFor="high">High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medium" id="medium" />
                <Label htmlFor="medium">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Low" id="low" />
                <Label htmlFor="low">Low</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Performance Goals</Label>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <Textarea
                {...register("performanceMetrics")}
                placeholder="Define your performance goals"
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </AdvertisementFormStepCard>
    </TabsContent>
  );
}
