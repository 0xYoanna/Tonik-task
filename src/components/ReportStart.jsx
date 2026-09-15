import { useReport } from "../state/useReport.js";

/* The opening of the end-of-shift report.

   Screen text, not a message. What the system already knows and
   what it wants from the manager is standing context — making it
   the first chat bubble pushed the first real question below the
   fold and read as the machine talking to itself.

   Sits just above the composer, where they're about to type, and
   stays at the top of the thread as history afterwards. */

export default function ReportStart({ opening = true }) {
  const report = useReport();
  const logged = report.logged ?? [];

  return (
    <div
      className={
        opening
          ? "mx-auto w-full max-w-2xl px-6 pb-4"
          : "mx-auto w-full max-w-2xl border-b px-6 pt-6 pb-5"
      }
    >
      <h1
        className={
          opening
            ? "text-3xl font-semibold tracking-tight"
            : "text-xl font-semibold tracking-tight"
        }
      >
        How was the shift?
      </h1>

      <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
        I&rsquo;ve filled in what I already know from tonight — tasks, stock,
        maintenance, the door.{" "}
        <span className="text-foreground">
          Tell me if any of it changed, or just talk me through the night and
          I&rsquo;ll file it under the right headings.
        </span>
      </p>

      {logged.length > 0 && (
        <div className="mt-6">
          <div className="text-sm font-medium">
            Logged tonight as it happened
          </div>
          <ul className="mt-2 space-y-1">
            {logged.map((i) => (
              <li
                key={i.id}
                className="text-base leading-relaxed text-muted-foreground tabular-nums"
              >
                {i.occurredAt ?? "time not recorded"} · {i.typeLabel}
                {i.location ? ` — ${i.location}` : ""}
                {!i.full && (
                  <span className="text-foreground"> · details to finish</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
