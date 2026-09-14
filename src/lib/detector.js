/* ─────────────────────────────────────────────────────────────
   THE FAKE AI
   Keyword-driven, deliberately visible. Three rules it obeys:

   1. It classifies EVENTS, never PEOPLE. Nothing here can ever
      write to personsInvolved.
   2. A blank beats a guess. Missing time or location leaves the
      field empty and attaches a specific question.
   3. Every extracted field keeps its provenance — the exact
      sentence it came from, and where in the raw text.
   ───────────────────────────────────────────────────────────── */

import { floorplan, cameras } from "../data/sampleShift.js";

/* ── The taxonomy ──────────────────────────────────────────────
   `gate: true` means this type can never be batch-confirmed —
   the card has to be opened. That is a structural constraint,
   not a warning message, because warnings get clicked through. */
export const TYPES = {
  injury: {
    label: "Injury to a person",
    tier: 1,
    gate: true,
    keywords: ["injured","bleeding","glassed","cut above","first aid","ambulance",
      "paramedic","split his","split her","broke his","broke her","knocked out",
      "cut her","cut his","cut their","cut himself","cut herself","burnt",
      "sprained","twisted her","twisted his","hurt her","hurt his","fell down"],
    confidence: 0.92,
    extra: ["Nature of injury", "First aid given", "Ambulance called", "Witnesses"],
  },
  assault: {
    label: "Assault / violence",
    tier: 1,
    gate: true,
    keywords: ["assault","punched","attacked","headbutt","scrapping","scrap","fight",
      "fighting","fought","brawl","bust up","bust-up","altercation","squaring up",
      "kicking off","kicked off","went for","had a go at","row broke out"],
    confidence: 0.9,
    extra: ["Police reference", "Weapon present"],
  },
  drugs: {
    label: "Drug find or use",
    tier: 1,
    gate: true,
    keywords: ["baggie", "drugs", "pills", "dealing", "searched and found"],
    confidence: 0.74,
    extra: ["What was found", "Seized or disposed", "Police informed"],
  },
  weapon: {
    label: "Weapon found",
    tier: 1,
    gate: true,
    keywords: ["knife", "blade", "weapon"],
    confidence: 0.88,
    extra: ["How discovered", "Police reference"],
  },
  ejection: {
    label: "Removal from premises",
    tier: 2,
    gate: true, // legally loaded enough to need opening — see FLOW.md §5
    keywords: ["ejected","escorted out","removed","kicked out","thrown out","chucked out",
      "pulled them out","pulled him out","pulled her out","put them out","walked them out",
      "got them out","showed them the door","booted","turfed out","slung out",
      "both out","them out","him out","her out","out the door","out of here"],
    confidence: 0.91,
    multi: true,
  },
  refusal_entry: {
    label: "Refusal of entry",
    tier: 2,
    gate: false,
    keywords: ["refused entry","refused","turned away","knocked back","wouldn't let",
      "denied entry","not letting","wouldn't get in","sent packing"],
    confidence: 0.91,
    multi: true,
  },
  refusal_service: {
    label: "Refusal of service",
    tier: 2,
    gate: true,
    keywords: ["cut off", "refused service", "stopped serving"],
    confidence: 0.85,
  },
  id_failure: {
    label: "ID failure / forged ID",
    tier: 2,
    gate: false,
    keywords: ["fake id", "false id", "borrowed id", "underage", "seized the id"],
    confidence: 0.86,
    multi: true,
  },
  indecent: { label: "Indecent behaviour", tier: 2, gate: false, keywords: [], confidence: 0.7 },
  theft: {
    label: "Theft",
    tier: 3,
    gate: false,
    keywords: ["stolen", "theft", "went missing", "nicked", "lifted"],
    confidence: 0.72,
  },
  damage: {
    label: "Criminal damage",
    tier: 3,
    gate: false,
    keywords: ["smashed", "broken", "damaged", "kicked in", "glass got"],
    confidence: 0.7,
  },
  medical: {
    label: "Medical, non-injury",
    tier: 3,
    gate: true,
    keywords: ["collapsed", "seizure", "overdose", "passed out"],
    confidence: 0.8,
  },
  noise: { label: "Noise complaint", tier: 3, gate: false, keywords: ["noise complaint"], confidence: 0.75 },
  capacity: { label: "Capacity / queue incident", tier: 3, gate: false, keywords: [], confidence: 0.7 },
  equipment: { label: "Equipment failure (safety)", tier: 3, gate: false, keywords: [], confidence: 0.7 },
  counterfeit: { label: "Counterfeit currency", tier: 3, gate: false, keywords: ["counterfeit", "fake note"], confidence: 0.75 },

  other: {
    label: "Other / uncategorised",
    tier: 2,
    gate: true,
    keywords: [],
    confidence: 0.5,
  },

  /* Manual-select only. The detector must never reach for this —
     a distressed person and a drink is not an allegation because
     a keyword matched. See INCIDENT-TYPES.md §4. */
  safeguarding: { label: "Safeguarding concern", tier: 1, gate: true, keywords: [], manualOnly: true, confidence: 0 },
  sexual: { label: "Sexual misconduct / spiking", tier: 1, gate: true, keywords: [], manualOnly: true, confidence: 0 },
  fire: { label: "Fire, evacuation or lockdown", tier: 1, gate: true, keywords: ["evacuated", "fire alarm"], confidence: 0.85 },
};

