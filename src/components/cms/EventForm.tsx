
import { useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/cms/format";
import type {
  EventInput,
  EventScheduleItem,
} from "@/lib/cms/types";
import { Field, ImageField } from "./ui";

const schema: z.ZodType<EventInput> = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
    description: z.string().max(2000),
    date: z.string().min(1, "Start date is required"),
    endDate: z.string(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    duration: z.string(),
    location: z.string().trim().min(1, "Location is required"),
    price: z.coerce.number().min(0, "Price must be 0 or more"),
    capacity: z.coerce.number().int("Enter a whole number").min(1),
    image: z.string().trim().url("Invalid image URL").or(z.literal("")),
    secondaryImage: z
      .string()
      .trim()
      .url("Invalid image URL")
      .or(z.literal("")),
    active: z.boolean(),
    hostName: z.string(),
    hostCraft: z.string(),
    hostBio: z.string().max(3000),
    level: z.string(),
    language: z.string(),
    about: z.string().max(5000),
    whatYouMake: z.string().max(3000),
    schedule: z.array(
      z.object({
        time: z.string(),
        title: z.string(),
      }),
    ),
    amenities: z.array(z.string()),
    whatToBring: z.array(z.string()),
    cancellationPolicy: z.string().max(3000),
  })
  .refine((event) => !event.startTime || !event.endTime || event.endTime > event.startTime || Boolean(event.endDate && event.endDate > event.date), {
    path: ["endTime"],
    message: "End time must be after start time for a single-day event",
  })
  .refine((event) => !event.endDate || event.endDate >= event.date, {
    path: ["endDate"],
    message: "End date cannot be before start date",
  });

const empty: EventInput = {
  title: "",
  slug: "",
  description: "",
  date: "",
  endDate: "",
  startTime: "",
  endTime: "",
  duration: "",
  location: "",
  price: 0,
  capacity: 10,
  image: "",
  secondaryImage: "",
  active: true,
  hostName: "",
  hostCraft: "",
  hostBio: "",
  level: "Beginner friendly",
  language: "English & Hindi",
  about: "",
  whatYouMake: "",
  schedule: [],
  amenities: [],
  whatToBring: [],
  cancellationPolicy: "",
};

type EventFormProps = {
  initial?: EventInput | undefined;
  onSubmit: (value: EventInput) => void;
  onCancel: () => void;
  busy?: boolean | undefined;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border p-4 sm:col-span-2">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            aria-label={`Remove ${label} item ${index + 1}`}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, ""])}
      >
        + Add item
      </Button>
    </div>
  );
}

