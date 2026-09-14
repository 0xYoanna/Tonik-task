import { Check, Circle, Minus } from "lucide-react";
import { useReport } from "../state/useReport.js";
import { SECTIONS } from "../lib/sections.js";

/* The thirteen, as a checklist rather than a form.

   An item ticks when the manager MENTIONS it — they never pick a
   section. Nothing here is required and nothing blocks sign-off,
   so this is a map of the night, not a progress bar to clear.
   A progress bar over optional sections is guilt with a UI, and
   it trains people to pad sections to fill it. */

export default function Checklist({ compact }) {
  const report = useReport();
  const covered = report.covered ?? {};

  return (
    <ul className={compact ? "space-y-1" : "space-y-1.5"}>
      {SECTIONS.map((s) => {
        const c = covered[s.key];
        const said = c?.how === "said";
        const known = c?.how === "known";
        const skipped = c?.how === "none";

        return (
          <li key={s.key} className="flex items-start gap-2">
            {said ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-green-600 dark:text-green-500" />
            ) : known ? (
              <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            ) : skipped ? (
              <Minus className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
            )}

            <div className="min-w-0 flex-1">
              <span
                className={
                  said
                    ? "text-sm text-muted-foreground line-through decoration-green-600/60"
                    : skipped
                      ? "text-sm text-muted-foreground line-through"
                      : "text-sm"
                }
              >
                {s.label}
              </span>

              {!c && !compact && (
                <span className="ml-1.5 text-xs text-muted-foreground">{s.hint}</span>
              )}

              {known && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  from tonight's data — anything changed?
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
