import { motion } from "framer-motion";
import { ORGAN_MAP, type OrganId } from "@/lib/organs";
import { cn } from "@/lib/utils";

export default function OrganInfo({
  organ,
  className,
}: {
  organ: OrganId;
  className?: string;
}) {
  const data = ORGAN_MAP[organ];
  return (
    <motion.div
      key={organ}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("panel p-5", className)}
    >
      <div className="label-meta mb-2">Organ focus</div>
      <h3 className="font-display text-2xl tracking-tight uppercase">{data.name}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.description}</p>

      <div className="mt-5 grid grid-cols-1 gap-px bg-border">
        <div className="bg-surface p-3">
          <div className="label-meta">System</div>
          <div className="mt-1 text-sm text-foreground">{data.system}</div>
        </div>
        <div className="bg-surface p-3">
          <div className="label-meta">AI connection</div>
          <div className="mt-1 text-sm text-muted-foreground">{data.aiConnection}</div>
        </div>
      </div>
    </motion.div>
  );
}
