import { ORGANS, type OrganId } from "@/lib/organs";
import { cn } from "@/lib/utils";

export default function OrganNavigation({
  active,
  onSelect,
  className,
}: {
  active: OrganId;
  onSelect: (id: OrganId) => void;
  className?: string;
}) {
  return (
    <nav className={cn("panel p-4", className)} aria-label="Body system navigation">
      <div className="label-meta mb-3 flex items-center justify-between">
        <span>Body system</span>
        <span className="text-cyan">{ORGANS.length}</span>
      </div>
      <ul className="space-y-px">
        {ORGANS.map((organ) => {
          const isActive = organ.id === active;
          return (
            <li key={organ.id}>
              <button
                type="button"
                onClick={() => onSelect(organ.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group flex w-full items-center gap-3 border border-transparent px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:border-border hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    isActive ? "bg-cyan pulse-dot" : "bg-border-strong",
                  )}
                />
                <span className={cn("flex-1", isActive && "font-medium tracking-tight")}>
                  {organ.name}
                </span>
                <span className="label-meta opacity-0 transition-opacity group-hover:opacity-100">
                  {organ.system.split(" ")[0]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
