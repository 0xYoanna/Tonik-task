/* ─────────────────────────────────────────────────────────────
   THE ASK LOOP
   What replaces the form.

   The manager never sees an empty field. When the record is short
   of something, this decides the ONE question worth asking next,
   in the manager's register, answerable in four words.

   Two hard rules carried over:
     · A blank beats a guess. "No idea" is recorded as no idea,
       never as an invented timestamp.
     · It may ask whether names were taken. It may never propose
       one. Events get classified; people never do.
   ───────────────────────────────────────────────────────────── */

import {
  TYPES, findTimes, findLocations, cameraFor, preservationWindow, matchKeyword,
} from "./detector.js";
import { venue, rota } from "../data/sampleShift.js";
import { shiftNow } from "./clock.js";

/* ── The question set ──────────────────────────────────────────
   Ordered by what a register entry has to carry, from PRD §9 and
   the Tier 1 field sets in INCIDENT-TYPES.md.

   `when` gates a question on what's already known, so nobody is
   asked for a police reference when police never came. Every
   question is answerable in four words or one button. */

const ACTIONS = [
  "Ejected", "Refused service", "Police called", "Ambulance called",
  "First aid given", "Banned", "Warned", "Nothing further",
];

const YES_NO = ["Yes", "No"];

const QUESTIONS = [
  {
    key: "involved",
    field: "involved",
    q: "Who was involved? Names if you have them, descriptions if not.",
    options: ["Nobody identified"],
    /* Asked, never proposed. The system classifies events; a
       person's name only ever gets there because a human typed
       it. PRD §6 — the Patronscan lesson. */
  },
  {
    key: "staff",
    field: "staff",
    q: "Who from the team dealt with it?",
    options: () => rota.map((r) => r.name),
  },
  {
    key: "injury",
    field: "injury",
    q: "Was anyone injured?",
    options: YES_NO,
  },
  {
    key: "injuryDetail",
    field: "note",
    q: "Describe the injury — what it was, who gave first aid, and whether an ambulance came.",
    when: (inc) => inc.injury === true,
  },
  {
    key: "riddor",
    field: "note",
    q: "Was the injured person a member of staff? That triggers a RIDDOR check.",
    options: YES_NO,
    when: (inc) => inc.injury === true,
  },
  {
    key: "action",
    field: "action",
    q: "What was done about it?",
    options: ACTIONS,
  },
  {
    key: "policeRef",
    field: "note",
    q: "Do you have the police reference number?",
    options: ["Not given yet"],
    when: (inc) => inc.outcomes?.some((o) => o.key === "police"),
  },
  {
    key: "witnesses",
    field: "note",
    q: "Any witnesses — staff or customers?",
    options: ["None"],
  },
];

/* Types carrying legal weight demand more than the common set. */
const FOLLOW_UPS = {
  drugs: [{ key: "substance", q: "What was it — and did you keep it or bin it?" }],
  weapon: [{ key: "weaponDetail", q: "What was it, and how was it found?" }],
  safeguarding: [{ key: "welfare", q: "How did they leave, and who took responsibility?" }],
  fire: [{ key: "allclear", q: "What triggered it, and when was the all-clear?" }],
  other: [{ key: "what", q: "What actually happened there?" }],
};

