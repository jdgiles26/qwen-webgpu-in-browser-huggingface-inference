import { useState, useRef, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";
import { createMathPlugin } from "@streamdown/math";
import {
  Pencil,
  X,
  Check,
  RotateCcw,
  Copy,
  ClipboardCheck,
} from "lucide-react";

import { useLLM } from "../hooks/useLLM";
import { ReasoningBlock } from "./ReasoningBlock";
import type { ChatMessage } from "../hooks/LLMContext";

const math = createMathPlugin({ singleDollarTextMath: true });

interface MessageBubbleProps {
  msg: ChatMessage;
  index: number;
  isStreaming?: boolean;
  thinkingSeconds?: number;
  isGenerating: boolean;
}

// LaTeX commands to auto-wrap with $…$ when found outside math context.
// `args` is the number of consecutive {…} groups the command consumes.
const MATH_COMMANDS: { prefix: string; args: number }[] = [
  { prefix: "\\boxed{", args: 1 },
  { prefix: "\\text{", args: 1 },
  { prefix: "\\textbf{", args: 1 },
  { prefix: "\\mathbf{", args: 1 },
  { prefix: "\\mathrm{", args: 1 },
  { prefix: "\\frac{", args: 2 },
];

/** Advance past a single `{…}` group (including nested braces). */
function skipBraceGroup(content: string, start: number): number {
  let depth = 1;
  let j = start;
  while (j < content.length && depth > 0) {
    if (content[j] === "{") depth++;
    else if (content[j] === "}") depth--;
    j++;
  }
  return j;
}

function wrapLatexMath(content: string): string {
  let result = "";
  let i = 0;
  // Track math context: null = not in math, "$" = inline, "$$" = display
  let mathContext: null | "$" | "$$" = null;

  while (i < content.length) {
    const cmd = !mathContext
      ? MATH_COMMANDS.find((c) => content.startsWith(c.prefix, i))
      : undefined;

    if (cmd) {
      let j = skipBraceGroup(content, i + cmd.prefix.length);

      for (let a = 1; a < cmd.args; a++) {
        if (content[j] === "{") {
          j = skipBraceGroup(content, j + 1);
        }
      }

      const expr = content.slice(i, j);
      result += "$" + expr + "$";
      i = j;
    } else if (content[i] === "$") {
      // Check for $$ (display math) vs $ (inline math)
      const isDouble = content[i + 1] === "$";
      const token = isDouble ? "$$" : "$";

      if (mathContext === token) {
        mathContext = null; // closing delimiter
      } else if (!mathContext) {
        mathContext = token; // opening delimiter
      }

      result += token;
      i += token.length;
    } else {
      result += content[i];
      i++;
    }
  }

  return result;
}

function prepareForMathDisplay(content: string): string {
  return wrapLatexMath(
    content
      .replace(/(?<!\\)\\\[/g, "$$$$")
      .replace(/\\\]/g, "$$$$")
      .replace(/(?<!\\)\\\(/g, "$$$$")
      .replace(/\\\)/g, "$$$$"),
  );
}

export function MessageBubble({
  msg,
  index,
  isStreaming,
  thinkingSeconds,
  isGenerating,
}: MessageBubbleProps) {
  const { editMessage, retryMessage } = useLLM();
  const isUser = msg.role === "user";
  const isThinking = !!isStreaming && !msg.content;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [msg.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleEdit = useCallback(() => {
    setEditValue(msg.content);
    setIsEditing(true);
  }, [msg.content]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(msg.content);
  }, [msg.content]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setIsEditing(false);
    editMessage(index, trimmed);
  }, [editValue, editMessage, index]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave],
  );

  if (isEditing) {
    return (
      <div className="flex justify-end">
        <div className="w-full max-w-[80%] flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded-2xl border border-[#d8ecff] bg-white/82 px-4 py-3 text-sm text-[#081325] placeholder-[#557296] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus:border-[#1f7dff] focus:outline-none focus:ring-2 focus:ring-[#a5e8ff]"
            rows={1}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/55 bg-white/60 px-3 py-1.5 text-xs font-medium text-[#557296] transition-colors hover:text-[#0b52d8]"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editValue.trim()}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_45%,#8ff2ff_100%)] px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
            >
              <Check className="h-3 w-3" />
              Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {isUser && !isGenerating && (
        <button
          onClick={handleEdit}
          className="mt-3 cursor-pointer text-[#557296] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#0b52d8]"
          title="Edit message"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-md bg-[linear-gradient(135deg,#0b52d8_0%,#1f7dff_45%,#89edff_100%)] text-white whitespace-pre-wrap shadow-[0_14px_32px_rgba(31,125,255,0.28)]"
            : "rounded-bl-md border border-[#d8ecff] bg-white/82 text-[#081325] shadow-[0_12px_30px_rgba(20,91,183,0.08)]"
        }`}
      >
        {!isUser && msg.reasoning && (
          <ReasoningBlock
            reasoning={msg.reasoning}
            isThinking={isThinking}
            thinkingSeconds={thinkingSeconds ?? 0}
          />
        )}

        {msg.content ? (
          isUser ? (
            msg.content
          ) : (
            <Streamdown
              plugins={{ math }}
              parseIncompleteMarkdown={false}
              isAnimating={isStreaming}
            >
              {prepareForMathDisplay(msg.content)}
            </Streamdown>
          )
        ) : !isUser && !isStreaming ? (
          <p className="italic text-[#557296]">No response</p>
        ) : null}
      </div>

      {!isUser && !isStreaming && !isGenerating && (
        <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {msg.content && (
            <button
              onClick={handleCopy}
              className="cursor-pointer rounded-md p-1 text-[#557296] transition-colors hover:bg-white/70 hover:text-[#0b52d8]"
              title="Copy response"
            >
              {copied ? (
                <ClipboardCheck className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => retryMessage(index)}
            className="cursor-pointer rounded-md p-1 text-[#557296] transition-colors hover:bg-white/70 hover:text-[#0b52d8]"
            title="Retry"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
