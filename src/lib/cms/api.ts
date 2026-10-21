
import { supabase } from "@/lib/supabase";
import type {
  EventInput,
  Product,
  ProductInput,
  StudioEvent,
} from "./types";

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// PRODUCTS

function normalizeImages(input: Partial<ProductInput>): string[] {
  const images =
    input.images !== undefined
      ? input.images
      : input.image !== undefined
        ? [input.image]
        : [];

  return images
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function mapProduct(row: any): Product {
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url)
    .filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    price: Number(row.price),
    category: row.category ?? "",
    stock: row.stock,
    image: images[0] ?? "",
    images,
    active: row.is_active,
  };
}

function productFields(input: Partial<ProductInput>) {
  const fields: Record<string, unknown> = {};

  if (input.name !== undefined) fields["name"] = input.name;
  if (input.slug !== undefined) fields["slug"] = input.slug;
  if (input.description !== undefined) {
    fields["description"] = input.description || null;
  }
  if (input.price !== undefined) fields["price"] = input.price;
  if (input.category !== undefined) {
    fields["category"] = input.category || null;
  }
  if (input.stock !== undefined) fields["stock"] = input.stock;
  if (input.active !== undefined) fields["is_active"] = input.active;

  return fields;
}

async function replaceProductImages(
  productId: string,
  images: string[],
) {
  if (images.length > 5) {
    throw new Error("A product can have a maximum of five images.");
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  throwIfError(deleteError);

  if (images.length === 0) return;

  const { error: insertError } = await supabase
    .from("product_images")
    .insert(
      images.map((image_url, sort_order) => ({
        product_id: productId,
        image_url,
        sort_order,
      })),
    );

  throwIfError(insertError);
}

async function getProductById(id: string): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, image_url, sort_order)")
    .eq("id", id)
    .single();

  throwIfError(error);
  return mapProduct(data);
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, image_url, sort_order)")
    .order("created_at", { ascending: false });

  throwIfError(error);
  return (data ?? []).map(mapProduct);
}

export async function createProduct(
  input: ProductInput,
): Promise<Product> {
  const images = normalizeImages(input);

  if (images.length > 5) {
    throw new Error("A product can have a maximum of five images.");
  }

  const { data, error } = await supabase
    .from("products")
    .insert(productFields(input))
    .select("id")
    .single();

  throwIfError(error);

  if (!data) {
    throw new Error("Product creation returned no data.");
  }

  try {
    if (images.length > 0) {
      await replaceProductImages(data.id, images);
    }
  } catch (err) {
    // Avoid leaving a newly created product behind if its gallery fails.
    await supabase.from("products").delete().eq("id", data.id);
    throw err;
  }

  return getProductById(data.id);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<Product> {
  const fields = productFields(patch);

  if (Object.keys(fields).length > 0) {
    const { error } = await supabase
      .from("products")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    throwIfError(error);
  }

  if (patch.images !== undefined) {
    await replaceProductImages(id, normalizeImages(patch));
  } else if (patch.image !== undefined) {
    // Compatibility with forms that edit only the main image.
    const { data, error } = await supabase
      .from("product_images")
      .select("image_url, sort_order")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    throwIfError(error);

    const existing = (data ?? []).map((item) => item.image_url);
    const images = patch.image.trim()
      ? existing.length
        ? [patch.image.trim(), ...existing.slice(1)]
        : [patch.image.trim()]
      : existing.slice(1);

    await replaceProductImages(id, images);
  }

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  throwIfError(error);
}

// EVENTS

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") return fallback;

  let parsed = value;

  // Handle both normal JSON and legacy double-encoded JSON.
  for (let i = 0; i < 3 && typeof parsed === "string"; i++) {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return fallback;
    }
  }

  return parsed as T;
}

function mapEvent(row: any): StudioEvent {
  return {
    id: row.id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    description: row.description ?? "",

    date: row.event_date ?? "",
    endDate: row.end_date ?? "",
    startTime: (row.event_time ?? "").slice(0, 5),
    endTime: (row.end_time ?? "").slice(0, 5),
    duration: row.duration ?? "",

    location: row.location ?? "",
    price: Number(row.price ?? 0),
    capacity: row.capacity ?? 10,

    image: row.image_url ?? "",
    secondaryImage: row.host_image_url ?? "",
    active: row.is_active ?? false,

    hostName: row.host_name ?? "",
    hostCraft: row.host_craft ?? "",
    hostBio: row.host_bio ?? "",

    level: row.level ?? "",
    language: row.language ?? "",
    about: row.about ?? "",
    whatYouMake: row.what_you_make ?? "",

    schedule: parseJson(row.schedule, []),
    amenities: parseJson(row.amenities, []),
    whatToBring: parseJson(row.what_to_bring, []),

    cancellationPolicy: row.cancellation_policy ?? "",
  };
}

