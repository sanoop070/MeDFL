import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Panel --------------------------------- */

export function Panel({
  children,
  className,
  corner,
}: {
  children: ReactNode;
  className?: string;
  corner?: boolean;
}) {
  return (
    <div className={cn("panel", className)}>
      {corner ? (
        <>
          <span className="pointer-events-none absolute -top-px -left-px size-2 border-t border-l border-cyan/70" />
          <span className="pointer-events-none absolute -right-px -bottom-px size-2 border-r border-b border-cyan/70" />
        </>
      ) : null}
      {children}
    </div>
  );
}

export function MetaLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-meta", className)}>{children}</div>;
}

export function SectionHeading({
  label,
  title,
  description,
  action,
}: {
  label?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-8 border-b border-border pb-5">
      <div>
        {label ? <MetaLabel className="mb-3">{label}</MetaLabel> : null}
        <h2 className="font-display text-3xl leading-[1.05] tracking-tight text-balance">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonVariant = "primary" | "ghost" | "outline";

export function MButton({
  children,
  onClick,
  variant = "outline",
  className,
  type = "button",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-primary-foreground border border-primary hover:bg-primary/85 shadow-[0_0_24px_-6px_var(--primary)]",
    outline: "border border-border-strong text-foreground hover:border-cyan hover:text-cyan bg-transparent",
    ghost: "border border-transparent text-muted-foreground hover:text-foreground hover:border-border",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 font-mono text-xs tracking-[0.14em] uppercase transition-all disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  onRemove,
  onClick,
  active,
}: {
  children: ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-cyan/70 bg-cyan/10 text-cyan"
          : "border-border bg-surface-2 text-muted-foreground",
        onClick && "cursor-pointer hover:border-border-strong hover:text-foreground",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground transition-colors hover:text-magenta"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function ProgressBar({
  value,
  accent = "primary",
  delay = 0,
}: {
  value: number;
  accent?: "primary" | "cyan" | "violet" | "magenta";
  delay?: number;
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary",
    cyan: "bg-cyan",
    violet: "bg-violet",
    magenta: "bg-magenta",
  };
  return (
    <div className="h-1.5 w-full bg-surface-2">
      <motion.div
        className={cn("h-full", colors[accent])}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ------------------------------ State displays ----------------------------- */

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 border border-dashed border-border p-6">
      <Loader2 className="size-4 animate-spin text-cyan" />
      <span className="label-meta">{message}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-px">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse bg-surface-2"
          style={{ animationDelay: `${i * 80}ms`, opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 border border-destructive/50 bg-destructive/5 p-5">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <div className="font-mono text-xs tracking-[0.14em] text-destructive uppercase">{title}</div>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-dashed border-border p-8 text-center">
      <div className="font-display text-lg tracking-tight">{title}</div>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-violet/60 bg-violet/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}
