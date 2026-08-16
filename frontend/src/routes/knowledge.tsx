import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, MessageSquare } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Disclaimer, MButton, MetaLabel, Panel, SectionHeading } from "@/components/ui/medfl";
import { openChat, usePageChatContext } from "@/lib/chat-context-store";
import { ORGANS } from "@/lib/organs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Health Knowledge — MeDFL" },
      {
        name: "description",
        content:
          "Plain-language explanations of body systems, AI health models and federated learning concepts.",
      },
      { property: "og:title", content: "Health Knowledge — MeDFL" },
      { property: "og:description", content: "Learn how MeDFL reasons about the human body." },
    ],
  }),
  component: KnowledgePage,
});

const CONCEPTS = [
  {
    q: "What is federated learning?",
    a: "A training approach where the model is sent to each data holder, trained locally, and only the resulting parameter updates are shared back. The raw data never leaves its origin.",
  },
  {
    q: "How does the model turn symptoms into a prediction?",
    a: "Symptoms are encoded as a structured feature vector. The model compares that pattern against the statistical relationships it learned during training, then ranks the most consistent conditions by confidence.",
  },
  {
    q: "What does the confidence percentage mean?",
    a: "It expresses how strongly the observed symptom pattern matches a condition relative to the alternatives. High confidence is not certainty, and low confidence does not rule a condition out.",
  },
  {
    q: "Why can't AI replace a doctor?",
    a: "A model sees only the symptoms you enter. A clinician integrates history, examination, laboratory results and context — plus responsibility for the decision.",
  },
  {
    q: "How should I use MeDFL results?",
    a: "As a starting point for a better conversation with a healthcare professional: understand terminology, prepare questions, and recognise when to seek care sooner.",
  },
];

function Accordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#070a12]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 px-7 py-5 text-left transition-colors hover:text-cyan"
      >
        <span className="text-sm">{q}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden px-7 pb-6 text-sm leading-relaxed text-muted-foreground"
        >
          {a}
        </motion.p>
      ) : null}
    </div>
  );
}

function KnowledgePage() {
  usePageChatContext({ page: "knowledge" });

  return (
    <PageContainer>
      <SectionHeading
        label="Learn"
        title="Health Knowledge"
        description="Plain-language reference for the body systems MeDFL models and the concepts behind its predictions."
        action={
          <MButton onClick={() => openChat("Explain federated learning like I'm new to it.")}>
            <MessageSquare className="size-3.5" /> Ask MeDFL AI
          </MButton>
        }
      />

      <section className="mt-10">
        <MetaLabel>Body systems</MetaLabel>
        <div className="mt-4 grid grid-cols-2 gap-px bg-border">
          {ORGANS.map((organ) => (
            <div key={organ.id} className="panel-hover bg-[#070a12] p-7">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl tracking-tight">{organ.name}</h3>
                <span className="label-meta">{organ.system}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {organ.description}
              </p>
              <p className="mt-4 border-l border-violet/60 pl-4 text-sm text-foreground/80">
                {organ.aiConnection}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <MetaLabel>Concepts</MetaLabel>
        <Panel className="mt-4 divide-y divide-[var(--border)] p-0">
          {CONCEPTS.map((c) => (
            <Accordion key={c.q} {...c} />
          ))}
        </Panel>
      </section>

      <div className="mt-10">
        <Disclaimer>
          Educational content only. It does not describe your individual condition and is not
          medical advice.
        </Disclaimer>
      </div>
    </PageContainer>
  );
}
