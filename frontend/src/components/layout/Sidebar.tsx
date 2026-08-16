import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BrainCircuit,
  Home,
  Library,
  ShieldCheck,
  Settings,
  Stethoscope,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", to: "/", icon: Home },
  { label: "Symptom Analysis", to: "/symptoms", icon: Stethoscope },
  { label: "Disease Explorer", to: "/diseases", icon: Activity },
  { label: "Knowledge", to: "/knowledge", icon: Library },
  { label: "AI Insights", to: "/insights", icon: BrainCircuit },
  { label: "Privacy", to: "/privacy", icon: ShieldCheck },
] as const;

const SECONDARY = [
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Profile", to: "/settings", icon: User },
] as const;

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
      <path
        d="M16 2.5 28 9.25v13.5L16 29.5 4 22.75V9.25z"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.1"
      />
      <path
        d="M16 4.8 25.9 10.4v11.2L16 27.2 6.1 21.6V10.4z"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="0.7"
        opacity="0.7"
      />
      <path
        d="M8 16h4l2-4 3 8 2.5-4H24"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-[#070a12]">
      <div className="flex items-center gap-3 border-b border-border px-5 py-5">
        <Mark />
        <div>
          <div className="font-display text-lg leading-none tracking-[0.14em]">MeDFL</div>
          <div className="label-meta mt-1.5">Private Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <div className="label-meta px-2 pb-3">Navigation</div>
        <ul className="space-y-px">
          {NAV.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 border px-3 py-2.5 font-mono text-[11px] tracking-[0.12em] uppercase transition-all",
                    active
                      ? "border-primary/60 bg-primary/10 text-foreground shadow-[inset_0_0_24px_-14px_var(--cyan)]"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute top-1/2 -left-px h-5 w-px -translate-y-1/2 bg-cyan shadow-[0_0_8px_var(--cyan)]" />
                  ) : null}
                  <item.icon className={cn("size-4", active ? "text-cyan" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-5 border-t border-border" />

        <ul className="space-y-px">
          {SECONDARY.map((item) => (
            <li key={item.label}>
              <Link
                to={item.to}
                className="flex items-center gap-3 border border-transparent px-3 py-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:border-border hover:text-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-signal pulse-dot" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-foreground uppercase">
            System secure
          </span>
        </div>
        <p className="label-meta mt-2 normal-case">Federated intelligence active</p>
      </div>
    </aside>
  );
}