export function EventForm({
  initial,
  onSubmit,
  onCancel,
  busy,
}: EventFormProps) {
  const [v, setV] = useState<EventInput>(() => ({
    ...empty,
    ...initial,
    schedule: (initial?.schedule ?? []).map((item) => ({
      time: item.time,
      title: item.title,
    })),
    amenities: [...(initial?.amenities ?? [])],
    whatToBring: [...(initial?.whatToBring ?? [])],
    secondaryImage: initial?.secondaryImage ?? "",
  }));

  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const set = <K extends keyof EventInput>(
    key: K,
    value: EventInput[K],
  ) => {
    setV((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleaned = {
      ...v,
      title: v.title.trim(),
      slug: v.slug.trim(),
      schedule: v.schedule
        .map(
          (item): EventScheduleItem => ({
            time: item.time.trim(),
            title: item.title.trim(),
          }),
        )
        .filter((item) => item.time || item.title),
      amenities: v.amenities.map((item) => item.trim()).filter(Boolean),
      whatToBring: v.whatToBring.map((item) => item.trim()).filter(Boolean),
    };

    const result = schema.safeParse(cleaned);

    if (!result.success) {
      const nextErrors: Record<string, string | undefined> = {};

      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        nextErrors[key] = issue.message;
      }

      setErrors(nextErrors);
      return;
    }

        const schedule: EventScheduleItem[] = result.data.schedule.map((item) => ({
      time: item.time ?? "",
      title: item.title ?? "",
    }));

    const submitted: EventInput = {
      ...result.data,
      schedule,
    };

    setErrors({});
    onSubmit(submitted);
  };

  const updateSchedule = (
  index: number,
  key: keyof EventScheduleItem,
  value: string,
) => {
  const current = v.schedule[index];

  if (!current) return;

  const next: EventScheduleItem[] = v.schedule.map((item) => ({
    time: item.time,
    title: item.title,
  }));

  next[index] =
    key === "time"
      ? { time: value, title: current.title }
      : { time: current.time, title: value };

  set("schedule", next);
};

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Section title="Event identity">
        <Field label="Event title" error={errors["title"]}>
          <Input
            value={v.title}
            onChange={(event) => {
              const title = event.target.value;
              set("title", title);
              if (!slugTouched) set("slug", slugify(title));
            }}
          />
        </Field>

        <Field label="Slug" error={errors["slug"]}>
          <Input
            value={v.slug}
            onChange={(event) => {
              setSlugTouched(true);
              set("slug", event.target.value);
            }}
          />
        </Field>

        <Field label="Short description" error={errors["description"]}>
          <Textarea
            rows={3}
            value={v.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Dates, timing and booking"
        description="For a one-day event, leave the end date blank if it is the same as the start date."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date" error={errors["date"]}>
            <Input
              type="date"
              value={v.date}
              onChange={(event) => set("date", event.target.value)}
            />
          </Field>

          <Field label="End date" error={errors["endDate"]}>
            <Input
              type="date"
              value={v.endDate}
              onChange={(event) => set("endDate", event.target.value)}
            />
          </Field>

          <Field label="Start time" error={errors["startTime"]}>
            <Input
              type="time"
              value={v.startTime}
              onChange={(event) => set("startTime", event.target.value)}
            />
          </Field>

          <Field label="End time" error={errors["endTime"]}>
            <Input
              type="time"
              value={v.endTime}
              onChange={(event) => set("endTime", event.target.value)}
            />
          </Field>

          <Field label="Duration" error={errors["duration"]}>
            <Input
              placeholder="e.g. 6 hours"
              value={v.duration}
              onChange={(event) => set("duration", event.target.value)}
            />
          </Field>

          <Field label="Location" error={errors["location"]}>
            <Input
              placeholder="e.g. Kalga Studio"
              value={v.location}
              onChange={(event) => set("location", event.target.value)}
            />
          </Field>

          <Field label="Price (₹)" error={errors["price"]}>
            <Input
              type="number"
              min={0}
              value={v.price}
              onChange={(event) =>
                set("price", event.target.value as unknown as number)
              }
            />
          </Field>

          <Field label="Capacity" error={errors["capacity"]}>
            <Input
              type="number"
              min={1}
              value={v.capacity}
              onChange={(event) =>
                set("capacity", event.target.value as unknown as number)
              }
            />
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <Switch
            checked={v.active}
            onCheckedChange={(checked) => set("active", checked)}
          />
          Active (open for booking)
        </label>
      </Section>

      <Section
        title="Host details"
        description="Information displayed in the event host section."
      >
        <Field label="Host name" error={errors["hostName"]}>
          <Input
            placeholder="e.g. Meera Thakur"
            value={v.hostName}
            onChange={(event) => set("hostName", event.target.value)}
          />
        </Field>

        <Field label="Host craft / speciality" error={errors["hostCraft"]}>
          <Input
            placeholder="e.g. Pottery & Clay"
            value={v.hostCraft}
            onChange={(event) => set("hostCraft", event.target.value)}
          />
        </Field>

        <Field label="Host biography" error={errors["hostBio"]}>
          <Textarea
            rows={4}
            value={v.hostBio}
            onChange={(event) => set("hostBio", event.target.value)}
          />
        </Field>

        <Field label="Host image" error={errors["secondaryImage"]}>
          <ImageField
            value={v.secondaryImage}
            onChange={(url) => set("secondaryImage", url)}
            error={errors["secondaryImage"]}
            bucket="event-images"
          />
        </Field>
      </Section>

      <Section title="The experience">
        <Field label="Difficulty level" error={errors["level"]}>
          <Input
            placeholder="e.g. Beginner friendly"
            value={v.level}
            onChange={(event) => set("level", event.target.value)}
          />
        </Field>

        <Field label="Language" error={errors["language"]}>
          <Input
            placeholder="e.g. English & Hindi"
            value={v.language}
            onChange={(event) => set("language", event.target.value)}
          />
        </Field>

        <Field label="About the session" error={errors["about"]}>
          <Textarea
            rows={5}
            value={v.about}
            onChange={(event) => set("about", event.target.value)}
          />
        </Field>

        <Field
          label="What participants will make"
          error={errors["whatYouMake"]}
        >
          <Textarea
            rows={3}
            value={v.whatYouMake}
            onChange={(event) => set("whatYouMake", event.target.value)}
          />
        </Field>
      </Section>

      <Section
        title="Session schedule"
        description="Add each activity in the order it happens."
      >
        {v.schedule.map((item, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-md border p-3 sm:grid-cols-[140px_1fr_auto]"
          >
            <Field label={`Time ${index + 1}`}>
              <Input
                placeholder="10:00 AM"
                value={item.time}
                onChange={(event) =>
                  updateSchedule(index, "time", event.target.value)
                }
              />
            </Field>

            <Field label={`Activity ${index + 1}`}>
              <Input
                placeholder="Welcome & Introduction"
                value={item.title}
                onChange={(event) =>
                  updateSchedule(index, "title", event.target.value)
                }
              />
            </Field>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  set(
                    "schedule",
                    v.schedule.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            set("schedule", [...v.schedule, { time: "", title: "" }])
          }
        >
          + Add schedule item
        </Button>
      </Section>

      <Section title="What is included and what to bring">
        <StringListEditor
          label="Amenities / included"
          items={v.amenities}
          onChange={(items) => set("amenities", items)}
          placeholder="e.g. All tools required"
        />

        <StringListEditor
          label="What participants should bring"
          items={v.whatToBring}
          onChange={(items) => set("whatToBring", items)}
          placeholder="e.g. Comfortable clothes"
        />
      </Section>

      <Section title="Cancellation policy">
        <Field label="Policy" error={errors["cancellationPolicy"]}>
          <Textarea
            rows={4}
            placeholder="Explain the cancellation and refund terms."
            value={v.cancellationPolicy}
            onChange={(event) =>
              set("cancellationPolicy", event.target.value)
            }
          />
        </Field>
      </Section>

      <Section title="Main event image">
        <p className="text-sm text-muted-foreground">
          This image represents the event. Uploads use your existing
          event-images storage bucket.
        </p>
        <Field label="Event image" error={errors["image"]}>
          <ImageField
            value={v.image}
            onChange={(url) => set("image", url)}
            error={errors["image"]}
            bucket="event-images"
          />
        </Field>
      </Section>

      {Object.values(errors).some(Boolean) && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          Please fix the highlighted fields before saving.
        </p>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save event"}
        </Button>
      </div>
    </form>
  );
}
