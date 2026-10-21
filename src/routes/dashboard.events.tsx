import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/cms/DataTable";
import { EventForm } from "@/components/cms/EventForm";
import { ConfirmDialog, EmptyState, Modal, PageHeader, StatusBadge } from "@/components/cms/ui";
import { useCrud } from "@/components/cms/useCrud";
import { createEvent, deleteEvent, getEvents, updateEvent } from "@/lib/cms/api";
import { formatDate, formatINR } from "@/lib/cms/format";
import type { StudioEvent } from "@/lib/cms/types";

export const Route = createFileRoute("/dashboard/events")({
  head: () => ({
    meta: [
      { title: "Events & Sessions — Let's Make a Buy Admin" },
      { name: "description", content: "Schedule and manage studio workshops and sessions." },
      { property: "og:title", content: "Events & Sessions — Let's Make a Buy Admin" },
      { property: "og:description", content: "Schedule and manage studio workshops and sessions." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { query, create, update, remove } = useCrud({ key: "events", label: "Event", list: getEvents, create: createEvent, update: updateEvent, remove: deleteEvent });
  const [editing, setEditing] = useState<StudioEvent | "new" | null>(null);
  const [deleting, setDeleting] = useState<StudioEvent | null>(null);
  const rows = [...(query.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));

  const columns: Column<StudioEvent>[] = [
    { header: "Image", cell: (e) => (
      <div className="h-11 w-11 overflow-hidden rounded-sm border bg-muted">
        {e.image && <img src={e.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
      </div>
    ) },
    { header: "Event", cell: (e) => <span className="font-medium">{e.title}</span> },
    { header: "Date", cell: (e) => formatDate(e.date) },
    { header: "Time", cell: (e) => <span className="text-muted-foreground">{e.startTime}–{e.endTime}</span> },
    { header: "Location", cell: (e) => <span className="text-muted-foreground">{e.location}</span> },
    { header: "Price", cell: (e) => formatINR(e.price) },
    { header: "Status", cell: (e) => (
      <div className="flex items-center gap-3">
        <Switch checked={e.active} onCheckedChange={(c) => update.mutate({ id: e.id, patch: { active: c } })} aria-label="Toggle active" />
        <StatusBadge active={e.active} />
      </div>
    ) },
    { header: "Actions", className: "text-right", cell: (e) => (
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(e)}>Edit</Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(e)}>Delete</Button>
      </div>
    ) },
  ];

  const addBtn = <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add Event</Button>;
  const current = editing && editing !== "new" ? editing : undefined;

  return (
    <>
      <PageHeader title="Events & Sessions" subtitle="Workshops and sessions at the studio." action={addBtn} />
      {query.isError ? (
        <EmptyState title="Couldn't load events" text="Please try again." action={<Button variant="outline" onClick={() => query.refetch()}>Retry</Button>} />
      ) : !query.isLoading && rows.length === 0 ? (
        <EmptyState title="No events yet" text="Schedule your first workshop or session." action={addBtn} />
      ) : (
        <DataTable columns={columns} rows={rows} loading={query.isLoading} />
      )}

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={current ? "Edit event" : "Add event"}>
        {editing && (
          <EventForm
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
        title="Delete this event?"
        description={deleting ? `"${deleting.title}" will be removed permanently.` : undefined}
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
