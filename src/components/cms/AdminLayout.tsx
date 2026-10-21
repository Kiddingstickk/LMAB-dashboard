
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, LayoutGrid, LogOut, Menu, Package } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getSession, logout } from "@/lib/cms/auth";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/dashboard/products", label: "Products", icon: Package, exact: false },
  { to: "/dashboard/events", label: "Events & Sessions", icon: CalendarDays, exact: false },
] as const;

function Brand() {
  return (
    <div>
      <p className="font-display text-lg leading-tight">Let's Make a Buy</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Dii Art Studio
      </p>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await logout();
    } finally {
      qc.clear();
      navigate({ to: "/login", replace: true });
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <Brand />
      <nav className="mt-10 flex flex-col gap-1">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            activeOptions={{ exact: n.exact }}
            className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-muted"
            activeProps={{
              className: "bg-primary text-primary-foreground hover:bg-primary",
            }}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={doLogout}
        disabled={loggingOut}
        className="mt-auto flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-foreground/80 hover:bg-muted disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? "Logging out…" : "Logout"}
      </button>
    </div>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    getSession().then((session) => {
      if (!cancelled && session) {
        setEmail(session.email);
      } else if (!cancelled) {
        navigate({ to: "/login", replace: true });
      }
    }).catch(() => {
      if (!cancelled) navigate({ to: "/login", replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card md:block">
        <Sidebar />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-10">
          <button
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground md:hidden">
            Admin
          </span>
          <span className="ml-auto hidden text-sm text-muted-foreground md:inline">
            {email ? `${email} · Admin` : "Checking session…"}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-10 md:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
