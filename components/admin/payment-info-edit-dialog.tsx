"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const empty = {
  title: "",
  description: "",
  feeDisplay: "",
  descriptionSuffix: "",
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
};

export function PaymentInfoEditButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-info", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to load");
      }
      const data = await res.json();
      const p = data?.paymentInfo;
      if (p && typeof p === "object") {
        setForm({
          title: String(p.title ?? ""),
          description: String(p.description ?? ""),
          feeDisplay: String(p.feeDisplay ?? ""),
          descriptionSuffix: String(p.descriptionSuffix ?? ""),
          bankName: String(p.bankName ?? ""),
          accountNumber: String(p.accountNumber ?? ""),
          accountHolderName: String(p.accountHolderName ?? ""),
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      toast.success("Payment information saved");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Settings2 className="h-4 w-4" />
        Payment details
      </Button>
      <DialogContent className="max-w-2xl max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client payment information</DialogTitle>
          <DialogDescription>
            Shown to users in manage listing flows. One document is stored; changes apply site-wide.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-diplomat-green" />
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pi-title">Title</Label>
              <Input
                id="pi-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pi-desc">Text before fee (highlighted)</Label>
                <Textarea
                  id="pi-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pi-fee">Fee (highlighted, e.g. 3000 ETB)</Label>
                <Input
                  id="pi-fee"
                  value={form.feeDisplay}
                  onChange={(e) => setForm((f) => ({ ...f, feeDisplay: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pi-suff">Text after the fee</Label>
              <Textarea
                id="pi-suff"
                rows={2}
                value={form.descriptionSuffix}
                onChange={(e) => setForm((f) => ({ ...f, descriptionSuffix: e.target.value }))}
                placeholder=" through our account below:"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pi-bank">Payment method (bank name)</Label>
              <Input
                id="pi-bank"
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pi-acct">Account number</Label>
              <Input
                id="pi-acct"
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pi-hold">Account holder name</Label>
              <Input
                id="pi-hold"
                value={form.accountHolderName}
                onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-diplomat-green hover:bg-diplomat-green/90"
            onClick={() => void save()}
            disabled={loading || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
