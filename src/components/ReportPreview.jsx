import { PanelRightClose, FileText } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { SECTIONS } from "../lib/sections.js";
import { venue, shift } from "../data/sampleShift.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Checklist from "./Checklist.jsx";

/* The report as it's being written, updating while the manager
   talks. It's the output made visible — so "where is this going?"
   is answered by looking rather than by asking.

   Collapsible, because a document that rewrites itself beside a
   text box is either reassuring or distracting depending on the
   person, and that isn't ours to decide. */

export default function ReportPreview() {
  const report = useReport();
  const covered = report.covered ?? {};

  return (
    <aside className="flex w-[26rem] shrink-0 flex-col border-l bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <FileText className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Report preview</span>
        <Badge variant="outline" className="tabular-nums">
          {report.coveredCount}/{SECTIONS.length}
        </Badge>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" onClick={report.toggleReport} title="Hide">
          <PanelRightClose />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b px-4 py-3">
          <div className="text-xs font-medium text-muted-foreground">Covered</div>
          <div className="mt-2">
            <Checklist compact />
          </div>
        </div>

        {/* The document itself. */}
        <article className="px-4 py-4">
          <h2 className="text-base font-semibold">Shift report</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {venue.name} · {venue.date} · {venue.hours}
          </p>
          <p className="text-xs text-muted-foreground">
            Duty manager {shift.dutyManager} · licence {venue.licence}
          </p>

          <Separator className="my-3" />

          {SECTIONS.map((s) => {
            const c = covered[s.key];

            if (s.key === "incidents") {
              return (
                <section key={s.key} className="mb-4">
                  <h3 className="text-xs font-semibold tracking-wide uppercase">
                    {s.label}
                  </h3>
                  {report.logged.length ? (
                    <ul className="mt-1.5 space-y-2">
                      {report.logged.map((i) => (
                        <li key={i.id} className="border-l-2 pl-2.5">
                          <div className="text-sm font-medium tabular-nums">
                            {i.occurredAt} · {i.typeLabel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {i.location ?? "location not recorded"}
                            {i.preservation && ` · ${i.preservation.camera} ${i.preservation.window.from}–${i.preservation.window.to}`}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground italic">
                            {i.description}
                          </p>
                          {i.personsInvolved?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Involved: {i.personsInvolved.join(", ")}
                            </p>
                          )}
                          {i.staffPresent?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Staff: {i.staffPresent.join(", ")}
                            </p>
                          )}
                          {i.actionTaken?.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Action: {i.actionTaken.join(", ")}
                            </p>
                          )}
                          {i.notes?.map((n) => (
                            <p key={n.key} className="text-xs text-muted-foreground">
                              {n.question} {n.answer}
                            </p>
                          ))}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      None recorded.
                    </p>
                  )}
                </section>
              );
            }

            return (
              <section key={s.key} className="mb-4">
                <h3 className="text-xs font-semibold tracking-wide uppercase">
                  {s.label}
                </h3>
                {c ? (
                  <p className="mt-1 text-sm">
                    {c.note}
                    {c.how === "known" && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        (from tonight's data)
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="flex-1 text-sm text-muted-foreground">
                      Nothing recorded — that's fine.
                    </p>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => report.skipSection(s.key)}
                    >
                      Nothing to add
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </article>
      </div>
    </aside>
  );
}
