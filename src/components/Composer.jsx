import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Paperclip, ArrowUp, FileCheck2 } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { useDictation } from "@/hooks/useDictation.js";
import { analyse } from "@/lib/analyse.js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/* Pinned to the bottom, where a composer belongs. One place to
   talk, whether you're dumping the whole night or answering a
   four-word question. No mode switch between the two. */

const THINK_MS = 650;

export default function Composer() {
  const report = useReport();
  const [text, setText] = useState("");
  /* Read through a guard: this is used in the render body, and a
     non-string here takes the whole tree down with it. */
  const typed = typeof text === "string" ? text : "";
  const boxRef = useRef(null);
  const timer = useRef(null);

  /* Dictated phrases land in the composer, not straight into the
     thread — the manager still decides when to send. */
  const mic = useDictation({
    onFinal: (phrase) =>
      setText((prev) => (prev ? `${prev.replace(/\s$/, "")} ${phrase}` : phrase)),
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = () => {
    const value = typed.trim();
    if (!value) return;
    setText("");
    if (mic.listening) mic.stop();
    report.think();
    boxRef.current?.focus();

    /* analyse() answers from the model when a key is configured and
       from the local detector when it isn't — it never rejects, so
       there's no error branch to get wrong here. */
    analyse(value).then((analysis) => report.say(value, analysis));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl px-6 py-3">
        {mic.listening && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2">
            <span className="relative mt-1 flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <p className="min-h-4 flex-1 text-sm leading-relaxed text-muted-foreground italic">
              {mic.interim || "listening…"}
            </p>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-lg border border-border bg-card p-2 shadow-sm focus-within:border-primary">
          <Textarea
            ref={boxRef}
            autoFocus
            rows={1}
            value={typed}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              report.pending
                ? "Answer, or say what actually happened…"
                : report.mode === "quick"
                  ? "What's just happened?"
                  : "Tell it about tonight…"
            }
            className="max-h-40 min-h-9 resize-none border-0 bg-transparent px-1.5 py-1.5 text-sm leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
          />

          <Button
            size="icon-sm"
            variant={mic.listening ? "default" : "ghost"}
            disabled={!mic.supported}
            title={mic.supported ? "Dictate" : "Needs Chrome, Edge or Safari"}
            onClick={mic.toggle}
          >
            {mic.listening ? <MicOff /> : <Mic />}
          </Button>
          <Button size="icon-sm" variant="ghost" title="Attach (stubbed)">
            <Paperclip />
          </Button>
          <Button size="icon-sm" disabled={!typed.trim()} onClick={send} title="Send">
            <ArrowUp />
          </Button>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {mic.error
              ? mic.error
              : report.pending
                ? "Answer in your own words — it fills the record."
                : "Enter to send · Shift+Enter for a new line"}
          </span>
          <div className="flex-1" />
          {report.mode !== "quick" && report.logged.length > 0 && (
            <Button size="xs" variant="outline" onClick={report.toSummary}>
              <FileCheck2 />
              Finish up · {report.logged.length}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
