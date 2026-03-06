import { useMemo, useState } from "react";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { useLLM } from "../hooks/useLLM";

interface AgentModeControlsProps {
  compact?: boolean;
}

const ENGINEER_SYSTEM_PRESETS = [
  {
    id: "review",
    label: "Review",
    prompt:
      "Act as a senior engineer. Prioritize bugs, regressions, missing tests, security issues, and performance risks. Be direct.",
  },
  {
    id: "debug",
    label: "Debug",
    prompt:
      "Act as a debugging partner. Isolate the failure, identify likely root causes, propose fast verification steps, and only then suggest fixes.",
  },
  {
    id: "refactor",
    label: "Refactor",
    prompt:
      "Act as a pragmatic refactoring partner. Improve structure while preserving behavior, minimizing churn, and calling out tradeoffs.",
  },
] as const;

export function AgentModeControls({ compact }: AgentModeControlsProps) {
  const {
    agentMode,
    setAgentMode,
    ollamaConfig,
    updateOllamaConfig,
    ollamaModels,
    refreshOllamaModels,
  } = useLLM();
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isOllamaReady = useMemo(
    () => Boolean(ollamaConfig.baseUrl.trim() && ollamaConfig.model.trim()),
    [ollamaConfig],
  );

  const refreshModels = async () => {
    setIsRefreshing(true);
    try {
      await refreshOllamaModels();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "justify-center"}`}>
        <div className="inline-flex rounded-full border border-white/60 bg-white/62 p-1 shadow-[0_10px_30px_rgba(21,83,177,0.08)]">
          <button
            onClick={() => setAgentMode("local")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              agentMode === "local"
                ? "bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_46%,#72ecff_100%)] text-white"
                : "text-[#2d4a6d]"
            }`}
          >
            Local
          </button>
          <button
            onClick={() => setAgentMode("ollama")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              agentMode === "ollama"
                ? "bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_46%,#72ecff_100%)] text-white"
                : "text-[#2d4a6d]"
            }`}
          >
            Ollama
          </button>
        </div>

        {agentMode === "ollama" && (
          <button
            onClick={() => setOpen(true)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
              isOllamaReady
                ? "border-white/60 bg-white/62 text-[#123a7c]"
                : "border-[#7ecfff] bg-[#eaf8ff] text-[#0b52d8]"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {compact ? "ollama" : "configure ollama"}
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06162d]/35 px-4 backdrop-blur-sm">
          <div className="brand-chrome w-full max-w-3xl rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="font-support text-[11px] uppercase tracking-[0.28em] text-[#2753ba]">
                Ollama connection
              </p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/60 bg-white/65 px-3 py-1.5 text-xs font-medium text-[#123a7c]"
              >
                done
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 rounded-[1.35rem] border border-[#cce6ff] bg-[#eef8ff] px-4 py-3 text-sm text-[#24486e]">
                Ollama works when this app is run locally, or when the Ollama endpoint is reachable over HTTPS. A deployed frontend cannot call a user's local `http://127.0.0.1:11434` directly from Vercel or Render.
              </div>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                  Base URL
                </span>
                <div className="flex gap-2">
                  <input
                    value={ollamaConfig.baseUrl}
                    onChange={(e) =>
                      updateOllamaConfig({ baseUrl: e.target.value })
                    }
                    className="w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                    placeholder="http://127.0.0.1:11434"
                  />
                  <button
                    onClick={refreshModels}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-[#123a7c]"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    connect
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                  Model
                </span>
                <input
                  value={ollamaConfig.model}
                  onChange={(e) =>
                    updateOllamaConfig({ model: e.target.value })
                  }
                  list="ollama-models"
                  className="w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                  placeholder="qwen2.5-coder:latest"
                />
                <datalist id="ollama-models">
                  {ollamaModels.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                  Max tokens
                </span>
                <input
                  type="number"
                  min={128}
                  max={8192}
                  step={128}
                  value={ollamaConfig.numPredict}
                  onChange={(e) =>
                    updateOllamaConfig({
                      numPredict: Number(e.target.value) || 2048,
                    })
                  }
                  className="w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                  Temperature
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={ollamaConfig.temperature}
                  onChange={(e) =>
                    updateOllamaConfig({
                      temperature: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <p className="mt-1 text-xs text-[#45617e]">
                  {ollamaConfig.temperature.toFixed(2)}
                </p>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                  System prompt
                </span>
                <textarea
                  value={ollamaConfig.systemPrompt}
                  onChange={(e) =>
                    updateOllamaConfig({ systemPrompt: e.target.value })
                  }
                  className="min-h-32 w-full rounded-2xl border border-[#cce6ff] bg-white/80 px-4 py-3 text-sm text-[#081325] outline-none transition focus:border-[#1f7dff] focus:ring-2 focus:ring-[#99dfff]"
                  placeholder="Optional system instruction"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#45617e]">
                Engineer presets
              </p>
              <div className="flex flex-wrap gap-2">
                {ENGINEER_SYSTEM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      updateOllamaConfig({ systemPrompt: preset.prompt })
                    }
                    className="rounded-full border border-white/60 bg-white/65 px-3 py-1.5 text-xs text-[#2d4a6d] transition hover:border-[#7ecfff] hover:text-[#0b52d8]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
