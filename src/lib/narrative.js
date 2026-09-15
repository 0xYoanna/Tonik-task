/* Asks the server for the written account, and writes a plain one
   itself when there's no key.

   The fallback is deliberately flat — it assembles the record into
   sentences without interpreting anything. It is worse prose than
   the model's, and that is the honest trade: a stitched-together
   account that invents nothing beats a fluent one that does. */

import { venue } from "../data/sampleShift.js";

const TIMEOUT_MS = 40000;

function plainly(incidents, attachments = []) {
  if (!incidents.length)
    return `Description of the event\n\nNo incidents were recorded during this shift at ${venue.name} on ${venue.date}.\n\nInjuries\n\nNone reported.\n\nActions taken\n\nThe duty manager, ${venue.manager}, affirms that nothing occurred requiring an entry in the incident register.`;

  const event = [];
  const injuries = [];
  const actions = [];

  for (const i of incidents) {
    event.push(
      `${i.typeLabel || "An incident"} was recorded ${
        i.occurredAt ? `at approximately ${i.occurredAt}` : "at a time that was not recorded"
      }${i.location ? ` in the ${i.location.toLowerCase()}` : ", at a location that was not recorded"}. ` +
        `The duty manager recorded it as: "${i.description}". ` +
        (i.personsInvolved?.length
          ? `Those involved were recorded as ${i.personsInvolved.join("; ")}.`
          : "No individuals were identified.") +
        (i.staffPresent?.length ? ` ${i.staffPresent.join(" and ")} attended.` : ""),
    );

    injuries.push(
      i.injury === true
        ? `An injury was reported. ${(i.notes ?? [])
            .filter((n) => /injur/i.test(n.key))
            .map((n) => n.answer)
            .join(" ") || "No further detail was recorded."}`
        : i.injury === false
          ? "No injuries were reported."
          : "Whether anyone was injured was not recorded.",
    );

    const taken = [];
    if (i.actionTaken?.length) taken.push(`Action taken was recorded as ${i.actionTaken.join(", ")}.`);
    if (i.outcomes?.length) taken.push(`Notifications: ${i.outcomes.map((o) => o.label).join("; ")}.`);
    /* Answers only. The question text is scaffolding and has no
       place in a document a solicitor reads. */
    for (const n of i.notes ?? []) {
      if (/injur/i.test(n.key)) continue;
      taken.push(n.answer.endsWith(".") ? n.answer : `${n.answer}.`);
    }
    if (i.preservation)
      taken.push(
        `Footage from ${i.preservation.camera} covering ${i.preservation.window.from}–${i.preservation.window.to} was flagged for preservation${
          i.preservation.basedOn === "time reported" ? ", the window taken from the time the incident was reported rather than the time it occurred" : ""
        }.`,
      );
    if (i.attachments?.length)
      taken.push(`Attached to this entry: ${i.attachments.join("; ")}.`);
    actions.push(taken.join(" ") || "No action was recorded.");
  }

  for (const a of attachments) {
    event.push(
      `A separate written account was supplied${a.from ? ` by ${a.from}` : ""} and attached to this report. It records: ${a.lines.join(" ")} Where that account and the duty manager's differ, both are recorded here and neither has been preferred over the other.`,
    );
  }

  actions.push(
    "Any field recorded above as unknown was left blank deliberately rather than estimated. The duty manager's original words, the system's reading of them, and every correction are retained as separate layers.",
  );

  return [
    "Description of the event",
    event.join("\n\n"),
    "Injuries",
    injuries.join("\n\n"),
    "Actions taken",
    actions.join("\n\n"),
  ].join("\n\n");
}

export async function narrate(incidents, sections = {}, notes = "", attachments = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/narrative", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ venue, incidents, sections, notes, attachments }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`narrative ${res.status}`);
    const raw = await res.json();
    if (!raw.narrative) throw new Error("empty");
    return { narrative: raw.narrative, source: "model" };
  } catch {
    return { narrative: plainly(incidents, attachments), source: "keywords" };
  } finally {
    clearTimeout(timer);
  }
}
