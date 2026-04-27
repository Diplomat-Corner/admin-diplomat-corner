"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, Download, Loader2 } from "lucide-react";
import { useAdminCheck } from "@/lib/hooks/use-admin-check";

type BackupRow = {
  id?: string;
  createdAt?: string;
  clerkId?: string;
  filename?: string;
  sizeBytes?: number;
  status?: string;
};

function pickFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*\s*=\s*UTF-8''([^;\s]+)/i.exec(header);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/"/g, "").trim());
    } catch {
      return star[1].replace(/"/g, "").trim();
    }
  }
  const quoted = /filename\*\s*=\s*"([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename\*\s*=\s*([^;\s]+)/i.exec(header);
  if (plain?.[1]) return plain[1].replace(/"/g, "").trim();
  return null;
}

function formatSize(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function BackupPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<BackupRow[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!isAdmin) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch("/api/admin/backups?limit=100", { cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const list: BackupRow[] = Array.isArray(data.backups) ? data.backups : [];
      setHistory(list);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Failed to load history");
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (adminLoading || !isAdmin) return;
    void loadHistory();
  }, [adminLoading, isAdmin, loadHistory]);

  useEffect(() => {
    if (!downloading) {
      return;
    }
    const t0 = Date.now();
    const id = setInterval(() => {
      const sec = (Date.now() - t0) / 1000;
      setProgress((p) => Math.max(p, Math.min(90, 90 * (1 - Math.exp(-sec / 40)))));
    }, 250);
    return () => clearInterval(id);
  }, [downloading]);

  const download = async () => {
    setError(null);
    setProgress(0);
    setDownloading(true);
    let ok = false;
    try {
      const res = await fetch("/api/admin/backup", { method: "GET", cache: "no-store" });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      setProgress(100);
      const blob = await res.blob();
      const filename =
        pickFilenameFromContentDisposition(res.headers.get("content-disposition")) ||
        "diplomat-backup.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      ok = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      if (ok) {
        await new Promise((r) => setTimeout(r, 500));
        void loadHistory();
      }
      setDownloading(false);
      setProgress(0);
    }
  };

  if (adminLoading) {
    return (
      <div className="main-content flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-diplomat-green" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const displayPct = Math.min(100, Math.round(progress));

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Archive className="h-8 w-8 text-diplomat-green" />
        <div>
          <h1 className="text-2xl font-bold">Backup</h1>
          <p className="text-sm text-muted-foreground">Download a full site backup as a single ZIP</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual export</CardTitle>
          <CardDescription className="space-y-2 text-sm text-muted-foreground">
            <p>
              The archive includes a JSON array per collection under <code className="rounded bg-muted px-1 py-0.5 text-xs">database/*.json</code>{" "}
              (Extended JSON, suitable for import tools or a script), plus cars, houses, ads, and payments. Each completed download is stored in Mongo as backup history.
            </p>
            
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {downloading ? (
            <div className="space-y-2 w-full max-w-md">
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={displayPct}
                aria-label="Backup preparation progress"
              >
                <div
                  className="h-full bg-diplomat-green transition-[width] duration-200 ease-out"
                  style={{ width: `${displayPct}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">Preparing backup {displayPct}%</p>
            </div>
          ) : null}
          <Button onClick={download} disabled={downloading} className="gap-2">
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing backup
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup history</CardTitle>
          <CardDescription>Record from the <code className="text-xs">backupHistory</code> collection after each successful export</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : historyError ? (
            <p className="text-sm text-destructive">{historyError}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time (UTC / local shown)</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Admin (Clerk)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">
                        No backups yet — run a download above to create the first entry
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((row) => {
                      const k = row.id || row.filename || "row";
                      return (
                        <TableRow key={k}>
                          <TableCell className="whitespace-nowrap text-sm">{formatTime(row.createdAt)}</TableCell>
                          <TableCell className="max-w-[220px] truncate font-mono text-xs">{row.filename || "—"}</TableCell>
                          <TableCell className="text-sm">{formatSize(row.sizeBytes)}</TableCell>
                          <TableCell className="max-w-[180px] truncate font-mono text-xs text-muted-foreground">
                            {row.clerkId || "—"}
                          </TableCell>
                          <TableCell className="text-sm">{row.status || "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
