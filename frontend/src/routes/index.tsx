import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Lock, Network, ShieldCheck } from "lucide-react";
import HumanBody from "@/components/anatomy/HumanBody";
import OrganNavigation from "@/components/anatomy/OrganNavigation";
import OrganInfo from "@/components/anatomy/OrganInfo";
import PageContainer from "@/components/layout/PageContainer";
import { MButton, MetaLabel, Panel, SectionHeading } from "@/components/ui/medfl";
import { useAnatomy } from "@/lib/anatomy-store";
import { ORGANS, type OrganId } from "@/lib/organs";
import { usePageChatContext } from "@/lib/chat-context-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MeDFL Dashboard — Understand the signals within" },
      {
        name: "description",
        content:
          "Explore a particle-based human anatomy model and run privacy-preserving AI health analysis with MeDFL.",
      },
      { property: "og:title", content: "MeDFL Dashboard — Understand the signals within" },
      {
        property: "og:description",
        content: "Interactive anatomy visualization and federated AI health intelligence.",
      },
    ],
  }),
  component: Dashboard,
});

const STATS = [
  { value: "50K+", label: "Users" },
  { value: "120+", label: "Healthcare Partners" },
  { value: "99.9%", label: "Privacy" },
  { value: "92.7%", label: "Prediction Accuracy" },
];

const WHY = [
  {
    icon: Lock,
    label: "Privacy-Preserving",
    body: "Sensitive health information does not need to be centralized to create intelligent models.",
  },
  {
    icon: Network,
    label: "Federated Learning",
    body: "Participating institutions can collaboratively improve models without directly sharing raw patient data.",
  },
  {
    icon: Cpu,
    label: "AI-Powered Insights",
    body: "Transform symptom patterns into intelligent, interpretable predictions.",
  },
];

function Dashboard() {
  const { activeOrgan, setActiveOrgan } = useAnatomy();
  usePageChatContext({ page: "home", organ: activeOrgan });

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute("data-organ") as OrganId | undefined;
        if (id) setActiveOrgan(id, "scroll");
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [setActiveOrgan]);

  return (
    <PageContainer wide className="max-w-[1760px]">
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="grid grid-cols-12 gap-px border border-border bg-border">
        <div className="col-span-4 bg-[#070a12] p-10">
          <MetaLabel>Intelligent. Private. Secure.</MetaLabel>
          <h2 className="mt-6 font-display text-[62px] leading-[0.94] tracking-[-0.03em]">
            Understand
            <br />
            the signals
            <br />
            <span className="text-cyan text-glow">within.</span>
          </h2>
          <p className="mt-7 max-w-md text-sm leading-relaxed text-muted-foreground">
            MeDFL combines AI and Federated Learning to deliver personalized health insights without
            compromising privacy.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/symptoms">
              <MButton variant="primary">
                Start Symptom Analysis <ArrowRight className="size-3.5" />
              </MButton>
            </Link>
            <Link to="/diseases">
              <MButton>Explore Diseases</MButton>
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-2 border-t border-border pt-6">
            <ShieldCheck className="size-4 text-signal" />
            <span className="label-meta normal-case">Your health data stays private.</span>
          </div>
        </div>

        <div className="relative col-span-5 bg-[#04060c]">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-25" />
          <HumanBody activeOrgan={activeOrgan} className="h-[720px] w-full" />
          <div className="pointer-events-none absolute top-5 left-5">
            <MetaLabel>Particle anatomy · live render</MetaLabel>
          </div>
          <div className="pointer-events-none absolute right-5 bottom-5 text-right">
            <MetaLabel>Focus</MetaLabel>
            <div className="font-display text-sm tracking-[0.2em] text-cyan uppercase">
              {activeOrgan}
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-px bg-border">
          <div className="bg-[#070a12] p-5">
            <OrganNavigation
              active={activeOrgan}
              onSelect={(id) => setActiveOrgan(id, "nav")}
              className="border-0 bg-transparent p-0"
            />
          </div>
          <div className="bg-[#070a12] p-5">
            <OrganInfo organ={activeOrgan} className="border-0 bg-transparent p-0" />
          </div>
        </div>
      </section>

      {/* --------------------- SCROLL ANATOMY EXPERIENCE --------------------- */}
      <section className="mt-20 grid grid-cols-12 gap-10">
        <div className="col-span-5">
          <div className="sticky top-24">
            <Panel corner className="bg-[#04060c] p-0">
              <HumanBody activeOrgan={activeOrgan} className="h-[560px] w-full" />
              <div className="border-t border-border px-5 py-4">
                <MetaLabel>Scroll trace · body systems</MetaLabel>
              </div>
            </Panel>
          </div>
        </div>

        <div className="col-span-7 space-y-24 pt-6">
          <SectionHeading
            label="Guided exploration"
            title="Scroll the body. The scan follows."
            description="Each section below focuses the visualization on a different system. Selecting an organ from the index or asking MeDFL AI about it does the same."
          />
          {ORGANS.map((organ, index) => (
            <article
              key={organ.id}
              data-organ={organ.id}
              ref={(el) => {
                sectionRefs.current[organ.id] = el;
              }}
              className="scroll-mt-32"
            >
              <div className="flex items-start gap-6">
                <div className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <MetaLabel>{organ.system}</MetaLabel>
                  <h3 className="mt-3 font-display text-4xl tracking-tight">{organ.name}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {organ.description}
                  </p>
                  <p className="mt-4 max-w-xl border-l border-cyan/50 pl-4 text-sm text-foreground/80">
                    {organ.aiConnection}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ----------------------------- WHY MeDFL ----------------------------- */}
      <section className="mt-24">
        <SectionHeading
          label="Why MeDFL?"
          title={
            <>
              Advanced AI.
              <br />
              Human-Centered.
              <br />
              <span className="text-violet">Privacy-First.</span>
            </>
          }
        />
        <div className="mt-px grid grid-cols-3 gap-px bg-border">
          {WHY.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="panel-hover bg-[#070a12] p-8"
            >
              <card.icon className="size-5 text-cyan" />
              <div className="mt-8 font-mono text-[11px] tracking-[0.16em] uppercase">{card.label}</div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ----------------------------- STATISTICS ---------------------------- */}
      <section className="mt-20 border border-border">
        <div className="flex items-center justify-between border-b border-border px-8 py-4">
          <MetaLabel>Platform statistics</MetaLabel>
          <MetaLabel className="text-violet">Demonstration values</MetaLabel>
        </div>
        <div className="grid grid-cols-4 gap-px bg-border">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-[#070a12] px-8 py-10">
              <div className="font-display text-5xl tracking-[-0.03em]">{stat.value}</div>
              <div className="label-meta mt-4">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="border-t border-border px-8 py-3 text-[11px] text-muted-foreground">
          These are demonstration/project values for this build and are not verified real-world
          statistics.
        </p>
      </section>
    </PageContainer>
  );
}
