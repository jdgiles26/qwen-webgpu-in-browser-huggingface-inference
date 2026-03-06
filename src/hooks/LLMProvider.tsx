import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  pipeline,
  TextStreamer,
  InterruptableStoppingCriteria,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { ThinkStreamParser, type ThinkDelta } from "../utils/think-parser";
import {
  LLMContext,
  createMessageId,
  type AgentMode,
  type ChatMessage,
  type LoadingStatus,
  type OllamaConfig,
  type ReasoningEffort,
} from "./LLMContext";

const MODEL_ID = "LiquidAI/LFM2.5-1.2B-Thinking-ONNX";
const DTYPE = "q4";
const MODE_KEY = "mdg.agent-mode";
const OLLAMA_CONFIG_KEY = "mdg.ollama-config";
const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: "http://127.0.0.1:11434",
  model: "",
  systemPrompt: "",
  temperature: 0.2,
  numPredict: 2048,
};

function applyDeltas(msg: ChatMessage, deltas: ThinkDelta[]): ChatMessage {
  let { content, reasoning = "" } = msg;
  for (const delta of deltas) {
    if (delta.type === "reasoning") reasoning += delta.textDelta;
    else content += delta.textDelta;
  }
  return { ...msg, content, reasoning };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function hasOllamaConfig(config: OllamaConfig): boolean {
  return Boolean(config.baseUrl.trim() && config.model.trim());
}

function validateOllamaBrowserAccess(baseUrl: string): string | null {
  if (typeof window === "undefined") return null;

  const normalized = normalizeBaseUrl(baseUrl);
  const pageProtocol = window.location.protocol;
  const targetIsHttp = normalized.startsWith("http://");
  const targetIsLocal =
    normalized.includes("127.0.0.1") || normalized.includes("localhost");

  if (pageProtocol === "https:" && targetIsHttp && targetIsLocal) {
    return "HTTPS deployments cannot call local Ollama over plain HTTP. Use local dev or expose Ollama through an HTTPS proxy.";
  }

  return null;
}

function extractOllamaMessage(payload: unknown): string {
  const content = (payload as any)?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function extractOllamaModels(payload: unknown): string[] {
  const models = (payload as any)?.models;
  if (!Array.isArray(models)) return [];
  return models
    .map((item) => item?.model || item?.name)
    .filter((value): value is string => typeof value === "string");
}

export function LLMProvider({ children }: { children: ReactNode }) {
  const generatorRef = useRef<Promise<TextGenerationPipeline> | null>(null);
  const stoppingCriteria = useRef(new InterruptableStoppingCriteria());
  const remoteAbortRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<LoadingStatus>({ state: "idle" });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [tps, setTps] = useState(0);
  const [agentMode, setAgentModeState] = useState<AgentMode>("local");
  const [ollamaConfig, setOllamaConfig] =
    useState<OllamaConfig>(DEFAULT_OLLAMA_CONFIG);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>("medium");

  messagesRef.current = messages;
  isGeneratingRef.current = isGenerating;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMode = window.localStorage.getItem(MODE_KEY);
    if (storedMode === "local" || storedMode === "ollama") {
      setAgentModeState(storedMode);
    }

    const storedConfig = window.localStorage.getItem(OLLAMA_CONFIG_KEY);
    if (!storedConfig) return;

    try {
      const parsed = JSON.parse(storedConfig) as Partial<OllamaConfig>;
      setOllamaConfig({
        ...DEFAULT_OLLAMA_CONFIG,
        ...parsed,
      });
    } catch {
      setOllamaConfig(DEFAULT_OLLAMA_CONFIG);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MODE_KEY, agentMode);
  }, [agentMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(OLLAMA_CONFIG_KEY, JSON.stringify(ollamaConfig));
  }, [ollamaConfig]);

  useEffect(() => {
    if (isGeneratingRef.current) return;

    if (agentMode === "local") {
      setStatus(generatorRef.current ? { state: "ready" } : { state: "idle" });
      return;
    }

    setStatus(hasOllamaConfig(ollamaConfig) ? { state: "ready" } : { state: "idle" });
  }, [agentMode, ollamaConfig]);

  const setAgentMode = useCallback((mode: AgentMode) => {
    setAgentModeState(mode);
  }, []);

  const updateOllamaConfig = useCallback((config: Partial<OllamaConfig>) => {
    setOllamaConfig((prev) => ({ ...prev, ...config }));
  }, []);

  const refreshOllamaModels = useCallback(async () => {
    const accessError = validateOllamaBrowserAccess(ollamaConfig.baseUrl);
    if (accessError) {
      setStatus({ state: "error", error: accessError });
      return;
    }

    if (!ollamaConfig.baseUrl.trim()) {
      setStatus({ state: "error", error: "Enter an Ollama base URL first." });
      return;
    }

    try {
      setStatus({ state: "loading", message: "Fetching models…" });
      const response = await fetch(
        `${normalizeBaseUrl(ollamaConfig.baseUrl)}/api/tags`,
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const models = extractOllamaModels(payload);
      setOllamaModels(models);
      if (!ollamaConfig.model && models[0]) {
        setOllamaConfig((prev) => ({ ...prev, model: models[0] }));
      }
      setStatus(models.length > 0 ? { state: "ready" } : { state: "idle" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({
        state: "error",
        error: `Could not reach Ollama. ${message}`,
      });
    }
  }, [ollamaConfig.baseUrl, ollamaConfig.model]);

  const loadModel = useCallback(() => {
    if (agentMode === "ollama") {
      const accessError = validateOllamaBrowserAccess(ollamaConfig.baseUrl);
      if (accessError) {
        setStatus({ state: "error", error: accessError });
        return;
      }

      if (!hasOllamaConfig(ollamaConfig)) {
        setStatus({
          state: "error",
          error: "Choose an Ollama endpoint and model.",
        });
        return;
      }

      setStatus({ state: "loading", message: "Connecting to Ollama…" });

      fetch(`${normalizeBaseUrl(ollamaConfig.baseUrl)}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaConfig.model,
          stream: false,
          keep_alive: "15m",
          messages: [],
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          setStatus({ state: "ready" });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          setStatus({ state: "error", error: message });
        });
      return;
    }

    if (generatorRef.current) return;

    generatorRef.current = (async () => {
      setStatus({ state: "loading", message: "Downloading model…" });
      try {
        const gen = await pipeline("text-generation", MODEL_ID, {
          dtype: DTYPE,
          device: "webgpu",
          progress_callback: (p: any) => {
            if (p.status !== "progress" || !p.file?.endsWith(".onnx_data")) return;
            setStatus({
              state: "loading",
              progress: p.progress,
              message: `Downloading model… ${Math.round(p.progress)}%`,
            });
          },
        });
        setStatus({ state: "ready" });
        return gen;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setStatus({ state: "error", error: msg });
        generatorRef.current = null;
        throw err;
      }
    })();
  }, [agentMode, ollamaConfig]);

  const runLocalGeneration = useCallback(async (chatHistory: ChatMessage[]) => {
    const generator = await generatorRef.current!;
    setIsGenerating(true);
    setTps(0);
    stoppingCriteria.current.reset();

    const parser = new ThinkStreamParser();
    let tokenCount = 0;
    let firstTokenTime = 0;

    const assistantIdx = chatHistory.length;
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "assistant", content: "", reasoning: "" },
    ]);

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: false,
      callback_function: (output: string) => {
        if (output === "<|im_end|>") return;
        const deltas = parser.push(output);
        if (deltas.length === 0) return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = applyDeltas(updated[assistantIdx], deltas);
          return updated;
        });
      },
      token_callback_function: () => {
        tokenCount++;
        if (tokenCount === 1) {
          firstTokenTime = performance.now();
        } else {
          const elapsed = (performance.now() - firstTokenTime) / 1000;
          if (elapsed > 0) {
            setTps(Math.round(((tokenCount - 1) / elapsed) * 10) / 10);
          }
        }
      },
    });

    try {
      await generator(
        chatHistory.map((m) => ({ role: m.role, content: m.content })),
        {
          max_new_tokens: 65536,
          streamer,
          stopping_criteria: stoppingCriteria.current,
          do_sample: false,
        },
      );
    } catch (err) {
      console.error("Generation error:", err);
    }

    const remaining = parser.flush();
    if (remaining.length > 0) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIdx] = applyDeltas(updated[assistantIdx], remaining);
        return updated;
      });
    }

    setMessages((prev) => {
      const updated = [...prev];
      updated[assistantIdx] = {
        ...updated[assistantIdx],
        content: parser.content.trim() || prev[assistantIdx].content,
        reasoning: parser.reasoning.trim() || prev[assistantIdx].reasoning,
      };
      return updated;
    });

    setIsGenerating(false);
  }, []);

  const runOllamaGeneration = useCallback(
    async (chatHistory: ChatMessage[]) => {
      const accessError = validateOllamaBrowserAccess(ollamaConfig.baseUrl);
      if (accessError) {
        setStatus({ state: "error", error: accessError });
        return;
      }

      if (!hasOllamaConfig(ollamaConfig)) {
        setStatus({
          state: "error",
          error: "Choose an Ollama endpoint and model.",
        });
        return;
      }

      setIsGenerating(true);
      setTps(0);

      const assistantIdx = chatHistory.length;
      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: "assistant", content: "" },
      ]);

      const controller = new AbortController();
      remoteAbortRef.current = controller;

      try {
        const response = await fetch(
          `${normalizeBaseUrl(ollamaConfig.baseUrl)}/api/chat`,
          {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ollamaConfig.model,
              stream: false,
              options: {
                temperature: ollamaConfig.temperature,
                num_predict: ollamaConfig.numPredict,
              },
              messages: [
                ...(ollamaConfig.systemPrompt.trim()
                  ? [
                      {
                        role: "system",
                        content: ollamaConfig.systemPrompt.trim(),
                      },
                    ]
                  : []),
                ...chatHistory.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
              ],
            }),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const payload = await response.json();
        const content = extractOllamaMessage(payload);
        const evalCount = (payload as any)?.eval_count;
        const evalDuration = (payload as any)?.eval_duration;
        if (
          typeof evalCount === "number" &&
          typeof evalDuration === "number" &&
          evalDuration > 0
        ) {
          setTps(Math.round((evalCount / (evalDuration / 1_000_000_000)) * 10) / 10);
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = {
            ...updated[assistantIdx],
            content: content || "No response.",
          };
          return updated;
        });
        setStatus({ state: "ready" });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, assistantIdx));
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setStatus({ state: "error", error: message });
          setMessages((prev) => prev.slice(0, assistantIdx));
        }
      } finally {
        remoteAbortRef.current = null;
        setIsGenerating(false);
      }
    },
    [ollamaConfig],
  );

  const runGeneration = useCallback(
    async (chatHistory: ChatMessage[]) => {
      if (agentMode === "ollama") {
        await runOllamaGeneration(chatHistory);
        return;
      }

      await runLocalGeneration(chatHistory);
    },
    [agentMode, runLocalGeneration, runOllamaGeneration],
  );

  const send = useCallback(
    (text: string) => {
      if (isGeneratingRef.current) return;
      if (agentMode === "local" && !generatorRef.current) return;
      if (agentMode === "ollama" && !hasOllamaConfig(ollamaConfig)) {
        setStatus({
          state: "error",
          error: "Choose an Ollama endpoint and model.",
        });
        return;
      }

      const userMsg: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      runGeneration([...messagesRef.current, userMsg]);
    },
    [agentMode, ollamaConfig, runGeneration],
  );

  const stop = useCallback(() => {
    stoppingCriteria.current.interrupt();
    remoteAbortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    if (isGeneratingRef.current) return;
    setMessages([]);
  }, []);

  const editMessage = useCallback(
    (index: number, newContent: string) => {
      if (isGeneratingRef.current) return;

      setMessages((prev) => {
        const updated = prev.slice(0, index);
        updated.push({ ...prev[index], content: newContent });
        return updated;
      });

      const updatedHistory = messagesRef.current.slice(0, index);
      updatedHistory.push({
        ...messagesRef.current[index],
        content: newContent,
      });

      if (messagesRef.current[index]?.role === "user") {
        setTimeout(() => runGeneration(updatedHistory), 0);
      }
    },
    [runGeneration],
  );

  const retryMessage = useCallback(
    (index: number) => {
      if (isGeneratingRef.current) return;

      const history = messagesRef.current.slice(0, index);
      setMessages(history);
      setTimeout(() => runGeneration(history), 0);
    },
    [runGeneration],
  );

  return (
    <LLMContext.Provider
      value={{
        status,
        messages,
        isGenerating,
        tps,
        agentMode,
        setAgentMode,
        ollamaConfig,
        updateOllamaConfig,
        ollamaModels,
        refreshOllamaModels,
        reasoningEffort,
        setReasoningEffort,
        loadModel,
        send,
        stop,
        clearChat,
        editMessage,
        retryMessage,
      }}
    >
      {children}
    </LLMContext.Provider>
  );
}
