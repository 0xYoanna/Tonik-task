/* ─────────────────────────────────────────────────────────────
   THE THIRTEEN
   A checklist, not a form. Nothing here is required and nothing
   blocks sign-off — it exists so the manager can see the shape of
   a complete night without being made to fill anything in.

   An item ticks itself when the manager MENTIONS it. They never
   pick a section; they just talk, and this works out where what
   they said belongs.
   ───────────────────────────────────────────────────────────── */

import { matchKeyword } from "./detector.js";
import { tasks, inventory, maintenance, privateEvents, onShift, guests } from "../data/sampleShift.js";

export const SECTIONS = [
  {
    key: "overview",
    label: "General overview",
    hint: "How the night went overall",
    keywords: ["overall","on the whole","generally","in general","steady","busy","quiet",
      "normal night","decent night","good night","rough night","write-off","the night was"],
  },
  {
    key: "incidents",
    label: "Incidents",
    hint: "Anything for the register",
    keywords: [], // ticked by a logged incident, not by a keyword
  },
  {
    key: "audience",
    label: "Audience, experience & safety",
    hint: "Crowd, atmosphere, anything unsafe",
    keywords: ["crowd","punters","customers","audience","atmosphere","vibe","queue",
      "dancefloor was","capacity","busy inside","people were","guests were"],
  },
  {
    key: "security",
    label: "Security overview",
    hint: "Searches, safety, how security held up",
    keywords: ["security","searches","searched","sia","radios","no trouble","trouble free",
      "kept it calm","security were"],
  },
  {
    key: "artists",
    label: "Artist & crew experience",
    hint: "DJs, bands, green room, riders",
    keywords: ["dj","artist","band","performer","headliner","support act","green room",
      "rider","sound check","soundcheck","crew were","tour manager"],
  },
  {
    key: "door",
    label: "Door staff review",
    hint: "How the door team did",
    keywords: ["door staff","door team","on the door","id checks","scanner","marek","ana","tomas",
      "door were","doormen"],
  },
  {
    key: "production",
    label: "Production / run of show",
    hint: "Sound, lights, set times",
    keywords: ["sound","lights","lighting","run of show","set times","stage","production",
      "engineer","av","monitors","smoke machine","overran"],
  },
  {
    key: "bar",
    label: "Bar staff review",
    hint: "Service, speed, the team behind the bar",
    keywords: ["bar staff","behind the bar","priya","danny","service was","bar was","tills",
      "cash up","cashed up","bar team","pouring"],
  },
  {
    key: "kitchen",
    label: "Kitchen",
    hint: "Food service, if you ran any",
    keywords: ["kitchen","food","chef","orders","hot food","menu","served food"],
  },
  {
    key: "vendors",
    label: "Third-party vendors",
    hint: "Cloakroom, photographers, suppliers, taxis",
    keywords: ["vendor","supplier","third party","cloakroom company","photographer","taxi",
      "delivery driver","contractor","external"],
  },
  {
    key: "private",
    label: "Private events",
    hint: "Closed events and how they ran",
    keywords: ["private event","private hire","birthday","function","mezzanine","launch",
      "booking","hartley","nova records","lock-in"],
  },
  {
    key: "maintenance",
    label: "Maintenance & equipment",
    hint: "Anything broken or needing a look",
    keywords: ["broken","broke","fixed","repair","maintenance","ice machine","lock","leak",
      "flickering","out of order","needs looking at","packed in","stopped working"],
  },
  {
    key: "inventory",
    label: "Inventory notes",
    hint: "Stock levels, anything that ran out",
    keywords: ["stock","ran out","running low","low on","kegs","keg","bottles","inventory",
      "restock","order more","we're out of"],
  },
];

/* What the system already knows before the manager says a word —
   it comes off the shift dashboard. These are proposed, not
   ticked: the manager still has to say whether anything changed. */
export function knownFacts() {
  const done = tasks.filter((t) => t.done).length;
  const low = inventory.filter((i) => i.status !== "ok");
  const openIssues = maintenance.filter((m) => m.status !== "closed");
  const here = onShift.filter((p) => p.status === "on");

  return {
    overview: `${guests.admitted} admitted, peaked at ${guests.peak} around ${guests.peakAt}.`,
    audience: `${guests.inside} still inside, ${guests.refused} refused at the door.`,
    door: `${here.length} of ${onShift.length} staff still on. ${guests.refused} refusals logged.`,
    bar: `Closing tasks ${done} of ${tasks.length} done.`,
    inventory: low.length
      ? `${low.map((i) => `${i.item} (${i.level.toLowerCase()})`).join(", ")}.`
      : "Everything stocked.",
    maintenance: openIssues.length
      ? `${openIssues.length} open: ${openIssues.map((m) => m.issue.split(" — ")[0]).join(", ")}.`
      : "Nothing outstanding.",
    private: privateEvents.length
      ? privateEvents.map((e) => `${e.name} (${e.status})`).join(", ") + "."
      : "None booked.",
  };
}

/* Which of the thirteen does this sentence belong to? A single
   sentence can land in more than one — "the ice machine packed in
   and we ran out of lime" is maintenance AND inventory. */
export function matchSections(text) {
  const lower = text.toLowerCase();
  return SECTIONS.filter(
    (s) => s.keywords.length && s.keywords.some((k) => matchKeyword(lower, k) !== -1),
  ).map((s) => s.key);
}

/* The next couple worth nudging about — never all thirteen.
   A checklist is a map; turning it into thirteen questions is how
   you get thirteen padded answers. */
export function suggestNext(covered, limit = 2) {
  const priority = ["overview", "audience", "door", "bar", "maintenance", "inventory", "security"];
  return priority
    .filter((k) => !covered[k])
    .slice(0, limit)
    .map((k) => SECTIONS.find((s) => s.key === k));
}
