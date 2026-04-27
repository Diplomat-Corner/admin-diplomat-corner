"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvertisementForm } from "@/components/advertisements/advertisement-form";

export default function CreateAdvertisementPage() {
  return (
    <div className="main-content space-y-6 p-4 md:p-8">
      <header className="mx-auto flex w-full max-w-4xl items-start gap-3">
        <Link href="/advertisements" className="shrink-0 pt-1">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-diplomat-green">
            Create advertisement
          </h1>
          <p className="text-sm text-muted-foreground">
            Walk through basic info, images and link, targeting, then review
            before publishing.
          </p>
        </div>
      </header>
      <AdvertisementForm mode="create" />
    </div>
  );
}
