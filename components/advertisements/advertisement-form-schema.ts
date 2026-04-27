import { z } from "zod";

export const advertisementFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  targetAudience: z.string().optional(),
  advertisementType: z.enum(["carousel", "normal", "banner"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Draft"]),
  priority: z.enum(["High", "Medium", "Low"]),
  performanceMetrics: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  link: z.string().refine((s) => s === "" || /^https?:\/\/.+/i.test(s), {
    message: "Please enter a valid URL (https://…)",
  }),
  imageUrls: z.array(z.string()),
});

export type AdvertisementFormValues = z.infer<typeof advertisementFormSchema>;

export function validateAdvertisementBeforeSubmit(
  data: AdvertisementFormValues
): string | null {
  const link = data.link?.trim() ?? "";
  if (!link) return "Please add a destination URL in the Appearance step.";
  if (!URL.canParse(link)) {
    return "Please enter a valid destination URL.";
  }
  if (data.imageUrls.length < 1) {
    return "Add at least one image in the Appearance step.";
  }
  if (data.advertisementType === "carousel" && data.imageUrls.length < 2) {
    return "Carousel placements need at least two images.";
  }
  return null;
}

export const ADVERTISEMENT_WIZARD_STEPS = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Appearance" },
  { id: 3, name: "Targeting" },
  { id: 4, name: "Review" },
] as const;