/* Outcomes are facts ABOUT an incident, not types of incident.
   Statute agrees: "actions taken, including notifications." */
const OUTCOMES = {
  police: { label: "Police attended", keywords: ["police", "cops", "officers attended", "999", "112"] },
  ambulance: { label: "Ambulance called", keywords: ["ambulance", "paramedic"] },
  first_aid: { label: "First aid given", keywords: ["first aid", "patched up"] },
  banned: { label: "Person banned", keywords: ["banned", "barred"] },
  cctv: { label: "CCTV reviewed", keywords: ["footage", "cctv", "reviewed the tape"] },
};

/* ── Time ──────────────────────────────────────────────────────
   Precise digits are confident. Vague phrases are marked approx
   so the UI can show them as unconfirmed rather than pretending. */
const WORD_HOURS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };

// Venue trades 21:00–04:00, so a bare 1–4 is morning, 9–11 is evening.
function normaliseHour(h) {
  if (h >= 9 && h <= 11) return h + 12;
  if (h >= 0 && h <= 4) return h;
  if (h === 12) return 0;
  return h;
}
const pad = (n) => String(n).padStart(2, "0");

export function findTimes(segment) {
  const found = [];
  const precise = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/g;
  let m;
  while ((m = precise.exec(segment)) !== null) {
    found.push({ value: `${pad(Number(m[1]))}:${m[2]}`, index: m.index, approx: false });
  }
  const half = /\bhalf\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi;
  while ((m = half.exec(segment)) !== null) {
    found.push({ value: `${pad(normaliseHour(WORD_HOURS[m[1].toLowerCase()]))}:30`, index: m.index, approx: true });
  }
  const vague = /\b(?:around|about|just after|just before|at)\s+(\d{1,2})\b(?![:.]\d)/gi;
  while ((m = vague.exec(segment)) !== null) {
    found.push({ value: `${pad(normaliseHour(Number(m[1])))}:00`, index: m.index, approx: true });
  }
  return found.sort((a, b) => a.index - b.index);
}

/* Locations come from the venue's own floorplan — a closed
   vocabulary, not open extraction. More accurate, and a reason
   the product gets better with setup. */
export function findLocations(segment) {
  const found = [];
  for (const place of floorplan) {
    const re = new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    let m;
    while ((m = re.exec(segment)) !== null) found.push({ value: place, index: m.index });
  }
  return found.sort((a, b) => a.index - b.index);
}

/* Multi-word keywords have to survive real speech: people say
   "pulled them BOTH out", not "pulled them out". Allow up to two
   filler words between the parts of a phrase. Returns the match
   index, or -1. */
const KEYWORD_CACHE = new Map();
export function matchKeyword(text, keyword) {
  let re = KEYWORD_CACHE.get(keyword);
  if (!re) {
    const parts = keyword
      .split(/\s+/)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    re = new RegExp(`\\b${parts.join("\\s+(?:\\S+\\s+){0,2}")}`, "i");
    KEYWORD_CACHE.set(keyword, re);
  }
  const m = re.exec(text);
  return m ? m.index : -1;
}

