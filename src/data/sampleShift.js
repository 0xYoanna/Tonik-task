/* ─────────────────────────────────────────────────────────────
   THE FAKE NIGHT
   Content, not code. Rewrite any of this freely.
   ───────────────────────────────────────────────────────────── */

export const venue = {
  name: "The Vault",
  address: "14–16 Lower Bridge St, Manchester M3 7EP",
  licence: "PL/2019/04471",
  capacity: 420,
  manager: "J. Nowak",
  date: "Sat 12 Sep 2026",
  hours: "21:00 – 04:00",
  doorCount: 387,
};

/* The venue's own floorplan. The detector only matches locations
   from this list — a closed vocabulary beats open guessing. */
export const floorplan = [
  "Front door",
  "Queue",
  "Main room",
  "Dancefloor",
  "Bar 1",
  "Bar 2",
  "Smoking area",
  "Beer garden",
  "Toilets",
  "Cloakroom",
  "Back corridor",
  "Office",
];

/* Who was on the rota. Becomes the staff-present list to confirm,
   not compose. */
export const rota = [
  { name: "Marek W.", role: "Head door" },
  { name: "Ana L.", role: "Door" },
  { name: "Tomas R.", role: "Door" },
  { name: "Priya S.", role: "Bar lead" },
  { name: "Danny O.", role: "Bar" },
  { name: "Kat M.", role: "Floor" },
];

/* Cameras, for the preservation request. */
export const cameras = {
  "Front door": "Cam 1",
  Queue: "Cam 2",
  "Main room": "Cam 3",
  Dancefloor: "Cam 3",
  "Bar 1": "Cam 5",
  "Bar 2": "Cam 6",
  "Smoking area": "Cam 4",
  "Beer garden": "Cam 4",
  Toilets: "Cam 7 (corridor only)",
  Cloakroom: "Cam 8",
  "Back corridor": "Cam 7",
  Office: "Cam 9",
};

/* ── Dashboard fixtures ────────────────────────────────────────
   The shift at a glance. Content, not code — rewrite freely. */

export const shift = {
  status: "Closing",          // Open · Closing · Filed
  openedAt: "20:48",
  lastCall: "03:30",
  dutyManager: venue.manager,
  dps: "R. Okonkwo",          // designated premises supervisor
  onShiftSince: "20:30",
};

/* Who is actually here, versus who was rostered. */
export const onShift = [
  { name: "Marek W.", role: "Head door", in: "20:30", status: "on" },
  { name: "Ana L.", role: "Door", in: "20:30", status: "on" },
  { name: "Tomas R.", role: "Door", in: "21:00", status: "on" },
  { name: "Priya S.", role: "Bar lead", in: "20:15", status: "on" },
  { name: "Danny O.", role: "Bar", in: "20:45", status: "left" },
  { name: "Kat M.", role: "Floor", in: "21:00", status: "on" },
];

export const guests = {
  inside: 212,
  admitted: 387,
  capacity: 420,
  peak: 398,
  peakAt: "00:40",
  refused: 9,
};

/* The closing checklist. Binary by nature — which is exactly why
   it can't hold an incident. */
export const tasks = [
  { label: "Last call announced", owner: "Priya S.", done: true, at: "03:30" },
  { label: "Tills cashed up", owner: "Priya S.", done: true, at: "03:52" },
  { label: "Fridges restocked", owner: "Danny O.", done: true, at: "03:40" },
  { label: "Glassware collected", owner: "Kat M.", done: true, at: "03:58" },
  { label: "Floors cleared", owner: "Kat M.", done: false, at: null },
  { label: "Bins out", owner: "Tomas R.", done: false, at: null },
  { label: "Fire exits checked", owner: "Marek W.", done: false, at: null },
  { label: "Alarm set / lock-up", owner: venue.manager, done: false, at: null },
];

export const inventory = [
  { item: "Estrella keg", level: "2 left", status: "low" },
  { item: "House gin", level: "1 bottle", status: "low" },
  { item: "Prosecco", level: "Out", status: "out" },
  { item: "Ice", level: "Stocked", status: "ok" },
  { item: "Cups / glassware", level: "Stocked", status: "ok" },
];

/* Closed (private) events, and whether they're still running. */
export const privateEvents = [
  { name: "Hartley 30th", room: "Mezzanine", from: "20:00", to: "23:00", guests: 45, status: "finished" },
  { name: "Nova Records launch", room: "Main room", from: "21:00", to: "01:00", guests: 120, status: "finished" },
  { name: "Staff lock-in (Sun)", room: "Bar 2", from: "04:30", to: "06:00", guests: 18, status: "upcoming" },
];

export const maintenance = [
  { issue: "Ladies' cubicle 2 — lock broken", location: "Toilets", reported: "22:10", severity: "high", status: "open" },
  { issue: "Ice machine cutting out", location: "Bar 2", reported: "23:45", severity: "medium", status: "open" },
  { issue: "Emergency light flickering", location: "Back corridor", reported: "01:15", severity: "high", status: "escalated" },
  { issue: "Cloakroom rail bent", location: "Cloakroom", reported: "00:20", severity: "low", status: "logged" },
];

