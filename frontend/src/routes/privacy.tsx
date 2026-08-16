import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Hospital, Lock, Shield, Share2 } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import { Disclaimer, MetaLabel, Panel, SectionHeading } from "@/components/ui/medfl";
import { usePageChatContext } from "@/lib/chat-context-store";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Federated Learning — MeDFL" },
      {
        name: "description",
        content:
          "How MeDFL uses federated learning so institutions can train shared models without exchanging raw patient data.",
      },
      { property: "og:title", content: "Privacy & Federated Learning — MeDFL" },
      {
        property: "og:description",
        content: "Local training, shared intelligence, no centralized patient records.",
      },
    ],
  }),
  component: PrivacyPage,
});

const STEPS = [
  {
    title: "Local training",
    body: "Each participating hospital trains the model on its own data, inside its own infrastructure.",
  },
  {
    title: "Model updates only",
    body: "Only learned parameters leave the institution — never patient records, images or identifiers.",
  },
  {
    title: "Secure aggregation",
    body: "The coordinating server combines updates into an improved global model without seeing any single contribution in isolation.",
  },
  {
    title: "Shared intelligence",
    body: "The improved model is distributed back to every node, so all participants benefit from collective learning.",
  },
];

const NODES = [
  { id: 1, label: "Hospital A", x: 12, y: 18 },
  { id: 2, label: "Hospital B", x: 82, y: 14 },
  { id: 3, label: "Clinic C", x: 8, y: 74 },
  { id: 4, label: "Research D", x: 86, y: 76 },
];

function FederatedDiagram() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative h-[460px] w-full overflow-hidden border border-border bg-[#04060c]">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />

      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {NODES.map((node) => (
          <motion.line
            key={node.id}
            x1={`${node.x + 6}%`}
            y1={`${node.y + 6}%`}
            x2="50%"
            y2="50%"
            stroke="currentColor"
            className={hovered === node.id ? "text-cyan" : "text-border"}
            strokeWidth={1}
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: node.id * 0.15 }}
          />
        ))}
      </svg>

      {NODES.map((node) => (
        <div
          key={node.id}
          onMouseEnter={() => setHovered(node.id)}
          onMouseLeave={() => setHovered(null)}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          className="absolute w-44 border border-border bg-[#070a12] p-4 transition-colors hover:border-cyan"
        >
          <Hospital className="size-4 text-cyan" />
          <div className="mt-3 font-mono text-[11px] tracking-[0.14em] uppercase">{node.label}</div>
          <div className="label-meta mt-2 normal-case">Local data · never shared</div>
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="size-3 text-signal" />
            <span className="font-mono text-[10px] text-signal">Encrypted update</span>
          </div>
        </div>
      ))}

      <div className="absolute top-1/2 left-1/2 w-52 -translate-x-1/2 -translate-y-1/2 border border-cyan/60 bg-[#070a12] p-5 shadow-[0_0_60px_-15px_var(--cyan)]">
        <Share2 className="size-4 text-cyan" />
        <div className="mt-3 font-display text-sm tracking-[0.16em] uppercase">Global Model</div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Aggregates encrypted updates into shared intelligence.
        </p>
      </div>
    </div>
  );
}

function PrivacyPage() {
  usePageChatContext({ page: "privacy" });

  return (
    <PageContainer>
      <SectionHeading
        label="Architecture"
        title="Privacy is the architecture, not a setting."
        description="MeDFL is built on federated learning: models travel to the data, never the reverse."
      />

      <div className="mt-10">
        <FederatedDiagram />
      </div>

      <div className="mt-px grid grid-cols-4 gap-px bg-border pt-8">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="panel-hover bg-[#070a12] p-7"
          >
            <div className="font-mono text-xs text-cyan">{String(i + 1).padStart(2, "0")}</div>
            <div className="mt-6 font-display text-lg tracking-tight">{step.title}</div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </motion.div>
        ))}
      </div>

      <Panel corner className="mt-10 flex items-start gap-5 p-8">
        <Shield className="mt-1 size-5 shrink-0 text-signal" />
        <div>
          <MetaLabel>What this means for you</MetaLabel>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/85">
            Your symptom inputs are used to generate an on-demand prediction. The platform is
            designed so that raw personal health information never needs to be pooled into a single
            central dataset in order for the model to improve.
          </p>
        </div>
      </Panel>

      <div className="mt-8">
        <Disclaimer>
          This page describes the MeDFL project architecture for educational purposes and is not a
          legal privacy policy or a compliance certification.
        </Disclaimer>
      </div>
    </PageContainer>
  );
}
