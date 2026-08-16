import { Link } from "@tanstack/react-router";

const LINKS = [
  { label: "Symptoms", to: "/symptoms" as const },
  { label: "Diseases", to: "/diseases" as const },
  { label: "Knowledge", to: "/knowledge" as const },
  { label: "Privacy", to: "/privacy" as const },
  { label: "AI Insights", to: "/insights" as const },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-[#070a12] px-8 py-10">
      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-8">
        <div className="col-span-5">
          <div className="font-display text-xl tracking-[0.18em]">MeDFL</div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Privacy-preserving intelligence for healthcare.
          </p>
        </div>

        <div className="col-span-3">
          <div className="label-meta mb-4">Platform</div>
          <ul className="space-y-2">
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-cyan"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-4">
          <div className="label-meta mb-4">Disclaimer</div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            MeDFL provides educational and AI-generated health information and is not a substitute for
            professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}
