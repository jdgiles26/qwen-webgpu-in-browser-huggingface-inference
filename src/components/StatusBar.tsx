import { Loader2 } from "lucide-react";
import { useLLM } from "../hooks/useLLM";

export function StatusBar() {
  const { status, tps, isGenerating } = useLLM();

  if (status.state === "loading") {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-[#6d6d6d]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5505af]" />
        <p className="text-sm">{status.message ?? "Loading model…"}</p>
        {status.progress != null && (
          <div className="w-64 h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5505af]"
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
      <div className="text-center text-xs text-[#6d6d6d] py-1">
        {tps} tokens/s
      </div>
    );
  }

  return null;
}
