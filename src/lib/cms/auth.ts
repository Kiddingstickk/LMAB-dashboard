
import { supabase } from "@/lib/supabase";

export interface AdminSession {
  email: string;
  userId: string;
  role: string;
}

export async function getSession(): Promise<AdminSession | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) return null;

  return {
    email: user.email ?? "",
    userId: user.id,
    role: admin.role,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<AdminSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Unable to sign in.");

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError || !admin) {
    await supabase.auth.signOut();
    throw new Error("This account is not authorized to access the admin dashboard.");
  }

  return {
    email: data.user.email ?? "",
    userId: data.user.id,
    role: admin.role,
  };
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
