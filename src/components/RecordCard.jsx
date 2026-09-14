import { Camera, Users, Clock, MapPin, Tag } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { evidence } from "../data/sampleShift.js";

/* THE POLISHED MOMENT.
   The record it wrote, appearing inside the conversation — not in
   a side panel, not on another screen. The manager reacts to it
   the way they'd react to anything else in a chat. */

const TONE = { serious: "destructive", significant: "secondary", minor: "outline" };

function Row({ icon: Icon, label, value, onFix }) {
  return (
    <div className="group/row flex items-baseline gap-2 py-1">
      <Icon className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">{label}</span>
      <span className="flex-1 text-sm text-foreground">{value}</span>
      {onFix && (
        <button
          onClick={onFix}
          className="text-xs font-medium text-muted-foreground opacity-0 transition group-hover/row:opacity-100 hover:text-primary focus:opacity-100"
        >
          not right?
        </button>
      )}
    </div>
  );
}

export default function RecordCard({ incident: inc }) {
  const report = useReport();

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border bg-muted px-3.5 py-2">
        <span className="text-xs font-medium text-muted-foreground text-primary">Logged to the register</span>
        <div className="flex-1" />
        <Badge variant={TONE[inc.severity]}>{inc.severity}</Badge>
      </header>

      <div className="px-3.5 py-2.5">
        <Row icon={Tag} label="What" value={inc.typeLabel || "—"} onFix={() => report.reopen(inc.id, "type")} />
        <Row
          icon={Clock}
          label="When"
          value={inc.occurredAt ? `${inc.occurredAt}${inc.timeApprox ? " (approx)" : ""}` : "not recorded"}
          onFix={() => report.reopen(inc.id, "occurredAt")}
        />
        <Row icon={MapPin} label="Where" value={inc.location ?? "not recorded"} onFix={() => report.reopen(inc.id, "location")} />
        {inc.staffPresent?.length > 0 && (
          <Row icon={Users} label="Staff" value={inc.staffPresent.join(", ")} />
        )}

        {/* Their own words, kept verbatim. */}
        <p className="mt-2 border-l-2 border-border pl-2.5 text-sm leading-relaxed text-muted-foreground italic">
          {inc.description}
        </p>

        {inc.notes?.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {inc.notes.map((n) => (
              <div key={n.key} className="text-sm text-muted-foreground">
                <span className="text-muted-foreground">{n.question}</span> {n.answer}
              </div>
            ))}
          </div>
        )}

        {inc.actionTaken?.length > 0 && (
          <Row icon={Tag} label="Action" value={inc.actionTaken.join(", ")} />
        )}

        {inc.outcomes?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {inc.outcomes.map((o) => (
              <Badge key={o.key} variant="secondary">{o.label}</Badge>
            ))}
          </div>
        )}

      </div>

      {inc.preservation && (
        <div className="px-3.5 pb-3">
          <Alert>
            <Camera />
            <AlertDescription className="tabular-nums">
              {inc.preservation.camera} · {inc.preservation.window.from}–
              {inc.preservation.window.to} flagged for export
            </AlertDescription>
          </Alert>
          <figure className="mt-2 overflow-hidden rounded-md border">
            <img
              src={evidence.cctv.src}
              alt={`${inc.preservation.camera} still`}
              className="max-h-44 w-full bg-muted object-cover"
            />
            <figcaption className="flex items-center gap-2 border-t px-2.5 py-1.5 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {inc.preservation.camera} · {inc.occurredAt}
              </span>
              <span className="flex-1" />
              <span>copied off the recorder</span>
            </figcaption>
          </figure>
        </div>
      )}

    </div>
  );
}