/* Filed reports, most recent first. */
export const reportHistory = [
  { date: "Fri 11 Sep", manager: "J. Nowak", incidents: 1, guests: 341, status: "Filed" },
  { date: "Thu 10 Sep", manager: "R. Okonkwo", incidents: 0, guests: 96, status: "Filed" },
  { date: "Sat 5 Sep", manager: "J. Nowak", incidents: 4, guests: 402, status: "Filed" },
  { date: "Fri 4 Sep", manager: "M. Doyle", incidents: 2, guests: 388, status: "Amended" },
  { date: "Thu 3 Sep", manager: "R. Okonkwo", incidents: 0, guests: 121, status: "Filed" },
];

/* ── The thirteen report sections ───────────────────────────────
   SUPERSEDED by src/lib/sections.js, which owns the thirteen now
   along with the keywords that tick each one off. Kept only for
   the sidebar-era shape; safe to delete.
   ── original note ──────────────────────────────────────
   `live: true` is the only one built. The rest are visibly stubbed,
   which is the point — the shape of the whole thing is visible
   without confronting it. */
export const sections = [
  { key: "overview", label: "General overview" },
  { key: "incidents", label: "Incidents", live: true },
  { key: "audience", label: "Audience, experience & safety" },
  { key: "security", label: "Security overview" },
  { key: "artists", label: "Artist & crew experience" },
  { key: "door", label: "Door staff review" },
  { key: "production", label: "Production / run of show" },
  { key: "bar", label: "Bar staff review" },
  { key: "kitchen", label: "Kitchen" },
  { key: "vendors", label: "Third-party vendors" },
  { key: "private", label: "Private events" },
  { key: "maintenance", label: "Maintenance & equipment" },
  { key: "inventory", label: "Inventory notes" },
];

/* ── Three nights ───────────────────────────────────────────────
   The flow bends on volume and on silence. Each of these
   exercises a different branch. */
export const sampleNights = {
  typical: {
    label: "Typical night",
    hint: "3 incidents · one with a missing location",
    text: `Steady night, busier than last Saturday. Around 23:10 we turned away a lad with a fake ID, he got shirty about it but walked off in the end.

Main thing was about 01:40 in the smoking area — two blokes started shoving each other over nothing. Marek and Ana got there fast and both were escorted out. No injuries, neither wanted police involved.

Glass got smashed behind bar 2 around 02:15, Priya cleaned it up, nobody hurt. Otherwise a normal one. Cash up was fine, lights off at 04:20.`,
  },

  quiet: {
    label: "Quiet night",
    hint: "0 incidents · the attestation path",
    text: `Dead quiet, rain all night. Maybe 90 people through the door at the busiest.

Bar was slow so I sent Danny home at 2. Cleaned down early, everything locked by 03:30. Nothing to report.`,
  },

  chaotic: {
    label: "Chaotic night",
    hint: "20+ · clustering, severity gate, partial file",
    text: `Absolute write-off of a night, two coach parties in.

Front door turned away a lot of people — refused entry around 22:10, again 22:25, 22:40, one at 23:15 who came back twice and got knocked back again at 23:50, then more at 00:10, 00:35, 01:20 and 01:45. Most were just too far gone.

Someone got glassed on the dancefloor around 02:50 — cut above the eye, bleeding a fair bit. Kat did first aid, we called an ambulance, paramedics took them at 03:20.

Police attended at 01:05 at the front door over something that started outside, not ours but they wanted our footage.

Ejected three people over the night — 00:30 from the main room, 01:55 from the dancefloor, and one from the smoking area about 02:20. Found a baggie in the toilets around 01:30, disposed of it.

Cash up was a mess, still not right.`,
  },
};

/* ── Evidence fixtures ──────────────────────────────────────────
   Two stubbed pieces of evidence for the demo.

   NOTE ON HONESTY: `note.transcription` below is written fixture
   content, not a real read of the image. The file is a generic
   handwritten page, and nothing in the prototype performs OCR.
   The interaction is real; the reading is staged. Say so in any
   walkthrough — an over-claimed capability is exactly the thing
   that gets picked apart. */
export const evidence = {
  note: {
    src: "/img/note.jpeg",
    label: "Door team incident slip",
    from: "Marek W.",
    transcription: [
      { field: "Time", value: "01:40" },
      { field: "Location", value: "Smoking area, by the side gate" },
      { field: "Involved", value: "Two males — one in a red shirt, one in a grey jacket" },
      { field: "What happened", value: "Shoving, no punches landed. Separated in under a minute." },
      { field: "Action", value: "Both walked out via the side gate. Neither wanted police." },
      { field: "Injuries", value: "None seen" },
      { field: "Names", value: "Both refused to give details" },
    ],
    unreadable: "One line under 'Action' is too faint to read — it may be a time.",
  },
  cctv: {
    src: "/img/CCTV.jpeg",
    label: "Still from the flagged window",
  },
};
