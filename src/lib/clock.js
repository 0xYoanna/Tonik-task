/* A shift clock for the prototype.

   Mid-shift logging means "now" IS the timestamp — which is the
   whole reason the quick flow never has to ask what time it was.
   Real wall-clock time would put the reviewer at 14:00 on a
   Tuesday, so the demo runs on a simulated 01:42 that advances in
   real time from the moment the app loads. */

const START_MINUTES = 1 * 60 + 42; // 01:42, deep into a Saturday
const loadedAt = Date.now();

const pad = (n) => String(n).padStart(2, "0");

export function shiftNow() {
  const elapsed = Math.floor((Date.now() - loadedAt) / 60000);
  const m = (START_MINUTES + elapsed) % (24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}
