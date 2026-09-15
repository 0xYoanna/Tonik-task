import { useEffect, useRef } from "react";
import { useReport } from "../state/useReport.js";
import RecordCard from "./RecordCard.jsx";
import QuickStart from "./QuickStart.jsx";
import FullReport from "./FullReport.jsx";
import ReportStart from "./ReportStart.jsx";
import { evidence } from "../data/sampleShift.js";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

/* The conversation. Grows upward from the composer, like every
   chat anyone has ever used — which is the point: no one needs
   teaching where to look or where to type. */

/* No bubble on the replies. A card around every sentence makes
   the system look like another participant in a group chat; plain
   text on the page reads as the product speaking, and lines up
   with the opening text above it. */
function Reply({ children }) {
  return (
    <div className="max-w-[42rem] text-base leading-relaxed text-foreground">
      {children}
    </div>
  );
}

/* The manager's own words keep a bubble — theirs is the input,
   and it should read as visibly distinct from the response. */
function Mine({ children }) {
  return (
    <div className="ml-auto max-w-[32rem] rounded-2xl bg-muted px-4 py-2.5 text-base leading-relaxed text-foreground">
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 py-6">
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



        /* What it made of the handwriting. Proposed, not committed
           — every line is correctable, and the scan is kept
           whatever happens to the reading. */
        if (m.kind === "transcription")
          return (
            <div key={m.id} className="max-w-[42rem] rounded-lg border bg-card p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Read from the slip</span>
                <Badge variant="secondary">{evidence.note.from}&rsquo;s handwriting</Badge>
              </div>

              <div className="mt-1.5 text-xs text-muted-foreground">
                <div>{evidence.note.attribution}</div>
                <div className="tabular-nums">{evidence.note.ref}</div>
              </div>

              <dl className="mt-3 space-y-2 border-t pt-3">
                {evidence.note.transcription.map((row, i) =>
                  row.field ? (
                    <div key={i} className="flex gap-2 text-sm">
                      <dt className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                        {row.field}
                      </dt>
                      <dd className="flex-1 leading-relaxed">
                        {row.value.split("\n").map((line, j) => (
                          <div key={j}>{line}</div>
                        ))}
                      </dd>
                    </div>
                  ) : (
                    /* Lines the door team wrote without a heading —
                       kept as their own paragraphs rather than
                       forced into a field they don't belong to. */
                    <p key={i} className="pl-30 text-sm leading-relaxed">
                      {row.value}
                    </p>
                  ),
                )}
              </dl>
            </div>
          );

        /* The document, as it will be filed — register entries,
           the written account, and the evidence attached to each. */
        if (m.kind === "narrative")
          return <FullReport key={m.id} narrative={m.narrative} />;

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
          <Reply key={m.id}>
            {m.text}
            {/* Quick answers on the floor, where typing is the
                cost. At close the manager is sat down and the
                account is theirs to write — buttons there would
                put words in their mouth. */}
            {report.mode === "quick" &&
              m.question?.options &&
              report.pending?.question?.key === m.question.key && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.question.options.map((opt) => (
                  <Button
                    key={opt}
                    size="default"
                    variant="outline"
                    onClick={() => report.say(opt)}
                  >
                    {opt}
                  </Button>
                  ))}
                </div>
              )}
          </Reply>
        );
      })}

      {(report.thinking || report.drafting) && (
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

  const Opening = quick ? QuickStart : ReportStart;
  /* Full-size and sat above the composer only while there is
     genuinely nothing else on screen. The moment there's a
     question to answer it shrinks to a header, so the question
     isn't pushed below the fold by its own preamble. */
  const hero = report.thread.length === 0;

  return (
    <div className={hero ? "flex min-h-full flex-col justify-end" : "flex flex-col"}>
      <Opening opening={hero} />
      {!hero && messages}
    </div>
  );
}
