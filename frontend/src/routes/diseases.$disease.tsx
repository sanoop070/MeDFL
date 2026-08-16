import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Apple, Dumbbell, Pill, ShieldAlert, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import {
  Disclaimer,
  EmptyState,
  ErrorState,
  LoadingState,
  MButton,
  MetaLabel,
  Panel,
  SectionHeading,
} from "@/components/ui/medfl";
import { useDisease } from "@/hooks/useMedfl";
import { describeError } from "@/lib/api";
import { openChat, usePageChatContext } from "@/lib/chat-context-store";

export const Route = createFileRoute("/diseases/$disease")({
  head: ({ params }) => {
    const title = `${params.disease} — MeDFL Disease Explorer`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Description, precautions, medications, diet and activity guidance for ${params.disease}.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `MeDFL knowledge base entry for ${params.disease}.`,
        },
      ],
    };
  },
  component: DiseaseDetail,
});

function ListPanel({
  icon: Icon,
  label,
  items,
}: {
  icon: LucideIcon;
  label: string;
  items: string[];
}) {
  return (
    <Panel corner className="p-6">
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 text-cyan" />
        <MetaLabel>{label}</MetaLabel>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No {label.toLowerCase()} available.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex gap-3 text-sm text-foreground/85">
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DiseaseDetail() {
  const { disease } = Route.useParams();
  const { data, isLoading, isError, error } = useDisease(disease);
  usePageChatContext({ page: "disease", disease });

  return (
    <PageContainer>
      <Link
        to="/diseases"
        className="label-meta inline-flex items-center gap-2 transition-colors hover:text-cyan"
      >
        <ArrowLeft className="size-3.5" /> Back to explorer
      </Link>

      <div className="mt-6">
        <SectionHeading
          label="Knowledge base entry"
          title={data?.disease ?? disease}
          action={
            <MButton onClick={() => openChat(`Tell me more about ${disease}.`)}>
              <MessageSquare className="size-3.5" /> Ask MeDFL AI
            </MButton>
          }
        />
      </div>

      {isLoading ? (
        <div className="mt-10">
          <LoadingState message="Loading knowledge base entry…" />
        </div>
      ) : isError ? (
        <div className="mt-10">
          <ErrorState {...describeError(error)} />
        </div>
      ) : !data ? (
        <div className="mt-10">
          <EmptyState title="No entry found for this condition." />
        </div>
      ) : (
        <>
          {data.description ? (
            <Panel className="mt-10 p-8">
              <MetaLabel>Description</MetaLabel>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-foreground/85">
                {data.description}
              </p>
            </Panel>
          ) : null}

          <div className="mt-px grid grid-cols-2 gap-8 pt-8">
            <ListPanel icon={ShieldAlert} label="Precautions" items={data.precautions ?? []} />
            <ListPanel icon={Pill} label="Medications" items={data.medications ?? []} />
            <ListPanel icon={Apple} label="Diet" items={data.diet ?? []} />
            <ListPanel icon={Dumbbell} label="Workouts" items={data.workouts ?? []} />
          </div>

          <div className="mt-8">
            <Disclaimer>
              Medication and diet information is educational reference material from the MeDFL
              dataset. Never start, stop or change treatment without a qualified clinician.
            </Disclaimer>
          </div>
        </>
      )}
    </PageContainer>
  );
}
