import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Disclaimer, MetaLabel, Panel, SectionHeading } from "@/components/ui/medfl";
import { API_BASE_URL } from "@/lib/api";
import { usePageChatContext } from "@/lib/chat-context-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MeDFL" },
      {
        name: "description",
        content: "Workstation preferences: motion, visualization density and backend connection.",
      },
      { property: "og:title", content: "Settings — MeDFL" },
      { property: "og:description", content: "Configure your MeDFL workstation preferences." },
    ],
  }),
  component: SettingsPage,
});

const STORAGE_KEY = "medfl:preferences";

type Prefs = { reducedMotion: boolean; density: "standard" | "high"; disclaimers: boolean };
const DEFAULTS: Prefs = { reducedMotion: false, density: "standard", disclaimers: true };

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-8 border-b border-border py-5 last:border-0">
      <div>
        <div className="text-sm">{label}</div>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border transition-colors",
          value ? "border-cyan bg-cyan/15 text-cyan" : "border-border-strong text-transparent",
        )}
      >
        <Check className="size-3.5" />
      </button>
    </div>
  );
}

function SettingsPage() {
  usePageChatContext({ page: "settings" });
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
      } catch {
        /* ignore malformed preferences */
      }
    }
  }, []);

  const update = (patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <PageContainer>
      <SectionHeading
        label="Workstation"
        title="Settings"
        description="Preferences are stored locally in this browser. No account or personal data is required."
      />

      <div className="mt-10 grid grid-cols-12 gap-px bg-border">
        <div className="col-span-7 bg-[#070a12] p-8">
          <MetaLabel>Interface</MetaLabel>
          <div className="mt-2">
            <Toggle
              label="Reduce motion"
              hint="Minimises animation in the anatomy visualization and page transitions."
              value={prefs.reducedMotion}
              onChange={(v) => update({ reducedMotion: v })}
            />
            <Toggle
              label="Always show medical disclaimers"
              hint="Keeps safety notices visible alongside every AI-generated result."
              value={prefs.disclaimers}
              onChange={(v) => update({ disclaimers: v })}
            />
          </div>

          <div className="mt-8">
            <MetaLabel>Particle density</MetaLabel>
            <div className="mt-3 flex gap-px bg-border">
              {(["standard", "high"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => update({ density: d })}
                  className={cn(
                    "flex-1 px-5 py-3 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                    prefs.density === d
                      ? "bg-cyan/10 text-cyan"
                      : "bg-[#070a12] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-8 bg-[#070a12] p-8">
          <Panel corner className="p-6">
            <MetaLabel>Backend connection</MetaLabel>
            <p className="mt-3 font-mono text-xs break-all text-foreground/80">{API_BASE_URL}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              MeDFL calls this FastAPI service for symptoms, predictions, the disease knowledge base
              and the AI assistant.
            </p>
          </Panel>

          <Panel className="p-6">
            <MetaLabel>Data handling</MetaLabel>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Symptom selections and prediction results live only in this session. Nothing is written
              to a central profile by this interface.
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <Disclaimer>
          MeDFL is a research and education project. It does not provide medical care.
        </Disclaimer>
      </div>
    </PageContainer>
  );
}
