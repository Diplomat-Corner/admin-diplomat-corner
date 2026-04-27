import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdvertisementFormStepCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  footerClassName?: string;
};

export function AdvertisementFormStepCard({
  title,
  description,
  children,
  footer,
  footerClassName,
}: AdvertisementFormStepCardProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-md">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-diplomat-green">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
      <CardFooter
        className={
          footerClassName ??
          "flex flex-col-reverse gap-3 border-t bg-muted/20 sm:flex-row sm:justify-between"
        }
      >
        {footer}
      </CardFooter>
    </Card>
  );
}
