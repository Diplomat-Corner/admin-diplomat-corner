"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Thread = {
  _id: string;
  category: "Contact Us" | "Car Inquiry" | "General Support" | string;
  subject: string;
  status: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantEmail?: string;
  participantPhone?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  adminUnreadCount?: number;
};

type ThreadMessage = {
  _id: string;
  senderRole: "admin" | "client";
  body: string;
  createdAt: string;
};

export default function MessagesPage() {
  const [category, setCategory] = useState("All");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchThreads = async () => {
    setLoading(true);
    const qs =
      category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`/api/messages/threads${qs}`);
    const data = await res.json();
    setThreads(Array.isArray(data?.data) ? data.data : []);
    setLoading(false);
  };

  const fetchMessages = async (threadId: string) => {
    const res = await fetch(`/api/messages/threads/${threadId}/messages`);
    const data = await res.json();
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
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

  const selectedClientLabel = useMemo(() => {
    if (!selectedThread) return "";
    return `${selectedThread.participantFirstName || ""} ${
      selectedThread.participantLastName || ""
    }`.trim();
  }, [selectedThread]);

  return (
    <div className="main-content p-4 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-bold text-diplomat-green">Messages</h1>
        <Button variant="outline" onClick={() => void fetchThreads()}>
          Refresh
        </Button>
      </div>

      <Tabs value={category} onValueChange={setCategory} className="mb-4">
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Contact Us">Contact Us</TabsTrigger>
          <TabsTrigger value="Car Inquiry">Car Inquiry</TabsTrigger>
          <TabsTrigger value="General Support">General Support</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg bg-white">
          <div className="p-3 border-b font-medium">Threads</div>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                No threads available.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread._id}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                    selectedThread?._id === thread._id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedThread(thread);
                    void fetchMessages(thread._id);
                  }}
                >
                  <div className="text-xs text-muted-foreground">
                    {thread.category}
                  </div>
                  <div className="font-medium">{thread.subject}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {thread.lastMessageText || "No messages yet"}
                  </div>
                  {(thread.adminUnreadCount ?? 0) > 0 && (
                    <span className="inline-block mt-2 text-xs bg-primary text-white rounded-full px-2 py-1">
                      {thread.adminUnreadCount} unread
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 border rounded-lg bg-white flex flex-col min-h-[70vh]">
          <div className="p-3 border-b">
            <div className="font-medium">
              {selectedThread ? selectedThread.subject : "Select a thread"}
            </div>
            {selectedThread && (
              <div className="text-sm text-muted-foreground mt-1">
                {selectedClientLabel || "Unknown user"}
                {selectedThread.participantEmail
                  ? ` • ${selectedThread.participantEmail}`
                  : ""}
                {selectedThread.participantPhone
                  ? ` • ${selectedThread.participantPhone}`
                  : ""}
              </div>
            )}
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {selectedThread ? (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderRole === "admin"
                      ? "ml-auto bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div>{msg.body}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a thread to read and reply.
              </div>
            )}
          </div>
          {selectedThread && (
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Reply to this thread..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button onClick={handleReply}>Reply</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
