import { FileText, Camera, Paperclip } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { venue, shift, evidence } from "../data/sampleShift.js";
import { SECTIONS } from "../lib/sections.js";
import { Badge } from "@/components/ui/badge";

/* The document itself, as it will be filed.

   Three layers, in the order a reader needs them: the register
   entry (the statutory fields), the written account (the prose
   that has to stand up), and the evidence (the half that can't be
   reconstructed later). Nothing here is editable — it is a thing
   to read and approve, and correcting it happens by saying so. */

const SECTION_HEADINGS = [
  "Description of the event",
  "Injuries",
  "Actions taken",
];

function Field({ label, children }) {
  return (
    <div className="flex gap-2 py-0.5 text-sm">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

export default function FullReport({ narrative }) {
  const report = useReport();
  const incidents = report.logged;
  const covered = report.covered ?? {};

  return (
    <article className="max-w-[42rem] overflow-hidden rounded-lg border bg-card shadow-sm">
      <header className="border-b bg-muted px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Shift incident report</h2>
          <Badge variant="outline">Unsigned</Badge>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
          {venue.name} · {venue.address}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {venue.date} · {venue.hours} · licence {venue.licence}
        </p>
        <p className="text-xs text-muted-foreground">
          Duty manager {shift.dutyManager} · DPS {shift.dps}
        </p>
      </header>

      <div className="px-5 py-4">
        <h3 className="text-xs font-semibold tracking-wide uppercase">
          Register entries — {incidents.length}
        </h3>

        {incidents.map((i, n) => (
          <section key={i.id} className="mt-3 border-l-2 pl-3">
            <div className="text-sm font-medium tabular-nums">
              {n + 1}. {i.occurredAt ?? "time not recorded"} · {i.typeLabel}
            </div>

            <div className="mt-1.5">
              <Field label="Location">{i.location ?? "not recorded"}</Field>
              <Field label="Persons">
                {i.personsInvolved?.length
                  ? i.personsInvolved.join("; ")
                  : "none identified"}
              </Field>
              <Field label="Staff">
                {i.staffPresent?.length ? i.staffPresent.join(", ") : "not recorded"}
              </Field>
              <Field label="Action">
                {i.actionTaken?.length ? i.actionTaken.join(", ") : "not recorded"}
              </Field>
              <Field label="Injury">
                {i.injury === true ? "yes" : i.injury === false ? "none reported" : "not recorded"}
              </Field>
              {i.outcomes?.length > 0 && (
                <Field label="Notifications">
                  {i.outcomes.map((o) => o.label).join("; ")}
                </Field>
              )}
            </div>

            <p className="mt-2 border-l-2 pl-2.5 text-xs leading-relaxed text-muted-foreground italic">
              {i.description}
            </p>
            {i.notes?.map((nt) => (
              <p key={nt.key} className="text-xs text-muted-foreground">
                {nt.question} {nt.answer}
              </p>
            ))}

            {/* Evidence sits with the entry it belongs to. */}
            {(i.preservation || i.attachments?.length > 0) && (
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {i.preservation && (
                  <figure className="overflow-hidden rounded-md border">
                    <img
                      src={evidence.cctv.src}
                      alt={`${i.preservation.camera} still`}
                      className="max-h-32 w-full bg-muted object-cover"
                    />
                    <figcaption className="flex items-center gap-1.5 border-t px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
                      <Camera className="size-3 shrink-0" />
                      {i.preservation.camera} · {i.preservation.window.from}–
                      {i.preservation.window.to}
                      {i.preservation.basedOn === "time reported" && " (from time reported)"}
                    </figcaption>
                  </figure>
                )}
                {i.attachments?.length > 0 && (
                  <figure className="overflow-hidden rounded-md border">
                    <img
                      src={evidence.note.src}
                      alt={evidence.note.label}
                      className="max-h-32 w-full bg-muted object-cover object-top"
                    />
                    <figcaption className="flex items-center gap-1.5 border-t px-2 py-1.5 text-xs text-muted-foreground">
                      <Paperclip className="size-3 shrink-0" />
                      {evidence.note.label}
                    </figcaption>
                  </figure>
                )}
              </div>
            )}
          </section>
        ))}

        {/* The rest of the shift. The preview on the right is a
            preview OF THIS — so the filed document has to carry
            everything the preview showed, not incidents alone. */}
        {SECTIONS.filter((x) => x.key !== "incidents" && covered[x.key]).length > 0 && (
          <>
            <h3 className="mt-5 border-t pt-4 text-xs font-semibold tracking-wide uppercase">
              Shift sections
            </h3>
            {SECTIONS.filter((x) => x.key !== "incidents" && covered[x.key]).map((x) => {
              const c = covered[x.key];
              return (
                <section key={x.key} className="mt-2.5">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    {x.label}
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {c.note}
                    {c.how === "known" && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        (from tonight&rsquo;s shift data, unchanged)
                      </span>
                    )}
                    {c.how === "none" && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        (recorded as nothing to add)
                      </span>
                    )}
                  </p>
                </section>
              );
            })}
          </>
        )}

        <h3 className="mt-5 border-t pt-4 text-xs font-semibold tracking-wide uppercase">
          Written account
        </h3>
        {narrative.split(/\n\n+/).map((para, i) =>
          /* The model returns three bare headings. Render them as
             headings so the document reads like a document. */
          SECTION_HEADINGS.includes(para.trim()) ? (
            <h4
              key={i}
              className="mt-4 text-xs font-semibold tracking-wide uppercase text-muted-foreground"
            >
              {para.trim()}
            </h4>
          ) : (
            <p key={i} className="mt-2 text-sm leading-relaxed">
              {para}
            </p>
          ),
        )}

        <p className="mt-5 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          Retained for four years. The manager&rsquo;s original words, this
          reading of them, and every correction are held as separate layers.
          Fields recorded as not known were left blank deliberately rather than
          estimated. Awaiting signature by {shift.dutyManager}.
        </p>
      </div>
    </article>
  );
}
