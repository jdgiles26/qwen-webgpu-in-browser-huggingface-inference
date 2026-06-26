import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Plus, House, Download } from "lucide-react";

import { useLLM } from "../hooks/useLLM";
import { MessageBubble } from "./MessageBubble";
import { StatusBar } from "./StatusBar";
import { FloatingGhost } from "./FloatingGhost";
import { AgentModeControls } from "./AgentModeControls";
import { EngineerWorkflowPresets } from "./EngineerWorkflowPresets";

const EXAMPLE_PROMPTS = [
  {
    label: "Solve x² + x - 12 = 0",
    prompt: "Solve x^2 + x - 12 = 0",
  },
  {
    label: "Explain quantum computing",
    prompt:
      "Explain quantum computing in simple terms. What makes it different from classical computing, and what are some real-world applications?",
  },
  {
    label: "Write a Python quicksort",
    prompt:
      "Write a clean, well-commented Python implementation of the quicksort algorithm. Include an example of how to use it.",
  },
  {
    label: "Solve a logic puzzle",
    prompt: "Five people were eating apples, A finished before B, but behind C. D finished before E, but behind B. What was the finishing order?",
  },
] as const;

interface ChatInputProps {
  showDisclaimer: boolean;
  animated?: boolean;
}

function ChatInput({ showDisclaimer, animated }: ChatInputProps) {
  const { send, stop, status, isGenerating, agentMode } = useLLM();
  const isReady = status.state === "ready";
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || !isReady || isGenerating) return;
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "7.5rem";
      }
      send(text);
    },
    [input, isReady, isGenerating, send],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className={`w-full ${animated ? "animate-rise-in-delayed" : ""}`}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="brand-chrome relative rounded-[1.6rem] p-2">
          <textarea
            ref={textareaRef}
            className="max-h-40 w-full resize-none rounded-[1.1rem] border border-[#d7edff] bg-white/76 px-4 py-3 pb-11 text-[15px] text-[#081325] placeholder-[#5f7898] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#a5e8ff] disabled:opacity-50"
            style={{ minHeight: "7.5rem", height: "7.5rem" }}
            placeholder={
              isReady
                ? "Type a message…"
                : agentMode === "ollama"
                  ? "Connect Ollama…"
                  : "Loading model…"
            }
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "7.5rem";
              e.target.style.height =
                Math.max(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            disabled={!isReady}
            autoFocus
          />

          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end px-2 pb-3">
            {isGenerating ? (
              <button
                type="button"
                onClick={stop}
                className="flex cursor-pointer items-center justify-center rounded-lg text-[#557296] transition-colors hover:text-[#0b52d8]"
                title="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isReady || !input.trim()}
                className="flex cursor-pointer items-center justify-center rounded-lg text-[#557296] transition-colors hover:text-[#0b52d8] disabled:opacity-30"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {showDisclaimer && null}
    </div>
  );
}

interface ChatAppProps {
  onGoHome: () => void;
}

export function ChatApp({ onGoHome }: ChatAppProps) {
  const { messages, isGenerating, send, status, clearChat } = useLLM();
  const scrollRef = useRef<HTMLElement>(null);

  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const thinkingStartRef = useRef<number | null>(null);
  const thinkingSecondsMapRef = useRef<Map<number, number>>(new Map());
  const prevIsGeneratingRef = useRef(false);
  const messagesRef = useRef(messages);
  const thinkingSecondsRef = useRef(thinkingSeconds);
  messagesRef.current = messages;
  thinkingSecondsRef.current = thinkingSeconds;

  const isReady = status.state === "ready";
  const hasMessages = messages.length > 0;
  const showNewChat = isReady && hasMessages && !isGenerating;

  const exportConversation = useCallback(() => {
    if (!messages.length) return;

    const markdown = messages
      .map((msg) => `## ${msg.role}\n\n${msg.content}${msg.reasoning ? `\n\n### reasoning\n\n${msg.reasoning}` : ""}`)
      .join("\n\n");

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workspace-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating) {
      const lastMsg = messagesRef.current.at(-1);
      if (
        lastMsg?.role === "assistant" &&
        lastMsg.reasoning &&
        thinkingSecondsRef.current > 0
      ) {
        thinkingSecondsMapRef.current.set(lastMsg.id, thinkingSecondsRef.current);
      }
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    if (!isGenerating) {
      thinkingStartRef.current = null;
      return;
    }

    thinkingStartRef.current = Date.now();
    setThinkingSeconds(0);

    const interval = setInterval(() => {
      if (thinkingStartRef.current) {
        setThinkingSeconds(
          Math.round((Date.now() - thinkingStartRef.current) / 1000),
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const lastAssistant = messages.at(-1);
  useEffect(() => {
    if (
      isGenerating &&
      lastAssistant?.role === "assistant" &&
      lastAssistant.content
    ) {
      thinkingStartRef.current = null;
    }
  }, [isGenerating, lastAssistant?.role, lastAssistant?.content]);

  return (
    <div className="brand-surface relative flex h-full flex-col overflow-hidden text-[#081325]">
      <div className="landing-brand-glow absolute inset-0" />
      <div className="brand-grid" />
      <FloatingGhost />

      <header className="brand-chrome relative z-10 mx-3 mt-3 flex h-auto flex-col gap-3 rounded-[1.4rem] px-4 py-3 sm:mx-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/55 bg-white/60 px-3 py-2 text-xs font-medium text-[#11367b] transition hover:border-[#9bdfff] hover:text-[#0b52d8]"
            title="Back to home"
          >
            <House className="h-3.5 w-3.5" />
            home
          </button>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <AgentModeControls compact />
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <button
              onClick={exportConversation}
              className={`rounded-full border border-white/55 bg-white/60 px-3 py-2 text-xs font-medium text-[#11367b] transition hover:border-[#9bdfff] hover:text-[#0b52d8] ${
                hasMessages ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              title="Export conversation"
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                export
              </span>
            </button>
            <a
              href="https://github.com/jdgiles26"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/55 bg-white/60 px-3 py-2 text-xs font-medium text-[#11367b] transition hover:border-[#9bdfff] hover:text-[#0b52d8]"
            >
              github
            </a>
            <button
              onClick={clearChat}
              className={`rounded-full border border-white/55 bg-white/60 px-3 py-2 text-xs font-medium text-[#11367b] transition hover:border-[#9bdfff] hover:text-[#0b52d8] ${
                showNewChat ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              title="New chat"
            >
              <span className="inline-flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                new chat
              </span>
            </button>
          </div>
        </div>
      </header>

      {!hasMessages ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          <div className="mb-8 text-center animate-rise-in">
            <p className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#081325]">
              Start a conversation
            </p>
          </div>

          <ChatInput showDisclaimer={false} animated />

          <div className="mt-6 flex max-w-3xl flex-wrap justify-center gap-2 animate-rise-in-delayed">
            {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
              <button
                key={label}
                onClick={() => send(prompt)}
                className="rounded-full border border-white/55 bg-white/62 px-4 py-2 text-xs text-[#44617f] shadow-[0_10px_24px_rgba(21,83,177,0.08)] transition-colors hover:border-[#81d8ff] hover:text-[#0b52d8] cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          <EngineerWorkflowPresets />
        </div>
      ) : (
        <>
          <main
            ref={scrollRef}
            className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 animate-fade-in"
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {!isReady && <StatusBar />}

              {messages.map((msg, i) => {
                const isLast =
                  i === messages.length - 1 && msg.role === "assistant";
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    index={i}
                    isStreaming={isGenerating && isLast}
                    thinkingSeconds={
                      isLast
                        ? thinkingSeconds
                        : thinkingSecondsMapRef.current.get(msg.id)
                    }
                    isGenerating={isGenerating}
                  />
                );
              })}
            </div>
          </main>

          <footer className="relative z-10 flex-none px-4 py-3 animate-fade-in">
            {isReady && (
              <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-[-8px] flex justify-center">
                <div className="pointer-events-auto">
                  <StatusBar />
                </div>
              </div>
            )}
            <ChatInput showDisclaimer animated />
          </footer>
        </>
      )}
    </div>
  );
}
