/* The empty state for a mid-shift log.

   Pointers, not controls. At 01:42 the manager doesn't need a
   menu — they need to know that writing one line is enough, and
   that stopping to fill things in isn't expected of them now.

   It sits just above the composer rather than at the top of the
   screen, because that's where they're about to type, and it
   stays in the thread afterwards as the top of the history. */

const WORTH_LOGGING = [
  "Someone hurt, a fight, drugs or a weapon, someone collapsed",
  "Anyone put out, refused entry, refused service, a fake ID",
  "Theft, damage, an evacuation",
];

export default function QuickStart({ opening = true }) {
  return (
    <div
      className={
        opening
          ? "mx-auto w-full max-w-2xl px-6 pb-4"
          : "mx-auto w-full max-w-3xl border-b px-6 pt-6 pb-5"
      }
    >
      <h1
        className={
          opening
            ? "text-3xl font-semibold tracking-tight"
            : "text-xl font-semibold tracking-tight"
        }
      >
        What's happened?
      </h1>

      <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
        Write down what you remember now —{" "}
        <span className="text-foreground">
          the details can wait for the shift report at close.
        </span>
      </p>

      <div className="mt-7">
        <div className="text-sm font-medium">Worth logging</div>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
          {WORTH_LOGGING.map((row) => (
            <li key={row} className="text-base leading-relaxed text-muted-foreground">
              {row}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
