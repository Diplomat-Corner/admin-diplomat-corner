"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatColumn } from "./_components/chat-column";
import {
  filterThreadsBySearch,
  filterThreadsForInbox,
  normalizeMessageFromApi,
  normalizeThreadFromApi,
} from "./_components/format";
import { InboxSidebar } from "./_components/inbox-sidebar";
import { ThreadDetailsPanel } from "./_components/thread-details-panel";
import type { InboxTab, Thread, ThreadMessage } from "./_components/types";

export default function MessagesPage() {
  const [category, setCategory] = useState("All");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [activeThreadDetail, setActiveThreadDetail] = useState<Thread | null>(
    null
  );
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inboxTab, setInboxTab] = useState<InboxTab>("all");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    const qs =
      category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`/api/messages/threads${qs}`);
    const data = await res.json();
    const raw = Array.isArray(data?.data) ? data.data : [];
    const normalized = raw
      .map((row: unknown) => normalizeThreadFromApi(row))
      .filter((t): t is Thread => t != null);
    setThreads(normalized);
    setLoading(false);
  };

  const fetchMessages = async (threadId: string) => {
    const res = await fetch(`/api/messages/threads/${threadId}/messages`);
    const data = await res.json();
    const rawMsgs = Array.isArray(data?.messages) ? data.messages : [];
    setMessages(
      rawMsgs
        .map((m: unknown) => normalizeMessageFromApi(m))
        .filter((m): m is ThreadMessage => m != null)
    );
    const full = normalizeThreadFromApi(data?.thread);
    setActiveThreadDetail(full);
    if (full) {
      setThreads((prev) =>
        prev.map((t) => (t._id === full._id ? { ...t, ...full } : t))
      );
    }
    await fetch(`/api/messages/threads/${threadId}/read`, { method: "PATCH" });
    setThreads((prev) =>
      prev.map((t) => (t._id === threadId ? { ...t, adminUnreadCount: 0 } : t))
    );
  };

  useEffect(() => {
    void fetchThreads();
  }, [category]);

  const handleReply = async () => {
    if (!selectedThread || !reply.trim()) return;
    await fetch(`/api/messages/threads/${selectedThread._id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    setReply("");
    await fetchMessages(selectedThread._id);
    await fetchThreads();
  };

  const displayedThreads = useMemo(() => {
    const step1 = filterThreadsForInbox(threads, inboxTab, "admin");
    return filterThreadsBySearch(step1, search);
  }, [threads, inboxTab, search]);

  const mergedThread = useMemo((): Thread | null => {
    if (!selectedThread) return null;
    if (!activeThreadDetail || activeThreadDetail._id !== selectedThread._id) {
      return selectedThread;
    }
    return { ...selectedThread, ...activeThreadDetail };
  }, [selectedThread, activeThreadDetail]);

  const selectThread = (t: Thread) => {
    setSelectedThread(t);
    setActiveThreadDetail(null);
    void fetchMessages(t._id);
  };

  return (
    <div className="main-content flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-diplomat-green md:text-3xl">
            Messages
          </h1>
          <Button variant="outline" size="sm" onClick={() => void fetchThreads()}>
            Refresh
          </Button>
        </div>
        <Tabs value={category} onValueChange={setCategory} className="mt-3">
          <TabsList className="h-9 w-full flex-wrap justify-start gap-1 md:w-auto">
            <TabsTrigger value="All" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="Contact Us" className="text-xs">
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="Car Inquiry" className="text-xs">
              Car Inquiry
            </TabsTrigger>
            <TabsTrigger value="General Support" className="text-xs">
              General Support
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(200px,34vh)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-[minmax(240px,300px)_1fr] lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_minmax(260px,320px)]">
        <div className="min-h-0 border-b border-border md:border-b-0">
          <InboxSidebar
            threads={displayedThreads}
            selectedId={selectedThread?._id ?? null}
            onSelect={selectThread}
            loading={loading}
            emptyLabel="No threads match your filters."
            search={search}
            onSearchChange={setSearch}
            inboxTab={inboxTab}
            onInboxTabChange={setInboxTab}
          />
        </div>

        <div className="min-h-0">
          <ChatColumn
            thread={mergedThread}
            messages={messages}
            reply={reply}
            onReplyChange={setReply}
            onSend={() => void handleReply()}
            outgoingRole="admin"
            onOpenDetails={() => setDetailsOpen(true)}
          />
        </div>

        <div className="hidden min-h-0 lg:block">
          <ThreadDetailsPanel thread={mergedThread} />
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-md lg:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Contact details</DialogTitle>
          </DialogHeader>
          <ThreadDetailsPanel thread={mergedThread} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
