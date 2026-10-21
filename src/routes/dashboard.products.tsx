import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/cms/DataTable";
import { ProductForm } from "@/components/cms/ProductForm";
import { ConfirmDialog, EmptyState, Modal, PageHeader, StatusBadge } from "@/components/cms/ui";
import { useCrud } from "@/components/cms/useCrud";
import { createProduct, deleteProduct, getProducts, updateProduct } from "@/lib/cms/api";
import { formatINR } from "@/lib/cms/format";
import type { Product } from "@/lib/cms/types";

export const Route = createFileRoute("/dashboard/products")({
  head: () => ({
    meta: [
      { title: "Products — Let's Make a Buy Admin" },
      { name: "description", content: "Add, edit and manage handmade products." },
      { property: "og:title", content: "Products — Let's Make a Buy Admin" },
      { property: "og:description", content: "Add, edit and manage handmade products." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { query, create, update, remove } = useCrud({ key: "products", label: "Product", list: getProducts, create: createProduct, update: updateProduct, remove: deleteProduct });
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const rows = query.data ?? [];

  const columns: Column<Product>[] = [
    { header: "Image", cell: (p) => <Thumb src={p.image} /> },
    { header: "Name", cell: (p) => <span className="font-medium">{p.name}</span> },
    { header: "Category", cell: (p) => <span className="text-muted-foreground">{p.category}</span> },
    { header: "Price", cell: (p) => formatINR(p.price) },
    { header: "Stock", cell: (p) => <span className={p.stock === 0 ? "text-destructive" : ""}>{p.stock}</span> },
    {
      header: "Status",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Switch checked={p.active} onCheckedChange={(c) => update.mutate({ id: p.id, patch: { active: c } })} aria-label="Toggle active" />
          <StatusBadge active={p.active} />
        </div>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(p)}>Delete</Button>
        </div>
      ),
    },
  ];

  const addBtn = <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add Product</Button>;
  const current = editing && editing !== "new" ? editing : undefined;

  return (
    <>
      <PageHeader title="Products" subtitle="Handmade goods listed in the shop." action={addBtn} />
      {query.isError ? (
        <EmptyState title="Couldn't load products" text="Please try again." action={<Button variant="outline" onClick={() => query.refetch()}>Retry</Button>} />
      ) : !query.isLoading && rows.length === 0 ? (
        <EmptyState title="No products yet" text="Add your first handmade product." action={addBtn} />
      ) : (
        <DataTable columns={columns} rows={rows} loading={query.isLoading} />
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={current ? "Edit product" : "Add product"}>
        {editing && (
          <ProductForm
            key={current?.id ?? "new"}
            initial={current ? (({ id: _id, ...rest }) => rest)(current) : undefined}
            busy={create.isPending || update.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              const opts = { onSuccess: () => setEditing(null) };
              if (current) update.mutate({ id: current.id, patch: v }, opts);
              else create.mutate(v, opts);
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this product?"
        description={deleting ? `"${deleting.name}" will be removed permanently.` : undefined}
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

export function Thumb({ src }: { src: string }) {
  return (
    <div className="h-11 w-11 overflow-hidden rounded-sm border bg-muted">
      {src && <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />}
    </div>
  );
}
