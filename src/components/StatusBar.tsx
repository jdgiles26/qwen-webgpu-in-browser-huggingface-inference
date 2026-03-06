import { Loader2 } from "lucide-react";
import { useLLM } from "../hooks/useLLM";

export function StatusBar() {
  const { status, tps, isGenerating } = useLLM();

  if (status.state === "loading") {
    return (
      <div className="brand-chrome flex flex-col items-center gap-2 rounded-[1.25rem] px-6 py-4 text-[#557296]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0b52d8]" />
        <p className="text-sm">{status.message ?? "Loading model…"}</p>
        {status.progress != null && (
          <div className="h-2 w-64 overflow-hidden rounded-full bg-[#d6ebff]">
            <div
              className="h-full bg-[linear-gradient(90deg,#0b52d8_0%,#1f7dff_55%,#8ff2ff_100%)]"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (status.state === "error") {
    return (
      <div className="py-12 text-center text-sm text-red-600">
        Error loading model: {status.error}
      </div>
    );
  }

  if (isGenerating && tps > 0) {
    return (
      <div className="rounded-full border border-white/60 bg-white/60 px-3 py-1 text-center text-xs text-[#557296] shadow-[0_8px_30px_rgba(21,83,177,0.08)]">
        {tps} tokens/s
      </div>
    );
  }

  return null;
}
