import { Suspense, lazy, useEffect, useState } from "react";
import type { OrganId } from "@/lib/organs";

const ParticleBody = lazy(() => import("./ParticleBody"));

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function ScanFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="label-meta animate-pulse">Initialising anatomy scan…</div>
    </div>
  );
}

/**
 * Client-only wrapper around the Three.js particle anatomy.
 * The heavy 3D bundle is lazily imported so it never blocks first paint.
 */
export default function HumanBody({
  activeOrgan,
  className = "",
}: {
  activeOrgan: OrganId;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      {mounted ? (
        <Suspense fallback={<ScanFallback />}>
          <ParticleBody activeOrgan={activeOrgan} reducedMotion={reducedMotion} />
        </Suspense>
      ) : (
        <ScanFallback />
      )}
    </div>
  );
}