/* Negation guard. "nobody hurt" is not an injury, and "neither
   wanted police" is not a police attendance. Cheap, but it is the
   difference between a plausible demo and a silly one. */
const NEGATORS = /\b(no|not|neither|nobody|none|didn'?t|did not|wasn'?t|weren'?t|never|without)\b/i;
function negated(text, index) {
  return NEGATORS.test(text.slice(Math.max(0, index - 28), index));
}

export function findOutcomes(text) {
  const lower = text.toLowerCase();
  return Object.entries(OUTCOMES)
    .filter(([, o]) =>
      o.keywords.some((k) => {
        const i = matchKeyword(lower, k);
        return i !== -1 && !negated(lower, i);
      }),
    )
    .map(([key, o]) => ({ key, label: o.label }));
}

/* Severity is DERIVED from type + outcome. Never free-entry —
   if the manager sets it, everything is minor at 3am. */
export function severityOf(typeKey, outcomes = []) {
  const t = TYPES[typeKey];
  const keys = outcomes.map((o) => o.key ?? o);
  if (!t) return "minor";
  if (t.tier === 1) return "serious";
  if (keys.includes("police") || keys.includes("ambulance")) return "serious";
  if (t.tier === 2) return "significant";
  return "minor";
}

export function cameraFor(location) {
  return cameras[location] ?? null;
}

/* A confirmed incident preserves a window around the event,
   because most venue DVRs overwrite when the disk fills rather
   than on a schedule. This is the feature that pays for itself. */
export function preservationWindow(time) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const base = h * 60 + m;
  const fmt = (mins) => {
    const x = ((mins % 1440) + 1440) % 1440;
    return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
  };
  return { from: fmt(base - 10), to: fmt(base + 10) };
}

/* ── Structure ─────────────────────────────────────────────────
   Paragraph is the clustering unit: people narrate one event per
   paragraph. Sentence is the provenance unit: it's what gets
   quoted back as "where did this come from".  */
function paragraphs(text) {
  const out = [];
  let cursor = 0;
  for (const block of text.split(/\n\s*\n/)) {
    const start = text.indexOf(block, cursor);
    cursor = start + block.length;
    if (!block.trim()) continue;
    const sentences = [];
    const re = /[^.!?\n]+[.!?]*/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      if (m[0].trim().length > 3)
        sentences.push({
          text: m[0].trim(),
          start: start + m.index,
          end: start + m.index + m[0].length,
        });
    }
    out.push({ text: block, start, end: start + block.length, sentences });
  }
  return out;
}

function nearest(list, index) {
  if (!list.length) return null;
  return list.reduce((best, c) =>
    Math.abs(c.index - index) < Math.abs(best.index - index) ? c : best,
  );
}

let seq = 0;
const nextId = () => `inc_${++seq}`;

/* ── The pass ──────────────────────────────────────────────── */
export function detect(text) {
  seq = 0;
  const out = [];

  for (const para of paragraphs(text)) {
    const paraTimes = findTimes(para.text);
    const paraPlaces = findLocations(para.text);
    const claimed = new Set();
    let emittedHere = 0;

    for (const sent of para.sentences) {
      const lower = sent.text.toLowerCase();

      /* One sentence, one classification. If several keywords
         match, the most confident one wins and the manager can
         correct it — which is the demo point, not a failure. */
      let best = null;
      for (const [key, type] of Object.entries(TYPES)) {
        if (type.manualOnly || !type.keywords.length || claimed.has(key)) continue;
        for (const k of type.keywords) {
          const i = matchKeyword(lower, k);
          if (i === -1 || negated(lower, i)) continue;
          if (!best || type.confidence > best.type.confidence)
            best = { key, type, hit: k, index: i };
          break;
        }
      }
      if (!best) continue;
      claimed.add(best.key);

      const sentTimes = findTimes(sent.text);
      const sentPlaces = findLocations(sent.text);
      const outcomes = findOutcomes(para.text);

      /* An enumerated list — "refused at 22:10, 22:25, 22:40" — is
         several incidents in one sentence, not one. */
      const listed = best.type.multi && sentTimes.length > 1;
      let slots;
      if (listed) {
        const paired = sentPlaces.length === sentTimes.length;
        slots = sentTimes.map((t, i) => ({
          time: t,
          place: paired ? sentPlaces[i] : nearest(sentPlaces, t.index),
          inferred: false,
        }));
      } else {
        const time = sentTimes[0] ?? paraTimes[0] ?? null;
        const place = sentPlaces[0] ?? paraPlaces[0] ?? null;
        slots = [
          {
            time,
            place,
            inferred: !sentTimes[0] || !sentPlaces[0], // read from the paragraph, not the sentence
          },
        ];
      }

      for (const slot of slots) {
        out.push(build({ ...best, slot, sent, outcomes, listed }));
        emittedHere += 1;
      }
    }

    /* It can tell something happened — police turned up — but not
       what kind of incident it was. So it says so and asks,
       rather than inventing a category. */
    if (!emittedHere) {
      const outcomes = findOutcomes(para.text);
      if (outcomes.some((o) => o.key === "police" || o.key === "ambulance")) {
        out.push(
          build({
            key: "other",
            type: TYPES.other,
            hit: outcomes[0].label.toLowerCase(),
            index: 0,
            slot: { time: paraTimes[0] ?? null, place: paraPlaces[0] ?? null, inferred: true },
            sent: para.sentences[0] ?? { text: para.text, start: para.start, end: para.end },
            outcomes,
            listed: false,
            unclassified: true,
          }),
        );
      }
    }
  }

  return dedupe(out);
}

