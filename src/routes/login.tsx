import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/cms/ui";
import { getSession, login } from "@/lib/cms/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
  if (await getSession()) {
    throw redirect({ to: "/dashboard" });
  }
},
  head: () => ({
    meta: [
      { title: "Sign in — Let's Make a Buy Admin" },
      { name: "description", content: "Sign in to manage products and events for Dii Art Studio." },
      { property: "og:title", content: "Sign in — Let's Make a Buy Admin" },
      { property: "og:description", content: "Sign in to manage products and events for Dii Art Studio." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) {
  next.email = "Enter a valid email";
}
    if (!password.trim()) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Login failed" });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-3xl">Let's Make a Buy</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Dii Art Studio · Admin</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-5 rounded-md border bg-card p-8">
          <Field label="Email" error={errors.email}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password" error={errors.password}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Login"}</Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">Handmade in the Himalayas</p>
      </div>
    </div>
  );
}
