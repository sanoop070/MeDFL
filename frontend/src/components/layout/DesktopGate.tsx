import { useEffect, useState, type ReactNode } from "react";

const MIN_WIDTH = 1180;

export default function DesktopGate({ children }: { children: ReactNode }) {
  const [narrow, setNarrow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < MIN_WIDTH);
    check();
    setReady(true);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (ready && narrow) {
    return (
      <div className="grid-bg flex min-h-screen items-center justify-center px-8">
        <div className="panel max-w-md p-8 text-center">
          <div className="label-meta mb-4">Viewport notice</div>
          <h1 className="font-display text-2xl tracking-tight">MeDFL is optimized for desktop.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Open MeDFL on a display of at least {MIN_WIDTH}px to access the anatomy workstation.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
