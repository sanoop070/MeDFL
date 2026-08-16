import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, X } from "lucide-react";
import { describeError, sendChatMessage, type ChatContext } from "@/lib/api";
import { closeChat, consumeSeed, useChatStore } from "@/lib/chat-context-store";
import { setActiveOrgan } from "@/lib/anatomy-store";
import { detectOrgan } from "@/lib/organs";
import { greetingFor, suggestionsFor } from "./suggestions";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string; error?: boolean };

const uid = () => Math.random().toString(36).slice(2);

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex flex-col gap-1.5", isUser && "items-end")}>
      <span className="label-meta">{isUser ? "You" : "MeDFL AI"}</span>
      <div
        className={cn(
          "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "border border-primary/50 bg-primary/15 text-foreground"
            : message.error
              ? "border-l-2 border-destructive text-muted-foreground"
              : "border-l-2 border-cyan/60 text-foreground/90",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const { open, context, seed } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextKey = `${context.page}:${context.disease ?? context.prediction ?? ""}`;

  const suggestions = useMemo(() => suggestionsFor(context), [context]);

  // Reset the greeting when page context changes.
  useEffect(() => {
    setMessages([{ id: uid(), role: "assistant", content: greetingFor(context) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function submit(text: string, ctx: ChatContext) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: trimmed }]);
    setPending(true);

    // Link the conversation to the anatomy visualisation.
    const organ = detectOrgan(trimmed);
    if (organ) setActiveOrgan(organ, "chat");

    const assistantId = uid();
    let streamed = "";
    try {
      const reply = await sendChatMessage(trimmed, ctx, {
        onToken: (token) => {
          streamed += token;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === assistantId);
            const next: Message = { id: assistantId, role: "assistant", content: streamed };
            return exists ? prev.map((m) => (m.id === assistantId ? next : m)) : [...prev, next];
          });
        },
      });
      const replyOrgan = detectOrgan(reply);
      if (replyOrgan) setActiveOrgan(replyOrgan, "chat");
      setMessages((prev) =>
        prev.some((m) => m.id === assistantId)
          ? prev.map((m) => (m.id === assistantId ? { ...m, content: reply } : m))
          : [...prev, { id: assistantId, role: "assistant", content: reply }],
      );
    } catch (err) {
      const { title, detail } = describeError(err);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `${title} ${detail}`, error: true },
      ]);
    } finally {
      setPending(false);
    }
  }

  // Contextual questions launched from elsewhere in the platform.
  useEffect(() => {
    if (open && seed) {
      const question = seed;
      consumeSeed();
      void submit(question, context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.section
          key="chat"
          role="dialog"
          aria-label="MeDFL AI assistant"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-8 bottom-24 z-50 flex h-[620px] w-[440px] flex-col border border-border-strong bg-[#080b14] shadow-[0_0_60px_-15px_var(--primary)]"
        >
          <header className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan shadow-[0_0_10px_var(--cyan)]" />
                <span className="font-display text-sm tracking-[0.18em] uppercase">MeDFL AI</span>
              </div>
              <div className="label-meta mt-1.5 normal-case">Private Health Assistant</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-signal uppercase">
                Online <span className="size-1.5 rounded-full bg-signal pulse-dot" />
              </span>
              <button
                type="button"
                onClick={closeChat}
                aria-label="Close assistant"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {context.disease || context.prediction ? (
            <div className="border-b border-border bg-surface-2/60 px-5 py-2.5">
              <span className="label-meta">
                Context · {context.disease ?? context.prediction}
                {context.confidence != null ? ` · ${context.confidence.toFixed(2)}%` : ""}
              </span>
            </div>
          ) : null}

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {pending ? (
              <div className="label-meta animate-pulse">MeDFL AI is thinking…</div>
            ) : null}
          </div>

          <div className="border-t border-border px-5 py-3">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void submit(s, context)}
                  className="border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-cyan hover:text-cyan"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input, context);
            }}
            className="flex items-end gap-2 border-t border-border px-4 py-3"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit(input, context);
                }
              }}
              placeholder="Ask MeDFL anything…"
              aria-label="Message MeDFL AI"
              className="max-h-28 flex-1 resize-none bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send message"
              className="flex size-8 items-center justify-center border border-border-strong text-cyan transition-colors hover:border-cyan disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>

          <p className="border-t border-border px-5 py-2 text-[10px] leading-relaxed text-muted-foreground">
            Educational information only — not a substitute for professional medical advice.
          </p>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
