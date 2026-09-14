# The 3AM Report

**A shift report that a closing manager finishes before they've finished cashing
up — and that still holds up two years later when a lawyer asks what happened.**

Prototype built for the tonik product design task. The **incident path** is real
and working; the rest of the report is visible and deliberately stubbed.

---

## The bet

Licensed venues are legally required to keep an incident log, and almost all of
them keep a bad one — because the person with the facts is the person least able
to write them down at the moment the law wants them written.

Every existing tool solves the wrong half. Ops platforms make the shift log
*convenient*; security platforms make the incident record *rigorous*. Nothing
makes the rigorous thing convenient enough to survive 3am.

> This isn't a faster form. There is no form. The manager talks; the system
> notices what's missing and asks one specific question at a time; the record is
> written out of the back of the answers.

The full argument, the research behind it and the competitive read are in
[docs/PRD.md](docs/PRD.md); the incident taxonomy and the statutory field set
are in [docs/INCIDENT-TYPES.md](docs/INCIDENT-TYPES.md).

---

## Two moments, two flows

The manager meets the product twice a night, and the two visits want opposite
things.

| | **Quick log** — 01:42, on the floor | **Shift report** — 03:40, back office |
|---|---|---|
| Costs them | **One line. Zero questions.** | A few short answers |
| Time | Stamped automatically | Already known |
| CCTV | Camera and window flagged **without being asked** | Already flagged |
| Ends at | Back to the floor | Attestation and signature |

The split exists because the footage is the perishable part: most venue
recorders overwrite when the disk fills, not on a schedule. A flag raised at
01:42 catches footage that is minutes old.

**Nothing is ever narrated twice.** The report flow opens holding what was
logged as it happened and asks only for what was deferred.

---

## What's built

- **Shift dashboard** — staff on, guests, tasks, inventory, private events,
  maintenance, and the two entry points
- **Quick log** — one exchange, automatic timestamp, automatic CCTV flag
- **Shift report** — picks up deferred detail, then the thirteen report sections
  as a checklist that ticks itself as you talk
- **Live dictation** — real Web Speech API, not a stub
- **Evidence** — CCTV still on the record, attachment with a read-back
- **Sign-off** — attestation, signature, and an amendment path after filing

Deliberately **not** built: real file handling, DVR integration, cross-venue
patron flagging, owner-side analytics. See [docs/PRD.md](docs/PRD.md) §11.

---

## Running it

Requires **Node 20.19+**.

```bash
npm install
npm run dev
```

Then open the URL it prints. Three sample nights are on the capture screen —
quiet, typical and chaotic — because the way the flow bends under silence and
under volume is the interesting part.

### Optional: the real model

Detection runs through **Claude Opus 5** when an API key is present, and falls
back to a local keyword detector when it isn't. Both return the same shape, so
nothing downstream knows which answered.

```bash
cp .env.example .env     # paste your key
npm run dev              # restart — env is read at startup
```

Without a key the app still works. That fallback also covers a rate limit or a
dropped connection mid-demo.

**What the model does:** reads the manager's words — classifying the message,
extracting incident fields, spotting which report sections were touched.

**What it doesn't:** decide what to ask next, the severity gate, the question
order, or ever name a person. Those stay deterministic in
[`src/lib/conversation.js`](src/lib/conversation.js) — which is why the fallback
works at all. Only one layer swaps.

---

## Design decisions worth knowing

**A blank beats a guess.** Below the confidence threshold the field stays empty
and the system asks. A fabricated timestamp in a document an insurer may read is
worse than a gap.

**AI classifies events, never people.** `personsInvolved` has no path from
detection — a name reaches the record only because a human typed it. This is the
one rule enforced in the data model, not just the UI.

**Three layers retained.** The manager's raw words, the system's reading of
them, and every correction are stored separately and all kept.

**Severity is derived, not chosen.** If the manager sets it, everything is minor
at 3am.

---

## Layout

```
docs/
  PRD.md                 the argument, the research, the competitive read
  INCIDENT-TYPES.md      taxonomy and the statutory field set

api/analyse.js           server-side model call (also a Vercel function)

src/
  screens/               Dashboard · Conversation · Submit
  components/            Thread · Composer · RecordCard · Shell · Checklist
    ui/                  shadcn primitives, unmodified
  lib/                   conversation (the ask loop) · detector · sections
  state/                 the report object and its state machine
  data/                  fixtures — the sample nights
  hooks/                 useDictation — real speech-to-text
  index.css              design tokens
```

[READING-THE-CODE.md](READING-THE-CODE.md) is a map for changing the visual
design without touching logic.

---

## Stack

Vite · React 19 · Tailwind v4 · shadcn/ui (Radix) · Anthropic SDK

No router and no client-side backend — screens switch on state in `src/App.jsx`.
The only server code is the single API handler.

| Script | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run format` | Prettier with Tailwind class sorting |
| `npm run ui:add -- <name>` | add a shadcn component |

---

## Notes on the prototype

- Detection without an API key is keyword-driven with confidence gating, so free
  typing behaves plausibly rather than replaying a canned script.
- `public/img/note.jpeg` is a stand-in image. Nothing here performs OCR — the
  read-back is written fixture content, and the code says so at the fixture.
- The CCTV preservation request is a designed artefact. The product flags the
  camera and window; it does not reach into a DVR.
