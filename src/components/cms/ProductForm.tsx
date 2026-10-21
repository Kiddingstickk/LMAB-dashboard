
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/cms/format";
import type { ProductInput } from "@/lib/cms/types";
import { Field, ImageField } from "./ui";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  description: z.string().max(2000),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.string().trim().min(1, "Category is required"),
  stock: z.coerce.number().int("Whole number").min(0, "Stock must be 0 or more"),
  images: z
    .array(z.string().trim().url("Invalid image URL").or(z.literal("")))
    .max(5, "Maximum five images allowed"),
  active: z.boolean(),
});

const empty: ProductInput = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  category: "",
  stock: 0,
  image: "",
  images: [],
  active: true,
};

export function ProductForm({
  initial,
  onSubmit,
  onCancel,
  busy,
}: {
  initial?: ProductInput | undefined;
  onSubmit: (v: ProductInput) => void;
  onCancel: () => void;
  busy?: boolean | undefined;
}) {
  const [v, setV] = useState<ProductInput>(() => {
    if (!initial) return empty;

    const images = initial.images?.length
      ? initial.images
      : initial.image
        ? [initial.image]
        : [];

    return {
      ...initial,
      images,
      image: images[0] ?? "",
    };
  });

  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const set = <K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) => {
    setV((previous) => ({ ...previous, [key]: value }));
  };

  const setImage = (index: number, url: string) => {
    setV((previous) => {
      const images = [...previous.images];
      images[index] = url;

      return {
        ...previous,
        images,
        image: images[0] ?? "",
      };
    });

    setErrors((previous) => ({
      ...previous,
      images: undefined,
    }));
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = schema.safeParse({
      ...v,
      images: v.images.slice(0, 5),
    });

    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }

    const images = result.data.images
      .map((url) => url.trim())
      .filter(Boolean);

    setErrors({});

    onSubmit({
      ...result.data,
      images,
      image: images[0] ?? "",
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Product name" error={errors["name"]} className="sm:col-span-2">
        <Input
          value={v.name}
          onChange={(e) => {
            set("name", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
        />
      </Field>

      <Field label="Slug" error={errors["slug"]} className="sm:col-span-2">
        <Input
          value={v.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
        />
      </Field>

      <Field label="Description" error={errors["description"]} className="sm:col-span-2">
        <Textarea
          rows={3}
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Field label="Price (₹)" error={errors["price"]}>
        <Input
          type="number"
          min={0}
          value={v.price}
          onChange={(e) =>
            set("price", e.target.value as unknown as number)
          }
        />
      </Field>

      <Field label="Stock" error={errors["stock"]}>
        <Input
          type="number"
          min={0}
          value={v.stock}
          onChange={(e) =>
            set("stock", e.target.value as unknown as number)
          }
        />
      </Field>

      <Field label="Category" error={errors["category"]} className="sm:col-span-2">
        <Input
          value={v.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="Ceramics, Jewellery, Textiles…"
        />
      </Field>

      <div className="space-y-4 sm:col-span-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Product gallery
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload up to five images. The first image is the main product image.
          </p>
        </div>

        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="rounded-md border p-3">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider">
              {index === 0
                ? "01 · Main image"
                : `${String(index + 1).padStart(2, "0")} · Supporting image`}
            </p>

            <ImageField
              value={v.images[index] ?? ""}
              onChange={(url) => setImage(index, url)}
              error={index === 0 ? errors["images"] : undefined}
              bucket="product-images"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <Switch
          checked={v.active}
          onCheckedChange={(checked) => set("active", checked)}
        />
        Active (visible in shop)
      </label>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save product"}
        </Button>
      </div>
    </form>
  );
}
