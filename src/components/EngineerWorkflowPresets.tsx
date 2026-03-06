import { useLLM } from "../hooks/useLLM";

const WORKFLOWS = [
  {
    label: "Debug a failure",
    prompt:
      "You are debugging with me. I will give you an error, logs, or behavior. First isolate the likely root cause. Then give the fastest verification steps. Then propose the smallest safe fix.\n\nContext:\n",
  },
  {
    label: "Refactor safely",
    prompt:
      "Refactor this code like a senior engineer. Preserve behavior, reduce complexity, call out risks, and show the final improved version.\n\nCode:\n",
  },
  {
    label: "Generate tests",
    prompt:
      "Write focused tests for this code. Cover the highest-risk paths first, explain what each test protects, and include edge cases.\n\nCode:\n",
  },
  {
    label: "Review architecture",
    prompt:
      "Review this design like a principal engineer. Identify correctness risks, scaling limits, operational concerns, and a better structure if needed.\n\nDesign:\n",
  },
  {
    label: "Security review",
    prompt:
      "Perform a security review. Prioritize auth, data exposure, injection, secrets handling, and privilege boundaries. Be concrete and actionable.\n\nCode or flow:\n",
  },
] as const;

export function EngineerWorkflowPresets() {
  const { send, status, isGenerating } = useLLM();
  const isReady = status.state === "ready" && !isGenerating;

  return (
    <div className="mt-8 w-full max-w-5xl animate-rise-in-delayed">
      <p className="mb-3 text-center font-support text-[11px] uppercase tracking-[0.22em] text-[#45617e]">
        Engineer workflows
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {WORKFLOWS.map((workflow) => (
          <button
            key={workflow.label}
            onClick={() => send(workflow.prompt)}
            disabled={!isReady}
            className="brand-chrome rounded-[1.4rem] px-4 py-4 text-left text-sm text-[#163253] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {workflow.label}
          </button>
        ))}
      </div>
    </div>
  );
}
