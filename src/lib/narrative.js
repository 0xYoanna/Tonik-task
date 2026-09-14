/* Asks the server for the written account, and writes a plain one
   itself when there's no key.

   The fallback is deliberately flat — it assembles the record into
   sentences without interpreting anything. It is worse prose than
   the model's, and that is the honest trade: a stitched-together
   account that invents nothing beats a fluent one that does. */

import { venue } from "../data/sampleShift.js";

const TIMEOUT_MS = 40000;

function plainly(incidents) {
  if (!incidents.length)
    return `No incidents were recorded during this shift at ${venue.name} on ${venue.date}. The duty manager, ${venue.manager}, confirms that nothing occurred requiring an entry in the incident register.`;

  const paras = incidents.map((i) => {
    const bits = [];
    bits.push(
      `${i.typeLabel || "An incident"} was recorded ${
        i.occurredAt ? `at approximately ${i.occurredAt}` : "at a time that was not recorded"
      }${i.location ? ` in the ${i.location.toLowerCase()}` : ", at a location that was not recorded"}.`,
    );
    if (i.description) bits.push(`The duty manager's account: "${i.description}"`);
    bits.push(
      i.personsInvolved?.length
        ? `Persons involved were recorded as ${i.personsInvolved.join(", ")}.`
        : "No individuals were identified.",
    );
    if (i.staffPresent?.length) bits.push(`${i.staffPresent.join(" and ")} dealt with the matter.`);
    if (i.injury === true) bits.push("An injury was reported.");
    if (i.injury === false) bits.push("No injuries were reported.");
    if (i.actionTaken?.length) bits.push(`Action taken: ${i.actionTaken.join(", ")}.`);
    for (const n of i.notes ?? []) bits.push(`${n.question} ${n.answer}`);
    if (i.preservation)
      bits.push(
        `Footage from ${i.preservation.camera} covering ${i.preservation.window.from}–${i.preservation.window.to} was flagged for preservation.`,
      );
    return bits.join(" ");
  });

  const preserved = incidents.filter((i) => i.preservation).length;
  paras.push(
    preserved
      ? `${preserved} footage window${preserved === 1 ? " was" : "s were"} flagged for export before this report was filed. Any field recorded above as unknown was left blank deliberately rather than estimated.`
      : "No footage was flagged for this shift. Any field recorded above as unknown was left blank deliberately rather than estimated.",
  );
  return paras.join("\n\n");
}

export async function narrate(incidents, sections = {}, notes = "") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/narrative", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venue, incidents, sections, notes }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`narrative ${res.status}`);
    const raw = await res.json();
    if (!raw.narrative) throw new Error("empty");
    return { narrative: raw.narrative, source: "model" };
  } catch {
    return { narrative: plainly(incidents), source: "keywords" };
  } finally {
    clearTimeout(timer);
  }
}
