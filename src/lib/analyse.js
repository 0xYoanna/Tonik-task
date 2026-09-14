/* ─────────────────────────────────────────────────────────────
   READING THE MANAGER'S WORDS
   Asks the server, falls back to the local keyword detector.

   The fallback isn't defensive padding — it's what keeps this
   demoable. A live model call can fail mid-Loom on a rate limit
   or a flaky connection; the keyword path always answers. Anyone
   who clones the repo without a key still gets a working app.
   ───────────────────────────────────────────────────────────── */

import { detect, TYPES } from "./detector.js";
import { matchSections } from "./sections.js";
import { isOffTopic } from "./conversation.js";
import { floorplan } from "../data/sampleShift.js";
import { shiftNow } from "./clock.js";

const TIMEOUT_MS = 9000;

/* What the local detector produces, in the same shape the server
   returns, so callers never branch on which one answered. */
function locally(text) {
  const incidents = detect(text);
  return {
    kind: isOffTopic(text) ? "off_topic" : incidents.length ? "incident" : "section_note",
    incidents,
    sections: matchSections(text),
    answered: [], // no key: harvest() covers this instead
    source: "keywords",
  };
}

/* Server gives us plain fields; rebuild the record the rest of
   the app expects, applying the same gates the detector does. */
function hydrate(raw, text) {
  return (raw.incidents ?? []).map((inc, i) => {
    const type = TYPES[inc.type] ? inc.type : "other";
    const t = TYPES[type];
    const location = floorplan.includes(inc.location) ? inc.location : null;
    return {
      id: `inc_ai${i + 1}`,
      type,
      typeLabel: t.label,
      tier: t.tier,
      gate: t.gate,
      occurredAt: /^\d{2}:\d{2}$/.test(inc.occurredAt ?? "") ? inc.occurredAt : null,
      timeApprox: false,
      location,
      description: inc.description || text.trim(),
      outcomes: [],
      severity: "minor",
      staffPresent: [],
      personsInvolved: [], // never populated from the model, by design
      attachments: [],
      extraFields: t.extra ?? [],
      confidence: null,
      provenance: [],
      source: null,
      gaps: [],
      mergedCount: 1,
      origin: "ai",
      asked: [],
    };
  });
}

export async function analyse(text, { outstanding = [] } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, floorplan, now: shiftNow(), outstanding }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`analyse ${res.status}`);
    const raw = await res.json();
    return {
      kind: raw.kind,
      incidents: hydrate(raw, text),
      sections: raw.sections ?? [],
      answered: raw.answered ?? [],
      source: "model",
    };
  } catch {
    return locally(text); // dead key, rate limit, offline, or no server
  } finally {
    clearTimeout(timer);
  }
}

export { locally };
