import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import {
  EmptyState,
  ErrorState,
  MetaLabel,
  SectionHeading,
  SkeletonRows,
} from "@/components/ui/medfl";
import { useDiseaseSearch } from "@/hooks/useMedfl";
import { describeError } from "@/lib/api";
import { usePageChatContext } from "@/lib/chat-context-store";

export const Route = createFileRoute("/diseases/")({
  head: () => ({
    meta: [
      { title: "Disease Explorer — MeDFL" },
      {
        name: "description",
        content:
          "Search the MeDFL knowledge base for descriptions, precautions, medications and diet guidance.",
      },
      { property: "og:title", content: "Disease Explorer — MeDFL" },
      { property: "og:description", content: "Search conditions in the MeDFL knowledge base." },
    ],
  }),
  component: DiseaseExplorer,
});

function DiseaseExplorer() {
  const [search, setSearch] = useState("");
  usePageChatContext({ page: "diseases" });
  const { data, isFetching, isError, error } = useDiseaseSearch(search);

  return (
    <PageContainer>
      <SectionHeading
        label="Knowledge base"
        title="Disease Explorer"
        description="Search conditions to review descriptions, precautions, medications, diet and activity guidance."
      />

      <div className="mt-10 flex items-center gap-3 border border-border-strong bg-[#070a12] px-5 py-4 focus-within:border-cyan">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a disease…"
          aria-label="Search diseases"
          className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="mt-8">
        {search.trim().length === 0 ? (
          <EmptyState
            title="Start typing to search the knowledge base."
            hint="For example: Diabetes, Migraine, Bronchial Asthma."
          />
        ) : isFetching ? (
          <SkeletonRows rows={6} />
        ) : isError ? (
          <ErrorState {...describeError(error)} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="No matching diseases found." hint="Try a different term." />
        ) : (
          <>
            <MetaLabel>{data?.length} results</MetaLabel>
            <ul className="mt-4 grid grid-cols-3 gap-px bg-border">
              {data?.map((disease) => (
                <li key={disease}>
                  <Link
                    to="/diseases/$disease"
                    params={{ disease }}
                    className="panel-hover flex items-center justify-between gap-4 bg-[#070a12] px-6 py-5 text-sm"
                  >
                    <span>{disease}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PageContainer>
  );
}
