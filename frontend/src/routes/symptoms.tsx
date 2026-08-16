import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import {
  Chip,
  Disclaimer,
  EmptyState,
  ErrorState,
  MButton,
  MetaLabel,
  Panel,
  SectionHeading,
  SkeletonRows,
} from "@/components/ui/medfl";
import { usePrediction, useSymptoms } from "@/hooks/useMedfl";
import { describeError } from "@/lib/api";
import { usePageChatContext } from "@/lib/chat-context-store";

export const Route = createFileRoute("/symptoms")({
  head: () => ({
    meta: [
      { title: "Symptom Analysis — MeDFL" },
      {
        name: "description",
        content: "Select symptoms and explore patterns identified by the MeDFL federated model.",
      },
      { property: "og:title", content: "Symptom Analysis — MeDFL" },
      { property: "og:description", content: "Describe what you're experiencing and run AI analysis." },
    ],
  }),
  component: SymptomsPage,
});

function SymptomsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  usePageChatContext({ page: "symptoms" });

  const { data, isLoading, isError, error } = useSymptoms(search);
  const prediction = usePrediction(() => navigate({ to: "/prediction" }));

  const available = useMemo(
    () => (data ?? []).filter((s) => !selected.includes(s)).slice(0, 120),
    [data, selected],
  );

  const add = (s: string) => setSelected((prev) => (prev.includes(s) ? prev : [...prev, s]));
  const remove = (s: string) => setSelected((prev) => prev.filter((x) => x !== s));

  return (
    <PageContainer>
      <SectionHeading
        label="Model input"
        title="Symptom Analysis"
        description="Describe what you're experiencing and explore patterns identified by the MeDFL model."
      />

      <div className="mt-10 grid grid-cols-12 gap-px bg-border">
        <div className="col-span-8 bg-[#070a12] p-8">
          <MetaLabel>Search</MetaLabel>
          <div className="mt-3 flex items-center gap-3 border border-border-strong px-4 py-3 focus-within:border-cyan">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symptoms…"
              aria-label="Search symptoms"
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div className="mt-8">
            <MetaLabel>Available symptoms</MetaLabel>
            <div className="mt-4">
              {isLoading ? (
                <SkeletonRows rows={6} />
              ) : isError ? (
                <ErrorState {...describeError(error)} />
              ) : available.length === 0 ? (
                <EmptyState title="No symptoms found." hint="Try a different keyword." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {available.map((s) => (
                    <Chip key={s} onClick={() => add(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="col-span-4 space-y-8 bg-[#070a12] p-8">
          <div>
            <MetaLabel>Selected · {selected.length}</MetaLabel>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No symptoms selected yet. Choose from the list to build your analysis input.
                </p>
              ) : (
                selected.map((s) => (
                  <Chip key={s} active onRemove={() => remove(s)}>
                    {s}
                  </Chip>
                ))
              )}
            </div>
          </div>

          <Panel corner className="p-5">
            <MetaLabel>Run analysis</MetaLabel>
            <p className="mt-3 text-sm text-muted-foreground">
              Symptoms are sent to the MeDFL model for pattern analysis. Results are educational.
            </p>
            <MButton
              variant="primary"
              className="mt-5 w-full"
              disabled={selected.length === 0 || prediction.isPending}
              onClick={() => prediction.mutate(selected)}
            >
              {prediction.isPending ? "Analyzing symptoms…" : "Analyze Symptoms"}
              {!prediction.isPending && <ArrowRight className="size-3.5" />}
            </MButton>
            {prediction.isError ? (
              <div className="mt-4">
                <ErrorState {...describeError(prediction.error)} />
              </div>
            ) : null}
          </Panel>

          <Disclaimer>
            MeDFL analysis is an AI-generated informational output. It is not a medical diagnosis.
            Please consult a qualified healthcare professional for clinical evaluation.
          </Disclaimer>
        </aside>
      </div>
    </PageContainer>
  );
}
