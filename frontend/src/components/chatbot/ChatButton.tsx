import { closeChat, openChat, useChatStore } from "@/lib/chat-context-store";

export default function ChatButton() {
  const { open } = useChatStore();
  return (
    <button
      type="button"
      onClick={() => (open ? closeChat() : openChat())}
      aria-label={open ? "Close MeDFL AI assistant" : "Open MeDFL AI assistant"}
      className="fixed right-8 bottom-8 z-50 flex items-center gap-3 border border-border-strong bg-[#080b14] px-5 py-3 transition-all hover:border-cyan hover:shadow-[0_0_36px_-8px_var(--cyan)]"
    >
      <span className="relative flex size-2.5 items-center justify-center">
        <span className="absolute inline-flex size-2.5 rounded-full bg-cyan/40 pulse-dot" />
        <span className="relative size-1.5 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)]" />
      </span>
      <span className="font-mono text-[11px] tracking-[0.16em] uppercase">MeDFL AI</span>
    </button>
  );
}