function build({ key, type, hit, slot, sent, outcomes, listed, unclassified }) {
  const time = slot.time?.value ?? null;
  const location = slot.place?.value ?? null;

  let confidence = type.confidence;
  if (listed) confidence -= 0.05; // pairing a time to a place in a list is inference
  if (slot.inferred) confidence -= 0.07; // read from the paragraph, not the sentence
  if (slot.time?.approx) confidence -= 0.08;

  const provenance = [
    { field: "type", quote: hit, confidence: type.confidence },
  ];
  if (time)
    provenance.push({
      field: "occurredAt",
      quote: time,
      confidence: slot.time.approx ? 0.62 : 0.95,
    });
  if (location)
    provenance.push({ field: "location", quote: location, confidence: 0.93 });

  /* The confidence gate. A missing required field is a hole with a
     question in it — never a filled-in guess. A fabricated
     timestamp in a document an insurer reads is worse than a gap. */
  const gaps = [];
  if (!time) gaps.push({ field: "occurredAt", question: "What time did this happen?" });
  if (!location) gaps.push({ field: "location", question: "Where did this happen?" });
  if (unclassified) gaps.push({ field: "type", question: "What kind of incident was this?" });

  return {
    id: nextId(),
    type: key,
    typeLabel: type.label,
    tier: type.tier,
    gate: type.gate,
    occurredAt: time,
    timeApprox: slot.time?.approx ?? false,
    location,
    description: sent.text, // the manager's own words, verbatim
    outcomes,
    severity: severityOf(key, outcomes),
    staffPresent: [],
    personsInvolved: [], // manual only — no AI path reaches this
    attachments: [],
    extraFields: type.extra ?? [],
    confidence: Math.max(0.4, Number(confidence.toFixed(2))),
    provenance,
    source: { start: sent.start, end: sent.end, text: sent.text },
    gaps,
    state: gaps.length ? "needs-input" : "proposed",
    mergedCount: 1,
    origin: "ai",
  };
}

/* Same type, same named place, inside 20 minutes — the manager
   mentioned one thing twice. Fold it, and say so on the card.
   Two nulls are not a match: we don't know they're the same. */
function dedupe(list) {
  const kept = [];
  for (const c of list) {
    const twin = kept.find(
      (k) =>
        k.type === c.type &&
        k.source?.start !== c.source?.start && // same sentence = a list, not a repeat
        ((k.location && k.location === c.location &&
          k.occurredAt && c.occurredAt &&
          Math.abs(toMins(k.occurredAt) - toMins(c.occurredAt)) <= 20) ||
          (k.occurredAt && k.occurredAt === c.occurredAt)),
    );
    if (twin) {
      twin.mergedCount += 1;
      continue;
    }
    kept.push(c);
  }
  return kept.sort((a, b) => sortKey(a) - sortKey(b));
}

// Night ordering: 21:00 comes before 02:00.
const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return (h < 12 ? h + 24 : h) * 60 + m;
};
const sortKey = (c) => (c.occurredAt ? toMins(c.occurredAt) : 99999);
