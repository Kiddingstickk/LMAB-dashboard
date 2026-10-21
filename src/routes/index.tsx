
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/cms/auth";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getSession();

    throw redirect({
      to: session ? "/dashboard" : "/login",
    });
  },
  component: () => null,
});