const UNKNOWN = /\b(no idea|dunno|don'?t know|not sure|can'?t remember|no clue)\b/i;
const NEGATIVE = /\b(no|nope|none|nothing|didn'?t|did not|nah|negative)\b/i;
const AFFIRMATIVE = /\b(yes|yeah|yep|yup|ok|okay|sure|please|do it|aye)\b/i;
const DONE = /\b(no|nope|nothing|that'?s it|that is it|all|done|finished|nothing else|we'?re good)\b/i;

/* The next question for one incident, or null if it's ready.
   Every question carries a key, and the key is recorded once
   asked — so the loop always terminates, answered or not. */
export function nextQuestion(inc, quick = false) {
  const asked = inc.asked ?? [];
  const pending = (key) => !asked.includes(key);

  /* The escape hatch that makes a missed guard survivable: if
     something reached here that was never an incident, one tap
     removes it. No enumeration has to be complete for this to
     hold. */
  if (!inc.type && pending("type"))
    return {
      key: "type",
      field: "type",
      q: "What kind of incident was that?",
      options: ["Ejection", "Refusal of entry", "Injury", "Not an incident"],
    };

  if (!inc.occurredAt && pending("occurredAt"))
    return {
      key: "occurredAt",
      field: "occurredAt",
      q: quick ? "When did this happen?" : "What time did that happen?",
      options: quick ? ["Just now", LOG_AS_IS] : undefined,
    };

  /* Location is statutory, and it's also what names the camera —
     without it the footage flag has nothing to point at. */
  if (!inc.location && pending("location"))
    return {
      key: "location",
      field: "location",
      q: "Whereabouts in the venue?",
      options: quick
        ? ["Front door", "Dancefloor", "Smoking area", "Bar 2", LOG_AS_IS]
        : ["Front door", "Dancefloor", "Smoking area", "Bar 2", "Toilets"],
    };

  /* One probe for detail while it's fresh — memory at 01:42 is
     better than memory at 03:40 — then it stops. Everything else
     waits for the end of the night. */
  if (quick) {
    if (pending("detail"))
      return {
        key: "detail",
        field: "note",
        q: "What happened?",
        options: [LOG_AS_IS],
      };
    return null;
  }

  for (const q of QUESTIONS) {
    if (!pending(q.key)) continue;
    if (q.when && !q.when(inc)) continue;
    return {
      ...q,
      options: typeof q.options === "function" ? q.options() : q.options,
    };
  }

  for (const f of FOLLOW_UPS[inc.type] ?? [])
    if (pending(f.key)) return { key: f.key, field: "note", q: f.q };

  if (inc.occurredAt && pending("footage")) {
    const w = preservationWindow(inc.occurredAt);
    const cam = cameraFor(inc.location) ?? "the nearest camera";
    return {
      key: "footage",
      field: "footage",
      q: `Want me to flag ${cam} for ${w.from}–${w.to}? It'll overwrite itself otherwise.`,
      options: YES_NO,
    };
  }

  return null;
}

/* Apply a free-text answer to whichever question was pending.
   The manager answers how they'd answer a person. */
export function applyAnswer(inc, question, text) {
  const answer = text.trim();
  const asked = [...(inc.asked ?? []), question.key];
  const next = { ...inc, asked };

  /* "I don't know" only means the whole answer when that IS the
     whole answer. "David and Mike but I don't know the surnames"
     carries two names — bailing on the phrase threw them away. */
  if (UNKNOWN.test(answer) && answer.length < 30) {
    // Recorded as not known. Never backfilled with a guess.
    next.unknowns = [...(next.unknowns ?? []), question.key];
    return harvest(next, text);
  }

  switch (question.field) {
    case "occurredAt": {
      if (/just now|right now|now|this minute/i.test(answer)) {
        next.occurredAt = shiftNow();
        break;
      }
      const t = findTimes(answer)[0];
      if (t) {
        next.occurredAt = t.value;
        next.timeApprox = t.approx;
      }
      break;
    }
    case "location": {
      const l = findLocations(answer)[0];
      next.location = l ? l.value : answer.slice(0, 40);
      break;
    }
    case "type": {
      if (/not an incident|ignore|nevermind|never mind|forget it|my mistake/i.test(answer)) {
        next.discard = true;
        break;
      }
      const hit = Object.entries(TYPES).find(
        ([, t]) => t.keywords?.some((k) => matchKeyword(answer, k) !== -1),
      );
      if (hit) {
        next.type = hit[0];
        next.typeLabel = hit[1].label;
        next.tier = hit[1].tier;
        next.gate = hit[1].gate;
      }
      break;
    }
    /* Names reach the record only because a human typed them.
       There is no path from detection to this field. */
    case "involved": {
      if (!/nobody|none|no one|didn'?t get/i.test(answer)) {
        /* Take only the naming part of the sentence. Everything
           after the first full stop or "but" is commentary, and
           splitting the whole thing on commas turns half a
           paragraph into a person's name. */
        const namesPart = answer
          .split(/[.!?]/)[0]
          .split(/\s+\b(?:but|though|although|however)\b\s+/i)[0];
        const found = namesPart
          .split(/,|\band\b|\+/)
          .map((s) => s.trim().replace(/^(a |the |some )/i, ""))
          .filter((s) => s.length > 1 && s.length <= 40);
        next.personsInvolved = [...new Set([...next.personsInvolved, ...found])];
      }
      break;
    }

    case "injury": {
      next.injury = AFFIRMATIVE.test(answer) && !NEGATIVE.test(answer);
      if (next.injury)
        next.outcomes = [...next.outcomes, { key: "harm", label: "Someone was injured" }];
      break;
    }

    case "action": {
      const picked = answer.split(/,| and /).map((s) => s.trim()).filter(Boolean);
      next.actionTaken = [...(next.actionTaken ?? []), ...picked];
      /* "Police called" is what unlocks the reference-number
         question — a police ref is the cross-reference that makes
         the entry provable later. */
      if (/police/i.test(answer))
        next.outcomes = [...next.outcomes, { key: "police", label: "Police attended" }];
      if (/ambulance/i.test(answer))
        next.outcomes = [...next.outcomes, { key: "ambulance", label: "Ambulance called" }];
      if (/first aid/i.test(answer))
        next.outcomes = [...next.outcomes, { key: "first_aid", label: "First aid given" }];
      if (/banned/i.test(answer))
        next.outcomes = [...next.outcomes, { key: "banned", label: "Person banned" }];
      break;
    }

    case "staff": {
      const named = rota.filter((r) =>
        answer.toLowerCase().includes(r.name.split(" ")[0].toLowerCase()),
      );
      next.staffPresent = named.length ? named.map((r) => r.name) : next.staffPresent;
      break;
    }
    case "footage":
      next.preserve = AFFIRMATIVE.test(answer) || !NEGATIVE.test(answer);
      break;
    default: {
      /* A note against the incident, in the manager's own words.
         Names typed here are theirs — nothing here is proposed. */
      const note = { key: question.key, question: question.q, answer };
      next.notes = [...(next.notes ?? []), note];
      if (question.key === "harm" && !NEGATIVE.test(answer))
        next.outcomes = [...next.outcomes, { key: "harm", label: "Someone was hurt" }];
      if (question.key === "ambulance" && !NEGATIVE.test(answer))
        next.outcomes = [...next.outcomes, { key: "ambulance", label: "Ambulance called" }];
      if (question.key === "police" && !NEGATIVE.test(answer))
        next.outcomes = [...next.outcomes, { key: "police", label: "Police attended" }];
      break;
    }
  }
  /* Whatever else that sentence settled, settle it now — so a
     question already answered in passing never gets asked. */
  return harvest(next, text);
}

/* ── Harvest ───────────────────────────────────────────────────
   People don't answer one question at a time. "David was hurt, we
   didn't call ambulance nor police" answers three, and asking them
   again is the fastest way to make a conversation feel stupid.

   So every message is scanned for everything it settles, not just
   the field that was asked about. Questions whose answers are
   already in the transcript never get asked. */

const NEG_NEAR = /\b(no|not|nor|neither|nobody|none|never|without|didn'?t|did not|wasn'?t|weren'?t|haven'?t|hadn'?t)\b/i;

function negatedNear(lower, idx) {
  return NEG_NEAR.test(lower.slice(Math.max(0, idx - 36), idx));
}

function mentions(lower, re) {
  const m = re.exec(lower);
  return m ? { idx: m.index, negated: negatedNear(lower, m.index) } : null;
}

export function harvest(inc, text) {
  const next = { ...inc };
  const asked = new Set(next.asked ?? []);
  const lower = text.toLowerCase();
  const outcomes = [...(next.outcomes ?? [])];
  const add = (key, label) => {
    if (!outcomes.some((o) => o.key === key)) outcomes.push({ key, label });
  };

  /* Injury — and when it's explicitly ruled out, the two
     follow-ups that only exist because of it go with it. */
  if (!asked.has("injury")) {
    const hurt = mentions(lower, /\b(hurt|injured|injury|bleeding|glassed|broke (his|her|their)|split (his|her|their)|cut (his|her|their))\b/);
    if (hurt) {
      asked.add("injury");
      next.injury = !hurt.negated;
      if (hurt.negated) {
        asked.add("injuryDetail");
        asked.add("riddor");
      } else {
        add("harm", "Someone was injured");
      }
    }
  }

  const ambulance = mentions(lower, /\b(ambulance|paramedics?)\b/);
  if (ambulance) {
    asked.add("ambulance");
    if (!ambulance.negated) add("ambulance", "Ambulance called");
  }

  const police = mentions(lower, /\b(police|cops|999|112)\b/);
  if (police) {
    asked.add("police");
    if (police.negated) asked.add("policeRef"); // no police, no reference
    else add("police", "Police attended");
  }

  if (mentions(lower, /\bfirst aid\b/)) add("first_aid", "First aid given");
  if (mentions(lower, /\b(banned|barred)\b/)) add("banned", "Person banned");

  /* "Ambulance was called but he didn't want the police" describes
     what was done. Asking "what was done about it?" straight after
     is the exact complaint this whole pass exists to stop — so any
     action vocabulary settles that question too. */
  const ACTIONS_SEEN = [
    [/\bambulance|paramedics?\b/, "Ambulance called"],
    [/\bpolice|cops\b/, "Police called"],
    [/\bfirst aid\b/, "First aid given"],
    [/\b(ejected|kicked out|thrown out|removed|put (him|her|them) out|escorted out)\b/, "Ejected"],
    [/\b(banned|barred)\b/, "Banned"],
    [/\b(refused service|cut off|stopped serving)\b/, "Refused service"],
    [/\b(warned|given a warning)\b/, "Warned"],
  ];
  const taken = [];
  let sawAction = false;
  for (const [re, label] of ACTIONS_SEEN) {
    const m = mentions(lower, re);
    if (!m) continue;
    sawAction = true;
    if (!m.negated) taken.push(label);
  }
  if (sawAction) {
    asked.add("action");
    if (taken.length)
      next.actionTaken = [...new Set([...(next.actionTaken ?? []), ...taken])];
  }

  /* Staff are a closed list, so a name in the text is unambiguous. */
  const named = rota.filter((r) =>
    new RegExp(`\\b${r.name.split(" ")[0]}\\b`, "i").test(text),
  );
  if (named.length) {
    asked.add("staff");
    next.staffPresent = [...new Set([...(next.staffPresent ?? []), ...named.map((r) => r.name)])];
  }

  if (mentions(lower, /\b(no witnesses|nobody saw|no one saw)\b/)) asked.add("witnesses");

  next.outcomes = outcomes;
  next.asked = [...asked];
  return next;
}

/* Which questions are still open on this record. Sent to the model
   so it can tell us which ones a message settles, rather than us
   guessing from keywords. */
export function outstandingKeys(inc, quick = false) {
  if (!inc) return [];
  const keys = [];
  let probe = { ...inc, asked: [...(inc.asked ?? [])] };
  for (let i = 0; i < 20; i += 1) {
    const q = nextQuestion(probe, quick);
    if (!q) break;
    keys.push(q.key);
    probe.asked.push(q.key);
  }
  return keys;
}

/* The model's verdict on what a message settled. Same job as
   harvest(), done by something that reads rather than matches. */
export function applyAnswered(inc, answered = []) {
  if (!answered.length) return inc;
  const next = { ...inc };
  const asked = new Set(next.asked ?? []);
  const outcomes = [...(next.outcomes ?? [])];
  const add = (key, label) => {
    if (!outcomes.some((o) => o.key === key)) outcomes.push({ key, label });
  };

  for (const { key, value } of answered) {
    asked.add(key);
    const v = (value ?? "").trim();
    if (!v) continue;

    if (key === "occurredAt") {
      const t = findTimes(v)[0];
      if (t) next.occurredAt = t.value;
    } else if (key === "location") {
      const l = findLocations(v)[0];
      if (l) next.location = l.value;
    } else if (key === "injury") {
      next.injury = !NEGATIVE.test(v);
      if (next.injury) add("harm", "Someone was injured");
      else {
        asked.add("injuryDetail");
        asked.add("riddor");
      }
    } else if (key === "staff") {
      const named = rota.filter((r) =>
        new RegExp(`\\b${r.name.split(" ")[0]}\\b`, "i").test(v),
      );
      if (named.length)
        next.staffPresent = [...new Set([...(next.staffPresent ?? []), ...named.map((r) => r.name)])];
    } else if (key === "action") {
      next.actionTaken = [...new Set([...(next.actionTaken ?? []), v])];
      if (/police/i.test(v) && !NEGATIVE.test(v)) add("police", "Police attended");
      if (/ambulance/i.test(v) && !NEGATIVE.test(v)) add("ambulance", "Ambulance called");
    } else if (key !== "involved" && key !== "type" && key !== "footage") {
      next.notes = [...(next.notes ?? []), { key, question: key, answer: v }];
    }
  }

  next.outcomes = outcomes;
  next.asked = [...asked];
  return next;
}

export function isReady(inc) {
  return nextQuestion(inc) === null;
}

/* "Nothing to report" must never become a record to classify.
   The quiet night is the most common night and the one every tool
   in the category treats as the user failing to show up. */
const NOTHING = /\b(nothing to report|nothing happened|nothing at all|nothing kicked off|no incidents|uneventful|dead quiet|quiet one|quiet night|all good|no problems|no trouble|nothing much|nothing really)\b/i;

export function saysNothing(text) {
  return NOTHING.test(text);
}

export function saysDone(text) {
  const t = text.trim().toLowerCase();
  return t.length < 30 && DONE.test(t);
}

/* It opens holding the facts, so nothing already known gets typed. */
export function opening() {
  const door = rota.filter((r) => r.role.toLowerCase().includes("door"));
  const bar = rota.filter((r) => !r.role.toLowerCase().includes("door"));
  return [
    `${venue.date} · ${venue.name} · ${venue.hours} · ${venue.doorCount} through the door.`,
    `${door.map((r) => r.name.split(" ")[0]).join(", ")} on the door. ${bar.map((r) => r.name.split(" ")[0]).join(" and ")} inside.`,
    "How was tonight?",
  ];
}

/* ── Off-topic guard ───────────────────────────────────────────
   An open chat box invites questions the product has no business
   answering. Two rules make this behave:

   1. Key on SHAPE, not subject. "Tell me the weather" is a
      request aimed at the assistant; "it rained all night so the
      queue was miserable" is report content. Same topic, opposite
      handling — so blocking on subject matter would throw away
      real material.
   2. Fail toward ASKING, never toward refusing. Under-blocking
      costs one clumsy question; over-blocking loses an incident
      from a statutory register. */

/* Question-shaped openers. Deliberately broad: this is the
   no-API fallback, and it will still have holes — every
   enumeration does. The model's own `off_topic` classification is
   the real guard; this is what runs when there's no key. */
const QUESTION_SHAPE =
  /^\s*(who|what|whats|what's|when|where|which|why|how|is|are|was|were|do|does|did|can|could|will|would|should|tell|give|show|write|draft|explain|define|translate|search|google|look up|generate|make|create|play|sing|recommend|suggest)\b/i;

/* If any of this shows up it's about tonight — treat it as report
   content even when it's phrased as a question. This list is what
   keeps "what time did the police leave?" from being refused. */
const VENUE_VOCAB =
  /\b(incident|eject\w*|refus\w*|injur\w*|hurt|bleed\w*|collaps\w*|police|ambulance|paramedic|door|bar|kitchen|dancefloor|smoking|toilet|queue|cloakroom|guest|punter|customer|crowd|staff|shift|stock|keg|cctv|camera|footage|till|cash|drug|fight|scrap|assault|theft|damage|evacuat\w*|maintenance|broken|glass|report|log|tonight|last night|venue|closing|manager|security|dj|artist)\b/i;

export function isOffTopic(text) {
  const t = text.trim();
  if (t.length > 200) return false;      // a long account is an account
  if (VENUE_VOCAB.test(t)) return false; // mentions the venue: it's ours
  return QUESTION_SHAPE.test(t);
}

/* "I'm attaching the slip from security." Recognising that the
   manager is handing over evidence — rather than narrating more
   of the night — is what lets the attachment land in the thread
   instead of being parsed for incidents. */
const ATTACHING = /\b(attach|attaching|attached|sending|send you|here'?s|photo|photos|picture|image|screenshot|scan|slip|handover note)\b/i;

export function saysAttaching(text) {
  return ATTACHING.test(text);
}

/* If the manager clearly described something and the detector
   came back empty, that is not a reason to say nothing. It opens
   an unclassified record and ASKS — silence would read as broken,
   and inventing a category would be worse. */
export function looksSubstantive(text) {
  const t = text.trim();
  return t.length > 24 && !saysDone(t) && !saysNothing(t);
}

export function unclassified(text, id) {
  return {
    id,
    type: "",
    typeLabel: "",
    tier: 2,
    gate: true,
    occurredAt: null,
    location: null,
    description: text.trim(),
    outcomes: [],
    severity: "minor",
    staffPresent: [],
    personsInvolved: [],
    attachments: [],
    extraFields: [],
    confidence: null,
    provenance: [],
    source: null,
    gaps: [],
    mergedCount: 1,
    origin: "ai",
    asked: [],
  };
}

/* The report flow must never make the manager narrate something
   they already logged at 01:45. It opens holding the record. */
export function reportOpening(incidents) {
  if (!incidents.length)
    return [
      `${venue.date} · ${venue.name} · ${venue.hours} · ${venue.doorCount} through the door.`,
      "Nothing logged tonight so far. How was the shift?",
    ];

  const lines = incidents.map(
    (i) => `· ${i.occurredAt} ${i.typeLabel}${i.location ? ` — ${i.location}` : ""}`,
  );
  const short = incidents.filter((i) => !i.full).length;
  return [
    `${incidents.length} logged tonight as it happened:`,
    lines.join("\n"),
    short
      ? "A few details got left for now. Let me pick those up, then anything else from the night."
      : "Anything else from the night?",
  ];
}

/* Always on the table while it's probing. The manager is standing
   up with a radio in their hand — every question has to be
   skippable in one tap, or the probing becomes the interrogation
   the quick log exists to avoid. */
export const LOG_AS_IS = "Log it as is";

export const QUICK_KEYS = ["type", "occurredAt", "location", "detail"];

export function saidLogAsIs(text) {
  return /log it as is|as is|just log it|that'?s enough|log that/i.test(text);
}

export const CONFIRM_Q = {
  key: "confirm",
  field: "confirm",
  q: "Should I log it?",
  options: ["Yes", "No"],
};

export const CHANGE_Q = {
  key: "change",
  field: "change",
  q: "What do you want to change?",
};

export function saidYes(text) {
  return AFFIRMATIVE.test(text) && !NEGATIVE.test(text);
}

/* Must be an explicit no. Treating "not yes" as "no" is what made
   the conversation feel like an interrogation: a manager who keeps
   describing the incident instead of answering was being told
   their record was wrong. */
export function saidNo(text) {
  const t = text.trim();
  /* A bare no, on its own. "no injuries, they just left" opens
     with the same word and is detail, not a rejection — so the
     bare forms have to stand alone to count. */
  if (/^(no|nope|nah|wrong|incorrect|not really)[.!]?$/i.test(t)) return true;
  return /\b(that'?s wrong|not right|isn'?t right|not correct|change it|fix it|that'?s not)\b/i.test(t);
}

/* A correction arrives as a sentence, not a form: "it was bar 2,
   not the smoking area". Re-read it with the same parsers that
   read the original account and apply whatever it carries. */
export function applyCorrection(inc, text) {
  const next = { ...inc };
  const t = findTimes(text)[0];
  if (t) {
    next.occurredAt = t.value;
    next.timeApprox = t.approx;
  }
  const l = findLocations(text)[0];
  if (l) next.location = l.value;

  const hit = Object.entries(TYPES).find(
    ([, ty]) => ty.keywords?.some((k) => matchKeyword(text, k) !== -1),
  );
  if (hit) {
    next.type = hit[0];
    next.typeLabel = hit[1].label;
    next.tier = hit[1].tier;
    next.gate = hit[1].gate;
    next.extraFields = hit[1].extra ?? [];
  }

  /* Nothing recognised — keep it as a note rather than silently
     discarding what they said. */
  if (!t && !l && !hit)
    next.notes = [...(next.notes ?? []), { key: `fix${(next.notes ?? []).length}`, question: "Correction:", answer: text.trim() }];

  next.corrections = [...(next.corrections ?? []), { at: new Date().toISOString(), text: text.trim() }];
  next.asked = (next.asked ?? []).filter((k) => k !== "confirm"); // ask again
  return harvest(next, text);
}

/* Nine refusals at the door become one question, not nine. */
export function groupOf(incidents) {
  const routine = incidents.filter((i) => !i.gate && !i.ready);
  if (routine.length < 4) return null;
  const type = routine[0].type;
  if (!routine.every((i) => i.type === type)) return null;
  return {
    type,
    label: TYPES[type]?.label ?? type,
    ids: routine.map((i) => i.id),
    times: routine.map((i) => i.occurredAt).filter(Boolean),
  };
}
