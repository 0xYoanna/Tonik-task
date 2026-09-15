import { useState } from "react";
import { useReport } from "../state/useReport.js";
import { venue, evidence } from "../data/sampleShift.js";
import FullReport from "../components/FullReport.jsx";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

/* Sign off, then filed. Filing is a STATE CHANGE, NOT AN ENDING —
   a model where submit is terminal forces the manager to choose
   between filing something incomplete and filing nothing, and at
   3am they choose nothing. */

function Line({ inc }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="text-muted-foreground">✓</span>
      <span className="text-sm text-foreground tabular-nums">{inc.occurredAt}</span>
      <span className="text-sm text-muted-foreground">{inc.location}</span>
      <span className="text-sm text-foreground">{inc.typeLabel}</span>
      <div className="flex-1" />
      {inc.attachments.length > 0 && (
        <span className="text-xs font-medium text-muted-foreground">{inc.attachments.length} files</span>
      )}
      {inc.personsInvolved.length > 0 && (
        <span className="text-xs font-medium text-muted-foreground">{inc.personsInvolved.length} named</span>
      )}
    </div>
  );
}

function Filed() {
  const report = useReport();
  const [note, setNote] = useState("");
  const [amending, setAmending] = useState(false);
  const filedAt = new Date(report.filedAt);

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <div className="rounded-lg border border-border bg-muted p-5">
        <h1 className="text-lg font-semibold text-foreground">Filed.</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {venue.date} · signed by {venue.manager} ·{" "}
          {filedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Retained for four years, per the register requirement. Your original
          words, its reading of them, and every correction you made are all
          held separately — nothing was overwritten.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="text-xs font-medium text-muted-foreground mb-2">In the register</div>
        {report.logged.length ? (
          report.logged.map((i) => <Line key={i.id} inc={i} />)
        ) : (
          <p className="text-sm text-muted-foreground">
            No incidents. You affirmed that none occurred — that affirmation is
            the record.
          </p>
        )}
      </div>

      {report.amendments.length > 0 && (
        <div className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground mb-2">Amendments</div>
          {report.amendments.map((a, i) => (
            <div key={i} className="py-1 text-sm text-muted-foreground tabular-nums">
              {new Date(a.at).toLocaleString("en-GB")} · {a.by} — {a.note}
            </div>
          ))}
        </div>
      )}

      {/* Real registers amend. So should we. */}
      <div className="mt-5">
        {amending ? (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              An amendment is timestamped and attributed to you. The original
              entry stays exactly as filed.
            </p>
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What are you adding?"
              className="text-sm"
            />
            <div className="mt-2 flex gap-2">
              <Button
                variant="default"
                size="sm"
                disabled={!note.trim()}
                onClick={() => {
                  report.amend(note.trim());
                  setNote("");
                  setAmending(false);
                }}
              >
                Append amendment
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAmending(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAmending(true)}>
              Amend this report
            </Button>
            <Button variant="ghost" onClick={report.reset}>
              Start a fresh night
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Submit() {
  const report = useReport();
  if (report.phase === "filed") return <Filed />;


  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-xl font-semibold text-foreground">About to file</h1>
      <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
        {venue.date} · {venue.name} · licence {venue.licence}
      </p>

      {/* The document itself, not a summary of it. This is what
          the signature attaches to, so it's what they read. */}
      {report.narrative && (
        <div className="mt-5">
          <FullReport narrative={report.narrative} />
        </div>
      )}

      <div className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {report.logged.length} incident{report.logged.length === 1 ? "" : "s"}
        </div>
        {report.logged.length ? (
          report.logged.map((i) => <Line key={i.id} inc={i} />)
        ) : (
          <p className="text-sm text-muted-foreground">
            None detected, and none added.
          </p>
        )}
      </div>


      {report.preservations.length > 0 && (
        <div className="mt-3 rounded-lg border border-border bg-muted p-5">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Before you go — {report.preservations.length} footage export
            {report.preservations.length === 1 ? "" : "s"}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.preservations.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-md border bg-card">
                <img
                  src={evidence.cctv.src}
                  alt={`${p.camera} still`}
                  className="max-h-32 w-full bg-muted object-cover"
                />
                <figcaption className="border-t px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
                  {p.camera} · {p.window.from}–{p.window.to} · {p.location}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            These overwrite on their own. The report survives; the footage
            doesn't, unless someone moves it tonight.
          </p>
        </div>
      )}

      {/* The manager signs the RECORD, not the draft. */}
      <div className="mt-5 rounded-lg border border-border bg-card p-5 shadow-sm">
        <label className="flex cursor-pointer gap-3">
          <Checkbox
            checked={report.attested}
            onCheckedChange={(v) => report.attest(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-foreground">
            {report.logged.length === 0
              ? "I confirm that no incidents occurred during this shift."
              : "This is a true account of my shift as I recorded it, and I have reviewed every entry above."}
          </span>
        </label>

        <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground tabular-nums">
          Signed: {venue.manager} ·{" "}
          {new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button variant="ghost" onClick={report.back}>
          ← Back
        </Button>
        <div className="flex-1" />
        <Button variant="default" disabled={!report.attested} onClick={report.file}>
          File report
        </Button>
      </div>
    </div>
  );
}
