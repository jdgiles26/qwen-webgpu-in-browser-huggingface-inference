import { useState, useEffect } from "react";
import { Brain, ChevronDown } from "lucide-react";

interface ReasoningBlockProps {
  reasoning: string;
  isThinking: boolean;
  thinkingSeconds: number;
}

export function ReasoningBlock({
  reasoning,
  isThinking,
  thinkingSeconds,
}: ReasoningBlockProps) {
  const [open, setOpen] = useState(isThinking);

  useEffect(() => {
    setOpen(isThinking);
  }, [isThinking]);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 text-xs text-[#557296] transition-colors hover:text-[#0b52d8]"
      >
        <Brain className="h-3.5 w-3.5" />
        {isThinking ? (
          <span className="thinking-shimmer font-medium">Thinking…</span>
        ) : (
          <span>Thought for {thinkingSeconds}s</span>
        )}
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="mt-2 whitespace-pre-wrap rounded-2xl border border-[#d8ecff] bg-white/70 px-3 py-2 text-xs text-[#486685] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {reasoning.trim()}
        </div>
      )}
    </div>
  );
}
