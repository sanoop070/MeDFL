import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import {
  Chip,
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

export const Route = createFileRoute("/prediction")({
  head: () => ({
    meta: [
      { title: "Prediction Result — MeDFL" },
      {
        name: "description",
        content: "Review the MeDFL model's ranked predictions and confidence for your symptoms.",
      },
      { property: "og:title", content: "Prediction Result — MeDFL" },
      { property: "og:description", content: "Ranked, interpretable AI health predictions." },
    ],
  }),
  component: PredictionPage,
});

function PredictionPage() {
  const result = usePredictionResult();
  usePageChatContext(
    result
      ? {
          page: "prediction",
          prediction: result.prediction,
          confidence: result.confidence,
          topPredictions: result.top.map((t) => t.disease),
        }
      : { page: "prediction" },
  );


  if (!result) {
    return (
      <PageContainer>
        <SectionHeading label="Model output" title="Prediction Result" />
        <div className="mt-10">
          <EmptyState
            title="No analysis has been run yet."
            hint="Select your symptoms to generate a prediction."
          />
          <Link to="/symptoms" className="mt-6 inline-block">
            <MButton variant="primary">
              Go to Symptom Analysis <ArrowRight className="size-3.5" />
            </MButton>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeading
        label="Model output"
        title="Prediction Result"
        description="Ranked outcomes from the federated model, with confidence for each candidate."
        action={
          <Link to="/symptoms">
            <MButton>Run new analysis</MButton>
          </Link>
        }
      />

      <div className="mt-10 grid grid-cols-12 gap-px bg-border">
        <div className="col-span-7 bg-[#070a12] p-10">
          <MetaLabel>Primary prediction</MetaLabel>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 font-display text-6xl tracking-[-0.03em] text-cyan text-glow"
          >
            {result.prediction}
          </motion.h3>
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <MetaLabel>Confidence</MetaLabel>
              <span className="font-mono text-2xl text-foreground">
                {result.confidence.toFixed(2)}%
              </span>
            </div>
            <ProgressBar value={result.confidence} accent="cyan" />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/diseases/$disease"
              params={{ disease: result.prediction }}
            >
              <MButton variant="primary">
                View disease details <ArrowRight className="size-3.5" />
              </MButton>
            </Link>
            <MButton onClick={() => openChat(`Explain ${result.prediction} in simple terms.`)}>
              <MessageSquare className="size-3.5" /> Ask MeDFL AI
            </MButton>
          </div>
        </div>

        <div className="col-span-5 space-y-8 bg-[#070a12] p-10">
          <div>
            <MetaLabel>Top candidates</MetaLabel>
            <div className="mt-5 space-y-5">
              {result.top.map((item, i) => (
                <motion.div
                  key={`${item.disease}-${i}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-foreground">{item.disease}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.confidence.toFixed(2)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={item.confidence}
                    accent={i === 0 ? "cyan" : i === 1 ? "violet" : "primary"}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <Panel corner className="p-5">
            <MetaLabel>Symptoms analyzed · {result.symptoms.length}</MetaLabel>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.symptoms.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <Disclaimer>
          This result is an AI-generated informational output produced by a federated model. It is
          not a medical diagnosis. Consult a qualified healthcare professional before acting on it.
        </Disclaimer>
      </div>
    </PageContainer>
  );
}
