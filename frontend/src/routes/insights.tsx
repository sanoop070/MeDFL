import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import {
  Disclaimer,
  EmptyState,
  MButton,
  MetaLabel,
  Panel,
  ProgressBar,
  SectionHeading,
} from "@/components/ui/medfl";
import { usePredictionResult } from "@/lib/prediction-store";
import { openChat, usePageChatContext } from "@/lib/chat-context-store";
import { detectOrgan, ORGAN_MAP } from "@/lib/organs";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — MeDFL" },
      {
        name: "description",
        content:
          "Interpret your MeDFL analysis: signal strength, related body systems and suggested next questions.",
      },
      { property: "og:title", content: "AI Insights — MeDFL" },
      { property: "og:description", content: "Interpretation layer for your federated AI analysis." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const result = usePredictionResult();
  usePageChatContext(
    result
      ? { page: "insights", prediction: result.prediction, confidence: result.confidence }
      : { page: "insights" },
  );

  if (!result) {
    return (
      <PageContainer>
        <SectionHeading label="Interpretation" title="AI Insights" />
        <div className="mt-10">
          <EmptyState
            title="Insights appear after an analysis."
            hint="Run a symptom analysis to unlock this view."
          />
          <Link to="/symptoms" className="mt-6 inline-block">
            <MButton variant="primary">
              Start analysis <ArrowRight className="size-3.5" />
            </MButton>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const spread = result.top.length > 1 ? result.top[0]!.confidence - result.top[1]!.confidence : 100;
  const certainty =
    spread > 25 ? "Distinct" : spread > 10 ? "Moderate" : "Overlapping";
  const organ = detectOrgan(`${result.prediction} ${result.symptoms.join(" ")}`);

  return (
    <PageContainer>
      <SectionHeading
        label="Interpretation"
        title="AI Insights"
        description="What the model's output implies — and what it deliberately does not."
        action={
          <MButton onClick={() => openChat(`Help me interpret my ${result.prediction} result.`)}>
            <MessageSquare className="size-3.5" /> Discuss with MeDFL AI
          </MButton>
        }
      />

      <div className="mt-10 grid grid-cols-3 gap-px bg-border">
        <div className="bg-[#070a12] p-8">
          <MetaLabel>Signal strength</MetaLabel>
          <div className="mt-4 font-display text-5xl tracking-[-0.03em]">
            {result.confidence.toFixed(1)}%
          </div>
          <ProgressBar value={result.confidence} accent="cyan" />
        </div>
        <div className="bg-[#070a12] p-8">
          <MetaLabel>Candidate separation</MetaLabel>
          <div className="mt-4 font-display text-5xl tracking-[-0.03em] text-violet">
            {certainty}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {certainty === "Overlapping"
              ? "Several conditions match your pattern closely. Additional clinical detail would be needed to separate them."
              : certainty === "Moderate"
                ? "One candidate leads, but alternatives remain plausible."
                : "One candidate stands clearly apart from the alternatives."}
          </p>
        </div>
        <div className="bg-[#070a12] p-8">
          <MetaLabel>Inputs used</MetaLabel>
          <div className="mt-4 font-display text-5xl tracking-[-0.03em]">
            {result.symptoms.length}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Fewer inputs generally mean a broader, less specific result.
          </p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-12 gap-px bg-border">
        <div className="col-span-7 bg-[#070a12] p-8">
          <MetaLabel>Candidate distribution</MetaLabel>
          <div className="mt-6 space-y-5">
            {result.top.map((item, i) => (
              <motion.div
                key={item.disease}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-baseline justify-between text-sm">
                  <span>{item.disease}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {item.confidence.toFixed(2)}%
                  </span>
                </div>
                <ProgressBar value={item.confidence} accent={i === 0 ? "cyan" : "primary"} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-5 space-y-8 bg-[#070a12] p-8">
          {organ ? (
            <Panel corner className="p-6">
              <MetaLabel>Related body system</MetaLabel>
              <div className="mt-3 font-display text-2xl">{ORGAN_MAP[organ].name}</div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {ORGAN_MAP[organ].aiConnection}
              </p>
            </Panel>
          ) : null}

          <div>
            <MetaLabel>Suggested next steps</MetaLabel>
            <ul className="mt-4 space-y-3 text-sm text-foreground/85">
              <li className="border-l border-cyan/60 pl-4">
                Review the knowledge base entry for {result.prediction}.
              </li>
              <li className="border-l border-cyan/60 pl-4">
                Note when symptoms started and what changes them.
              </li>
              <li className="border-l border-cyan/60 pl-4">
                Share this summary with a healthcare professional.
              </li>
            </ul>
          </div>

          <Link to="/diseases/$disease" params={{ disease: result.prediction }}>
            <MButton variant="primary" className="w-full">
              Open knowledge base entry <ArrowRight className="size-3.5" />
            </MButton>
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <Disclaimer>
          Insights are statistical interpretations of a model output, not a clinical assessment.
        </Disclaimer>
      </div>
    </PageContainer>
  );
}
