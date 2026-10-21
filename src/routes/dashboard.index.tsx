import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/cms/ui";
import { getEvents, getProducts } from "@/lib/cms/api";
import { todayISO } from "@/lib/cms/format";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Let's Make a Buy Admin" },
      { name: "description", content: "Overview of products and events at Dii Art Studio." },
      { property: "og:title", content: "Dashboard — Let's Make a Buy Admin" },
      { property: "og:description", content: "Overview of products and events at Dii Art Studio." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const products = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const events = useQuery({ queryKey: ["events"], queryFn: getEvents });
  const p = products.data ?? [];
  const e = events.data ?? [];
  const dash = (n: number, loading: boolean) => (loading ? "—" : n);
  const today = todayISO();
  return (
    <>
      <PageHeader title="Art Studio" subtitle="Manage your products and events." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total products" value={dash(p.length, products.isLoading)} />
        <StatCard label="Active products" value={dash(p.filter((x) => x.active).length, products.isLoading)} />
        <StatCard label="Total events" value={dash(e.length, events.isLoading)} />
        <StatCard label="Upcoming events" value={dash(e.filter((x) => x.date >= today).length, events.isLoading)} />
      </div>
    </>
  );
}
