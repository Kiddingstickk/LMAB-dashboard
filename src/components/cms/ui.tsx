import type { ReactNode } from "react";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs",
        active ? "border-primary/30 text-primary" : "text-muted-foreground",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode | undefined }) {
  return (
    <div className="rounded-md border border-dashed p-12 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode | undefined }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, busy }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: string | undefined; onConfirm: () => void; busy?: boolean | undefined;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Field({ label, error, children, className }: { label: string; error?: string | undefined; children: ReactNode; className?: string | undefined }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}


export function ImageField({
  value,
  onChange,
  error,
  bucket = "product-images",
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  bucket?: "product-images" | "event-images";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file?: File) {
    if (!file) return;

    setUploadError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be 8 MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field label="Upload image" error={error || uploadError}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => uploadFile(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-5 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border"
        }`}
      >
        {value ? (
          <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-md border bg-muted">
            <img
              src={value}
              alt="Uploaded image preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium">
            {value ? "Image selected" : "Drop an image here"}
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP · Maximum 8 MB
          </p>
        </div>

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-sm border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {uploading ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            value ? "Replace image" : "Browse files"
          )}
        </button>
      </div>
    </Field>
  );
}
