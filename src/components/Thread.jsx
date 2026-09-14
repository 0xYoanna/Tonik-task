import { useEffect, useRef } from "react";
import { useReport } from "../state/useReport.js";
import RecordCard from "./RecordCard.jsx";
import Checklist from "./Checklist.jsx";
import QuickStart from "./QuickStart.jsx";
import { evidence } from "../data/sampleShift.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* The conversation. Grows upward from the composer, like every
   chat anyone has ever used — which is the point: no one needs
   teaching where to look or where to type. */

function Bubble({ children }) {
  return (
    <div className="max-w-[42rem] rounded-lg rounded-tl-sm bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-sm">
      {children}
    </div>
  );
}

function Mine({ children }) {
  return (
    <div className="ml-auto max-w-[36rem] rounded-lg rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-white">
      {children}
    </div>
  );
}

export default function Thread() {
  const report = useReport();
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [report.thread.length, report.thinking]);

  /* On a mid-shift log the pointers open the thread and then STAY
     there, scrolling up like any other message. Before anything is
     said they sit at the bottom, where the manager is about to
     type; afterwards they're just the top of the history. */
  const quick = report.mode === "quick";
  const untouched = quick && !report.thread.some((m) => m.role === "manager");

  const messages = (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-6 py-6">
      {report.thread.map((m) => {
        /* Checked before the role shortcut — an attachment is the
           manager's, but it isn't a text bubble. */
        if (m.kind === "attachment")
          return (
            <div key={m.id} className="ml-auto max-w-[18rem] overflow-hidden rounded-lg border bg-card shadow-sm">
              <img
                src={m.src}
                alt={m.label}
                className="max-h-56 w-full bg-muted object-cover object-top"
              />
              <div className="px-3 py-2">
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-xs text-muted-foreground">
                  Attached to tonight's report
                </div>
              </div>
            </div>
          );

        if (m.role === "manager") return <Mine key={m.id}>{m.text}</Mine>;

        /* What it already knew, before anyone typed anything. */
        if (m.kind === "context")
          return (
            <p key={m.id} className="text-sm leading-relaxed text-muted-foreground tabular-nums">
              {m.text}
            </p>
          );

        /* The recommended thirteen. Lives in the opening message
           and ticks itself as the manager talks. */
        if (m.kind === "checklist")
          return (
            <div key={m.id} className="max-w-[42rem] rounded-lg border bg-card p-3.5 shadow-sm">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Worth covering — none of it required
              </div>
              <Checklist />
            </div>
          );


        /* What it made of the handwriting. Proposed, not committed
           — every line is correctable, and the scan is kept
           whatever happens to the reading. */
        if (m.kind === "transcription")
          return (
            <div key={m.id} className="max-w-[42rem] rounded-lg border bg-card p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Read from the slip</span>
                <Badge variant="secondary">{evidence.note.from}'s handwriting</Badge>
              </div>
              <dl className="mt-2 space-y-1">
                {evidence.note.transcription.map((row) => (
                  <div key={row.field} className="flex gap-2 text-sm">
                    <dt className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                      {row.field}
                    </dt>
                    <dd className="flex-1">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {/* A blank beats a guess — including on handwriting. */}
              <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                {evidence.note.unreadable}
              </p>
            </div>
          );

        if (m.kind === "record") {
          const inc = report.byId(m.incidentId);
          return inc ? (
            <div key={m.id} className="max-w-[42rem]">
              <RecordCard incident={inc} />
            </div>
          ) : null;
        }

        if (m.kind === "record-group") {
          const group = m.ids.map(report.byId).filter(Boolean);
          return (
            <div key={m.id} className="max-w-[42rem] rounded-lg border border-border bg-card p-3.5 shadow-sm">
              <div className="text-xs font-medium text-muted-foreground mb-2 text-primary">
                {group.length} logged together
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.map((i) => (
                  <span key={i.id} className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                    {i.occurredAt ?? "--:--"}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {group[0]?.typeLabel} · {group[0]?.location ?? "front door"}
              </p>
            </div>
          );
        }

        return (
          <Bubble key={m.id}>
            {m.text}
            {/* Quick answers, so a four-word reply is one click. */}
            {m.question?.options && report.pending?.question?.key === m.question.key && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.question.options.map((opt) => (
                  <Button key={opt} size="xs" variant="outline" onClick={() => report.say(opt)}>
                    {opt}
                  </Button>
                ))}
              </div>
            )}
          </Bubble>
        );
      })}

      {report.thinking && (
        <div className="flex items-center gap-1.5 px-1 py-1">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-1.5 animate-bounce rounded-full bg-primary-faint"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      )}

      <div ref={bottom} />
    </div>
  );

  if (!quick) return messages;

  return (
    <div className={untouched ? "flex min-h-full flex-col justify-end" : "flex flex-col"}>
      <QuickStart opening={untouched} />
      {!untouched && messages}
    </div>
  );
}
