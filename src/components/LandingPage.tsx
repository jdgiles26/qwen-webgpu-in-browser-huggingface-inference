import { useState, useEffect } from "react";
import {
  Loader2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type { LoadingStatus } from "../hooks/LLMContext";
import { FloatingGhost } from "./FloatingGhost";
import { AgentModeControls } from "./AgentModeControls";
import { useLLM } from "../hooks/useLLM";

interface LandingPageProps {
  onStart: () => void;
  status: LoadingStatus;
  isLoading: boolean;
  showChat: boolean;
}

export function LandingPage({
  onStart,
  status,
  isLoading,
  showChat,
}: LandingPageProps) {
  const { agentMode } = useLLM();
  const [introFade, setIntroFade] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntroFade(false), 50);
    return () => clearTimeout(t);
  }, []);

  const hideMainContent = isLoading || showChat;
  const readyToStart = status.state === "ready";

  return (
    <div className="brand-surface relative flex h-full min-h-full flex-col overflow-x-hidden overflow-y-auto text-[#07162d]">
      <div className="landing-brand-glow absolute inset-0" />
      <div className="brand-grid" />
      <FloatingGhost />

      <div
        className={`absolute inset-0 z-50 bg-[#ecf9ff] transition-opacity duration-1000 pointer-events-none ${
          introFade ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative z-10 mx-auto flex min-h-full w-full max-w-7xl flex-col px-6 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8 lg:px-14 transition-all duration-700 ${
          hideMainContent
            ? "pointer-events-none translate-y-4 opacity-0"
            : "opacity-100"
        }`}
      >
        <header className="animate-rise-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-support text-[11px] uppercase tracking-[0.35em] text-[#2753ba]">
            dabbledabble
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/jdgiles26"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/55 bg-white/55 px-4 py-2 text-xs font-medium text-[#11367b] shadow-[0_8px_30px_rgba(14,82,183,0.12)] backdrop-blur-md transition hover:border-[#9bdfff] hover:text-[#0b52d8]"
            >
              github
            </a>
          </div>
        </header>

        <section className="mt-10 flex flex-col items-center text-center sm:mt-14 lg:mt-16">
          <div className="animate-rise-in-delayed space-y-5">
            <p className="font-support text-xs uppercase tracking-[0.3em] text-[#2e64c7]">
              MDG | dabbledabble | github
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-[0.94] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Private AI workspace
              <br />
              built for the browser.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#234061] sm:text-lg">
              Local reasoning, liquid motion, and a cleaner chrome-blue interface.
            </p>
          </div>
        </section>

        <section className="mt-8 sm:mt-10">
          <div className="brand-chrome animate-rise-in mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 rounded-[1.8rem] px-6 py-5 text-center">
            <Sparkles className="h-5 w-5 text-[#0b52d8]" />
            <p className="text-sm text-[#2d4a6d] sm:text-base">
              Pick local WebGPU or connect your own Ollama instance.
            </p>
            {agentMode === "ollama" && (
              <p className="max-w-2xl text-xs leading-relaxed text-[#45617e]">
                Reminder: direct Ollama localhost access works in local development. For a deployed app, use an HTTPS-accessible Ollama endpoint or proxy.
              </p>
            )}
          </div>
        </section>

        <section
          className="mt-8 flex flex-col items-center animate-rise-in sm:mt-10 lg:mt-12"
          style={{ animationDelay: "400ms" }}
        >
          <AgentModeControls />
          <button
            onClick={onStart}
            className="mt-5 inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-[1.4rem] bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_46%,#72ecff_100%)] px-6 py-4 text-base font-semibold text-white shadow-[0_20px_40px_rgba(31,125,255,0.32)] transition duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            {readyToStart
              ? agentMode === "ollama"
                ? "Use Ollama"
                : "Open workspace"
              : agentMode === "ollama"
                ? "Connect Ollama"
                : "Load model"}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      <div
        className={`brand-surface absolute inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-700 ${
          isLoading ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`brand-chrome flex w-full max-w-md flex-col items-center rounded-[2rem] px-6 py-8 transition-all duration-700 ${
            isLoading ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="hero-logo">
            <span className="text-base font-semibold tracking-[0.24em] text-[#1f63db]">
              MDG
            </span>
            <span className="hero-eye" />
          </div>
          <Loader2 className="mt-8 h-10 w-10 animate-spin text-[#0b52d8]" />
          <p className="mt-4 text-sm tracking-wide text-[#31506f]">
            {status.state === "loading"
              ? (status.message ?? "Loading…")
              : status.state === "error"
                ? "Error"
                : "Preparing…"}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#cae7ff]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0b52d8_0%,#1f7dff_55%,#8ff2ff_100%)] transition-[width] duration-300 ease-out"
              style={{
                width: `${status.state === "ready" ? 100 : status.state === "loading" && status.progress != null ? status.progress : 0}%`,
              }}
            />
          </div>
          {status.state === "error" && (
            <p className="mt-3 text-sm text-red-600">{status.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
