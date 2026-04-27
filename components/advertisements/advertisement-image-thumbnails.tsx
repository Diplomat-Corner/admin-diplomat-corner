import Image from "next/image";
import { cn } from "@/lib/utils";

type AdvertisementImageThumbnailsProps = {
  urls: string[];
  onRemoveAt?: (index: number) => void;
  size?: "sm" | "md";
};

const sizeClass = {
  sm: "h-20 w-20",
  md: "h-28 w-28",
} as const;

const pixel = { sm: 80, md: 112 } as const;

export function AdvertisementImageThumbnails({
  urls,
  onRemoveAt,
  size = "sm",
}: AdvertisementImageThumbnailsProps) {
  const d = pixel[size];
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          className={cn(
            "group/thumb relative",
            sizeClass[size]
          )}
        >
          <Image
            src={src}
            alt=""
            width={d}
            height={d}
            className="h-full w-full rounded-md object-cover"
            unoptimized={src.startsWith("blob:")}
          />
          {onRemoveAt && (
            <button
              type="button"
              onClick={() => onRemoveAt(idx)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground opacity-0 transition-opacity group-hover/thumb:opacity-100"
              aria-label="Remove image"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
