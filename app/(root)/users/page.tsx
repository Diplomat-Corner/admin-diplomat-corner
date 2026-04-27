"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminCheck } from "@/lib/hooks/use-admin-check";

type UserRow = {
  _id?: { $oid?: string } | string;
  clerkId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  timestamp?: string;
  createdAt?: string;
};

function formatJoined(u: UserRow): string {
  const raw = u.timestamp || u.createdAt;
  if (!raw) return "—";
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function UsersPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminLoading || !isAdmin) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/users?limit=500", { cache: "no-store" });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const list: UserRow[] = Array.isArray(data.users) ? data.users : [];
        setRows(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load users");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, adminLoading]);

  if (adminLoading) {
    return (
      <div className="main-content flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-diplomat-green" />
      </div>
    );
  }

  return (
    <div className="main-content space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-diplomat-green" />
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">
            MongoDB user records synced from Clerk
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>Email, name, role, and join date</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading users…
            </div>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="font-mono text-xs">Clerk ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((u) => {
                      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                      return (
                        <TableRow key={String(u.clerkId || u._id || Math.random())}>
                          <TableCell>{u.email || "—"}</TableCell>
                          <TableCell>{name}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                              {u.role || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatJoined(u)}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {u.clerkId || "—"}
                          </TableCell>
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
