"use client";

import { useState } from "react";
import { ExternalLink, Mail, Phone, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Thread } from "./types";
import {
  asCarInquiryMeta,
  messageTimeLabel,
  statusPillLabel,
  threadDisplayName,
  threadInitials,
} from "./format";

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

export function ThreadDetailsPanel(props: { thread: Thread | null }) {
  const t = props.thread;
  const [tab, setTab] = useState("profile");

  if (!t) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center border-l border-border bg-muted/20 p-4">
        <p className="text-center text-sm text-muted-foreground">
          Select a thread to view contact details and timeline.
        </p>
      </div>
    );
  }

  const car = asCarInquiryMeta(t.meta);
  const contactPhone = t.participantPhone ?? car?.inquirerPhone;
  const contactEmail = t.participantEmail ?? car?.inquirerEmail;

  const timelineItems: { title: string; body: string; at?: string }[] = [];
  if (t.createdAt) {
    timelineItems.push({
      title: "Thread created",
      body: "New support conversation opened.",
      at: t.createdAt,
    });
  }
  if (car?.listingLink) {
    timelineItems.push({
      title: "Listing inquiry",
      body: car.listingId ? `Listing ID: ${car.listingId}` : "Car inquiry",
      at: t.createdAt,
    });
  }
  if (t.lastMessageAt) {
    timelineItems.push({
      title: "Latest message",
      body: t.lastMessageText || "—",
      at: t.lastMessageAt,
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-muted/20">
      <div className="shrink-0 space-y-4 border-b border-border p-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-lg font-medium text-primary">
            {threadInitials(t)}
          </div>
          <h3 className="mt-3 font-semibold">{threadDisplayName(t)}</h3>
          {(contactPhone || contactEmail) && (
            <div className="mt-2 w-full space-y-1 text-xs text-muted-foreground">
              {contactPhone && (
                <p className="flex items-center justify-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0" />
                  <a href={`tel:${contactPhone}`} className="break-all text-primary underline-offset-4 hover:underline">
                    {contactPhone}
                  </a>
                </p>
              )}
              {contactEmail && (
                <p className="flex items-center justify-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="break-all text-primary underline-offset-4 hover:underline"
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge className="font-normal">{statusPillLabel(t.status, t.category)}</Badge>
            <span className="text-xs text-muted-foreground">{t.category}</span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-2 mt-2 grid h-9 w-auto grid-cols-5 rounded-lg bg-muted/80 p-0.5">
          <TabsTrigger value="profile" className="text-[10px] px-1">
            Profile
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-[10px] px-1">
            Insights
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-[10px] px-1">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="team" className="text-[10px] px-1">
            Team
          </TabsTrigger>
          <TabsTrigger value="calls" className="text-[10px] px-1">
            Calls
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="profile" className="m-0 space-y-4 p-4">
            <div className="space-y-3 rounded-xl border border-border bg-background p-3">
              {contactPhone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground">Phone</p>
                    <CopyField value={contactPhone} label="phone" />
                  </div>
                </div>
              )}
              {contactEmail && (
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground">Email</p>
                    <CopyField value={contactEmail} label="email" />
                  </div>
                </div>
              )}
              {!contactPhone && !contactEmail && (
                <p className="text-xs text-muted-foreground">No contact details on file.</p>
              )}
            </div>
            {car && (
              <div className="space-y-2 rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-medium">Inquiry</p>
                {car.inquirerName && (
                  <p className="text-xs text-muted-foreground">From: {car.inquirerName}</p>
                )}
                {car.listerName && (
                  <p className="text-xs text-muted-foreground">Seller: {car.listerName}</p>
                )}
                {car.listingLink && (
                  <a
                    href={car.listingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    View listing
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="m-0 p-4">
            <p className="text-xs text-muted-foreground">
              Metrics and engagement insights will appear here when available.
            </p>
          </TabsContent>

          <TabsContent value="timeline" className="m-0 p-4">
            <ul className="space-y-0">
              {timelineItems.map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    {i < timelineItems.length - 1 && (
                      <span className="w-px flex-1 min-h-[24px] bg-border" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-xs font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
                    {item.at && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {messageTimeLabel(item.at)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {timelineItems.length === 0 && (
              <p className="text-xs text-muted-foreground">No timeline events yet.</p>
            )}
          </TabsContent>

          <TabsContent value="team" className="m-0 p-4">
            <p className="text-xs text-muted-foreground">Team assignments — coming soon.</p>
          </TabsContent>

          <TabsContent value="calls" className="m-0 p-4">
            <p className="text-xs text-muted-foreground">Call history — coming soon.</p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