function eventFields(input: Partial<EventInput>) {
  const fields: Record<string, unknown> = {};

  if (input.title !== undefined) fields["title"] = input.title;
  if (input.slug !== undefined) fields["slug"] = input.slug;
  if (input.description !== undefined) {
    fields["description"] = input.description || null;
  }

  if (input.date !== undefined) {
    fields["event_date"] = input.date || null;
  }
  if (input.endDate !== undefined) {
    fields["end_date"] = input.endDate || null;
  }
  if (input.startTime !== undefined) {
    fields["event_time"] = input.startTime || null;
  }
  if (input.endTime !== undefined) {
    fields["end_time"] = input.endTime || null;
  }
  if (input.duration !== undefined) {
    fields["duration"] = input.duration || null;
  }

  if (input.location !== undefined) {
    fields["location"] = input.location || null;
  }
  if (input.price !== undefined) fields["price"] = input.price;
  if (input.capacity !== undefined) fields["capacity"] = input.capacity;

  if (input.image !== undefined) {
    fields["image_url"] = input.image || null;
  }
  if (input.secondaryImage !== undefined) {
    fields["host_image_url"] = input.secondaryImage || null;
  }
  if (input.active !== undefined) fields["is_active"] = input.active;

  if (input.hostName !== undefined) {
    fields["host_name"] = input.hostName || null;
  }
  if (input.hostCraft !== undefined) {
    fields["host_craft"] = input.hostCraft || null;
  }
  if (input.hostBio !== undefined) {
    fields["host_bio"] = input.hostBio || null;
  }

  if (input.level !== undefined) {
    fields["level"] = input.level || null;
  }
  if (input.language !== undefined) {
    fields["language"] = input.language || null;
  }
  if (input.about !== undefined) {
    fields["about"] = input.about || null;
  }
  if (input.whatYouMake !== undefined) {
    fields["what_you_make"] = input.whatYouMake || null;
  }

  if (input.schedule !== undefined) {
    fields["schedule"] = input.schedule;
  }
  if (input.amenities !== undefined) {
    fields["amenities"] = input.amenities;
  }
  if (input.whatToBring !== undefined) {
    fields["what_to_bring"] = input.whatToBring;
  }

  if (input.cancellationPolicy !== undefined) {
    fields["cancellation_policy"] = input.cancellationPolicy || null;
  }

  return fields;
}

export async function getEvents(): Promise<StudioEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  throwIfError(error);
  return (data ?? []).map(mapEvent);
}

export async function createEvent(
  input: EventInput,
): Promise<StudioEvent> {
  const payload = eventFields(input);

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Event save failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Event save returned no data.");
  }

  return mapEvent(data);
}

export async function updateEvent(
  id: string,
  patch: Partial<EventInput>,
): Promise<StudioEvent> {
  const fields = eventFields(patch);

  if (Object.keys(fields).length > 0) {
    // TEMPORARY DIAGNOSTIC: identify the signed-in Supabase user
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    console.log("Event update identity check:", {
      currentUserId: authData.user?.id,
      authError: authError?.message,
    });

    const { data: adminRecord, error: adminReadError } =
      await supabase
        .from("admin_users")
        .select("user_id, role")
        .eq("user_id", authData.user?.id ?? "")
        .maybeSingle();

    console.log("Admin record visibility check:", {
      adminRecord,
      error: adminReadError?.message,
    });



    const { data: isAdmin, error: isAdminError } =
      await supabase.rpc("is_admin");

    console.log("Admin function check:", {
      isAdmin,
      error: isAdminError?.message,
    });

    const { data, error } = await supabase
      .from("events")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Event update diagnostic:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        patch,
        fields,
      });

      throw new Error(
        `Event update failed: ${error.message} (code: ${error.code ?? "unknown"})`,
      );
    }

    if (!data) {
      throw new Error("Event update returned no data.");
    }

    return mapEvent(data);
  }

 

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  throwIfError(error);

  if (!data) {
    throw new Error("Event not found.");
  }

  return mapEvent(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  throwIfError(error);
}
