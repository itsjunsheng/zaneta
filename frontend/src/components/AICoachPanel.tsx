import { useEffect, useState } from "react";
import type { CoachChatMessage, CoachResponse, Misconception } from "../types";

type AICoachPanelProps = {
  coach: CoachResponse;
  misconceptions: Misconception[];
  onAsk: (message: string, history: CoachChatMessage[]) => Promise<{ reply: string; source: "openai" | "template" }>;
};

export const AICoachPanel = ({ coach, misconceptions, onAsk }: AICoachPanelProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [lastSource, setLastSource] = useState<"openai" | "template">(coach.source);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [{ role: "assistant", content: coach.message }];
    });
    setLastSource(coach.source);
  }, [coach.message, coach.source]);

  const submit = async () => {
    const message = input.trim();
    if (!message || pending) return;

    const nextHistory = [...messages, { role: "user", content: message }] as CoachChatMessage[];
    setMessages(nextHistory);
    setInput("");
    setChatError(null);
    setPending(true);

    try {
      const result = await onAsk(message, nextHistory);
      setLastSource(result.source);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      setChatError("Coach is temporarily unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">AI Coach</h3>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
          Source: {lastSource}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {coach.bullets.map((bullet) => (
          <li key={bullet} className="rounded-md bg-slate-50 px-2 py-1">
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-3 max-h-48 space-y-2 overflow-auto rounded-lg bg-slate-50 p-3">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`rounded-md px-3 py-2 text-sm ${msg.role === "assistant" ? "bg-sky-100 text-slate-800" : "bg-slate-900 text-white"}`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Ask the coach: Why Algebra Readiness next?"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-200 focus:ring"
        />
        <button
          onClick={() => void submit()}
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          Send
        </button>
      </div>
      {chatError ? <p className="mt-2 text-xs text-rose-600">{chatError}</p> : null}

      <div className="mt-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Misconception Flags
        </h4>
        <div className="mt-2 space-y-2">
          {misconceptions.length === 0 ? (
            <p className="text-sm text-slate-500">No repeated misconception pattern detected yet.</p>
          ) : (
            misconceptions.map((misconception) => (
              <div key={`${misconception.conceptId}-${misconception.errorType}`} className="rounded-lg bg-rose-50 p-3">
                <p className="text-sm font-medium text-rose-700">
                  {misconception.conceptId}: {misconception.errorType.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-rose-600">Observed {misconception.count} times</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
