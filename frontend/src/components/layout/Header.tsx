import { useRouterState } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, "Dashboard"],
  [/^\/symptoms/, "Symptom Analysis"],
  [/^\/prediction/, "Prediction Results"],
  [/^\/diseases\/.+/, "Disease Details"],
  [/^\/diseases/, "Disease Explorer"],
  [/^\/knowledge/, "Health Knowledge"],
  [/^\/insights/, "AI Insights"],
  [/^\/privacy/, "Privacy & Federated Learning"],
  [/^\/settings/, "Settings"],
];

export default function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? "MeDFL";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-[#05070d]/85 px-8 backdrop-blur-md">
      <div className="flex items-baseline gap-4">
        <h1 className="font-display text-base tracking-[0.18em] uppercase">{title}</h1>
        <span className="label-meta hidden xl:block">MeDFL Workstation</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 border border-border px-3 py-1.5 text-muted-foreground xl:flex">
          <Search className="size-3.5" />
          <span className="font-mono text-[11px] tracking-[0.1em]">Search platform</span>
        </div>

        <div className="flex items-center gap-2 border border-border px-3 py-1.5">
          <span className="label-meta">AI Status</span>
          <span className="size-1.5 rounded-full bg-signal pulse-dot" />
          <span className="font-mono text-[11px] tracking-[0.12em] text-signal uppercase">Online</span>
        </div>

        <button
          type="button"
          aria-label="Profile"
          className="flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-cyan hover:text-cyan"
        >
          <UserRound className="size-4" />
        </button>
      </div>
    </header>
  );
}
