# Incident types

What managers need to report, and which three the prototype centres on.

Derived from the statutory categories found in research (see [PRD.md](PRD.md) §4, §9) plus the operational reality of a licensed venue.

---

## 1. Type is not the only axis

Three things get conflated in most incident forms, and separating them is the single most useful structural move here.

| Axis | Examples | Who supplies it |
|---|---|---|
| **Type** — what happened | Ejection, injury, refusal of entry | AI proposes, manager corrects |
| **Action / outcome** — what was done | Police attended, ambulance called, person banned, first aid given, CCTV reviewed | AI extracts if narrated, else asks |
| **Severity** — how much it matters | Minor / significant / serious | Derived from type + outcome, never free-entry |

"Police attended" is not an incident type. It's a fact about an incident, and the statutory register asks for it in a separate field — *"actions taken in response, including notifications to authorities."* Statute already agrees with this split.

**Severity is derived, not chosen.** If the manager sets severity, every incident becomes minor at 3am. If type + outcome sets it, the severity gate can't be talked around.

---

## 2. The full taxonomy

Grouped by how much legal weight the type carries, because that's what drives the product's behaviour.

### Tier 1 — Legally loaded

Cannot be batch-confirmed. Card must be opened. Expanded field set.

| Type | Source | Extra fields it demands |
|---|---|---|
| **Injury to any person** | Statutory (WA #7), UK door staff | Nature of injury, first aid given, ambulance, witnesses, staff injury → RIDDOR check |
| **Assault / violence** | UK: crimes reported to venue | Persons involved, police reference, weapon present |
| **Drug find or use** | Venue / police liaison | What, where, seized or disposed, police informed |
| **Weapon found** | Venue / police liaison | What, how discovered, police reference |
| **Sexual misconduct, harassment or spiking allegation** | Increasingly a licence condition in UK | Handled separately — see §4 |
| **Safeguarding concern** | Vulnerable person, welfare | Age, condition, who took responsibility, how they left |
| **Fire, evacuation or lockdown** | Martyn's Law from Apr 2027 | Trigger, duration, headcount, all-clear |

### Tier 2 — Routine but statutory

High volume, low individual weight. Batch-confirmable. This is most of a busy night.

| Type | Source |
|---|---|
| **Refusal of entry** — intoxication or behaviour | Statutory (WA #1) |
| **Removal from premises / ejection** | Statutory (WA #3), UK door staff |
| **ID failure or suspected forged ID** | Statutory (WA #4) |
| **Refusal of service** — already intoxicated | Statutory (WA #6); dram shop safe-harbour relevance |
| **Repeat entry attempt after refusal** | Statutory (WA #2) |
| **Indecent behaviour** | Statutory (WA #5) |
| **Underage person found inside** | Licensing — serious for the licence, routine to record |

### Tier 3 — Operational, with insurance relevance

| Type | Why it's recorded |
|---|---|
| **Theft** — patron property, venue property, till | Insurance claim, pattern detection |
| **Criminal damage** | Insurance, deposit disputes |
| **Medical, non-injury** — collapse, overdose, seizure | Duty of care; may escalate to Tier 1 |
| **Noise complaint** | Statutory (WA #8); licence review evidence |
| **Capacity or queue incident** | Licence condition, crowd safety |
| **Equipment failure with a safety implication** | Liability if it recurs and someone is hurt |
| **Counterfeit currency** | Police reporting |

### Not incidents

Worth naming explicitly so the taxonomy has an edge: lost property, a staff no-show, a delivery shortfall, a broken glass with nobody hurt. These belong in other sections. **If everything is an incident, the register becomes noise and stops defending the venue** — which is the failure mode of a system that makes reporting too easy in the wrong direction.

---

## 3. Type drives required fields

This is the answer to "how do you get legal rigour without making them fill a big form."

```
Every incident:        time · location · type · description
                       + staff present, action taken (prompted)

Tier 2 adds:           nothing. Four fields and done.

Tier 1 adds:           type-specific fields, revealed only for that type
                       e.g. Injury → nature, first aid, ambulance, witnesses
```

**The form grows only where the law needs it to.** Nine refusals stay nine four-field records. The one injury opens up and asks six more questions — and the manager accepts that, because it's obviously the one that matters.

A flat form that asked injury-grade questions about every refusal is precisely why the incumbents have a completion problem.

---

## 4. Sexual misconduct and spiking — a special case

This category is increasingly the subject of UK licence conditions and venue policy, and it is genuinely different from the rest.

Design implications, all deliberate:

- **AI must never classify it.** A narrative mentioning a distressed person and a drink does not become an allegation because a keyword matched. This type is manual-select only. It is the strongest instance of the §6 rule from the PRD — AI classifies events, never people.
- **The complainant is not named in the general report.** Their details go to a restricted field visible only to the Designated Premises Supervisor, not to every manager who opens the night's report.
- **It routes differently.** A safeguarding referral and a police liaison are not the same workflow as "attach to report and file".
- **Recording it must never feel like processing it.** The tone of this card matters more than any other screen in the product.

**I'd scope this out of the prototype deliberately and say so.** Not because it's unimportant — because it's the one type where getting the interaction wrong does real harm to a real person, and it deserves more than an afternoon. That's a defensible scoping decision and a better answer than a half-built version.

---

## 5. What the prototype uses

Three types, each doing a different demo job. Not more.

| Type | Tier | What it demonstrates |
|---|---|---|
| **Ejection** | 2 | **The hero card.** The polished screen's default state: full four fields, staff present, persons-involved as a manual-only field, CCTV window, provenance. Narratively rich in a dump and instantly legible to anyone reviewing. |
| **Refusal of entry** × 9 | 2 | **Volume.** Clustering, dedupe, batch-confirm in triage. Individually boring, which is the point — it shows the product not wasting the manager's attention. |
| **Injury** | 1 | **Escalation.** The severity gate refusing a batch path, the field set expanding, the preservation request mattering. One instance only. |

Every other type appears in the **type picker**, so correcting a misclassification shows the real taxonomy — but only these three have detector keywords and fixtures.

### Why ejection is the hero and not injury

Injury has higher stakes and would show more machinery. But it makes the demo a story about someone getting hurt, and a reviewer watching a fifteen-minute Loom shouldn't spend it on that. Ejection is the most common consequential incident at a club, it's statutory in every jurisdiction checked, it naturally carries all four required fields, it involves other people — so it tests the no-AI-naming rule — and it usually has footage, so it tests the preservation trigger.

It's also the one where a manager's account and the door team's account most often diverge, which is the open question worth raising in the Loom.

---

## 5b. The question set, and what it's missing

What the end-of-shift completion asks, in order. `†` marks a field the
statutory register names explicitly (PRD §9); `‡` is conditional.

| # | Question | Why it's there |
|---|---|---|
| 1 | *(the narrative)* † | Their own words, kept verbatim |
| 2 | What time? † | Statutory; also picks the CCTV window |
| 3 | Whereabouts? † | Statutory; **names the camera** |
| 4 | What kind of incident? † | The register is indexed by category |
| 5 | Who was involved? † | **Manual only** — never AI-proposed (PRD §6) |
| 6 | Who dealt with it? † | Staff / door supervisors present |
| 7 | Was anyone injured? | Gates the Tier 1 field set |
| 8 | Describe the injury ‡ | Nature, first aid, ambulance |
| 9 | Was it staff? ‡ | **RIDDOR** is a separate legal duty with its own deadline |
| 10 | What was done? † | "Action taken, including notifications" |
| 11 | Police reference ‡ | The cross-reference that makes the entry provable |
| 12 | Any witnesses? | Corroboration; Tier 1 demands it for injury |
| 13 | Flag the footage? | Fires automatically on a mid-shift log |

### Still not asked, and arguably should be

- **Evidence beyond CCTV.** Till receipts especially — dram-shop and
  over-service claims turn on POS data plus footage plus server testimony
  (PRD §3). A till reference would be cheap to capture and hard to reconstruct.
- **How it ended.** "Ejected" is an action; whether they left quietly, were
  banned, or were arrested is an outcome, and it's what a licensing officer
  reads first.
- **Whether anyone refused to give details.** A defensible record of an
  *incomplete* record.

### Deliberately automatic, never asked

Venue, licence, duty manager, and — importantly — the **entry timestamp as
distinct from the event timestamp**. Contemporaneity is what gives a record
evidential weight, so the gap between the two is measured (PRD §12) rather
than left to be asserted later.

### Open for Kris

Witness **contact details** are the obvious next field and the one I would not
add without a legal opinion. Holding a customer's phone number against an
incident record for four years is a data-protection question, not a design one.

---

## 6. Detector keywords

What the fake AI matches on. Deliberately visible so the mechanism is honest.

| Type | Matches | Confidence |
|---|---|---|
| Ejection | ejected, removed, kicked out, thrown out, escorted out, chucked | High |
| Refusal of entry | refused, turned away, wouldn't let, denied entry, knocked back | High |
| ID failure | fake ID, false ID, borrowed ID, underage, seized the ID | High |
| Injury | injured, hurt, cut, bleeding, ambulance, paramedic, first aid, glassed | High |
| Drugs | drugs, pills, baggie, dealing, searched and found | Medium |
| Theft | stolen, theft, went missing, nicked, lifted | Medium |
| Damage | smashed, broken, damaged, kicked in | Medium |
| Police | police, cops, officers attended, 999, 112 | **Outcome, not type** |
| Time | 01:40, half one, around 2, just before close | Extracted to `occurredAt` |
| Location | smoking area, front door, dancefloor, bar 2, toilets, queue, beer garden | Extracted to `location` |

**Locations come from the venue's own floorplan**, not a free-text guess. A venue that has told us it has "Bar 2" and a "beer garden" gives the detector a closed vocabulary to match against — which is both more accurate than open extraction and a reason the product improves with setup.

Anything matching a type keyword but **missing a time or location leaves that field empty and asks.** That's the confidence gate, and card 2 in the [wireframes](WIREFRAMES.md) exists to show it.
