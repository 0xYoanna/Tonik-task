import { PanelRightClose, FileText } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { SECTIONS } from "../lib/sections.js";
import { venue, shift, evidence } from "../data/sampleShift.js";
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
    <aside className="flex w-[34rem] shrink-0 flex-col border-l bg-card">
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

            /* A report is what happened, not a list of headings
               nothing was said under. Empty sections are tracked in
               the checklist above; they don't belong in the
               document. */
            if (s.key !== "incidents" && !c) return null;

            if (s.key === "incidents") {
              return (
                <section key={s.key} className="mb-4">
                  <h3 className="text-xs font-semibold tracking-wide uppercase">
                    {s.label}
                  </h3>
                  {report.logged.length ? (
                    <ul className="mt-2 space-y-3">
                      {report.logged.map((i) => (
                        <li key={i.id} className="border-l-2 pl-3">
                          <div className="text-sm font-medium tabular-nums">
                            {i.occurredAt ?? "time not recorded"} · {i.typeLabel}
                          </div>

                          {/* The register entry in full — a one-line
                              log is not a report. */}
                          <dl className="mt-1">
                            {[
                              ["Location", i.location ?? "not recorded"],
                              ["Persons", i.personsInvolved?.length ? i.personsInvolved.join("; ") : "none identified"],
                              ["Staff", i.staffPresent?.length ? i.staffPresent.join(", ") : "not recorded"],
                              ["Action", i.actionTaken?.length ? i.actionTaken.join(", ") : "not recorded"],
                              ["Injury", i.injury === true ? "yes" : i.injury === false ? "none reported" : "not recorded"],
                              ...(i.outcomes?.length ? [["Notifications", i.outcomes.map((o) => o.label).join("; ")]] : []),
                            ].map(([k, v]) => (
                              <div key={k} className="flex gap-2 py-0.5 text-xs">
                                <dt className="w-24 shrink-0 font-medium text-muted-foreground">{k}</dt>
                                <dd className="flex-1">{v}</dd>
                              </div>
                            ))}
                          </dl>

                          <p className="mt-1.5 border-l-2 pl-2 text-xs leading-relaxed text-muted-foreground italic">
                            {i.description}
                          </p>
                          {i.notes?.map((n) => (
                            <p key={n.key} className="text-xs text-muted-foreground">
                              {n.answer}
                            </p>
                          ))}

                          {(i.preservation || i.attachments?.length > 0) && (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {i.preservation && (
                                <figure className="overflow-hidden rounded-md border">
                                  <img src={evidence.cctv.src} alt="CCTV still"
                                    className="max-h-24 w-full bg-muted object-cover" />
                                  <figcaption className="border-t px-2 py-1 text-xs text-muted-foreground tabular-nums">
                                    {i.preservation.camera} · {i.preservation.window.from}–{i.preservation.window.to}
                                  </figcaption>
                                </figure>
                              )}
                              {i.attachments?.length > 0 && (
                                <figure className="overflow-hidden rounded-md border">
                                  <img src={evidence.note.src} alt={evidence.note.label}
                                    className="max-h-24 w-full bg-muted object-cover object-top" />
                                  <figcaption className="border-t px-2 py-1 text-xs text-muted-foreground">
                                    {evidence.note.label}
                                  </figcaption>
                                </figure>
                              )}
                            </div>
                          )}
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
                ) : null}
              </section>
            );
          })}
        </article>
      </div>
    </aside>
  );
}
