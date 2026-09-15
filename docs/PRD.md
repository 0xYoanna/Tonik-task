# The 3AM Report — PRD

**A shift report that a closing manager finishes before they've finished cashing up — and that still holds up two years later when a lawyer asks what happened.**

| | |
|---|---|
| **Prepared for** | tonik / Kris (PO) |
| **Date** | 11 Sep 2026 |
| **Status** | Draft for review |
| **Scope** | Incident path |
| **Version** | v0.1 |

---

## 1. The bet, in one paragraph

Venues are already legally required to keep an incident log. Almost all of them keep a bad one, because the person with the facts is the person least able to write them down at the moment the law wants them written. Every existing tool solves the wrong half: ops platforms make the shift log *convenient*, security platforms make the incident record *rigorous*, and nothing makes the rigorous thing convenient enough to survive 3am.

> We are not building a faster form. We are building the thing that converts a tired manager's five-sentence brain-dump into a record that satisfies a statutory register — and that tells them, in the moment, which single missing detail would make it hold.

---

## 2. How this is actually solved today

End-of-night at a licensed venue is not one task. It is a cash-up, a clean-down, a lock-up, and — somewhere in the gaps — a written account of anything that went wrong. The first three have well-drilled checklists. The fourth is where the process collapses.

### The current stack, in the order managers touch it

| Where it lives | What goes in it | Why it fails the incident |
|---|---|---|
| **Paper closing checklist** | Fridges, floors, tills, alarm, bins, glassware, FIFO rotation | Binary tick-boxes. No room for narrative, no field for an ejection at 01:40. |
| **Manager's log book**<br>*(paper, or 7shifts / ShiftNote / Jolt)* | Shift notes, staffing, weather, sales vs. labour, tasks for the next manager | Built for **handover**, not evidence. 7shifts' own product page describes notes, tasks and POS sync — and mentions neither incident reporting nor photo attachment. |
| **The group chat** | The actual detail — "police came for the guy in the smoking area", photos of the damage | The richest record in the building, and the least admissible. Unstructured, unsearchable, on personal phones, deleted by attrition. |
| **Door team's incident pad** | Refusals, ejections, injuries, ID seizures | Written by door staff in their own book, often never reconciled with the manager's account of the same event. |
| **The statutory incident register** | What the licence actually requires | Frequently back-filled days later from memory, or when someone asks for it. |
| **CCTV** | The best evidence the venue will ever have | Nobody exports it on the night. It ages out. **See §3 — the most important finding here.** |

> [!WARNING]
> **Confidence note.** This picture is reconstructed from closing-checklist templates, log-book product documentation, and door-supervisor training material — **not from interviews**. Before build, we should watch three closing managers actually close. The single highest-value thing we could learn is *where in the 45-minute close-down the report currently gets written*, because that determines whether we're designing for a laptop in an office or a phone on a bar.

---

## 3. The finding that should change the product

CCTV is the evidence that wins disputes. It is also perishable, and it perishes faster than anyone assumes.

UK police guidance and ICO practice settle around **31 days** of retention as appropriate for general security purposes — but that is guidance, not a statutory floor. In practice most DVR and NVR systems are configured to **overwrite when the disk fills, not on a schedule**. A busy venue with a lot of cameras may hold far less than 31 days and have no idea. The standard advice when an incident occurs is to move the relevant footage to separate storage immediately.

Meanwhile, in the dram shop and personal-injury world, the evidence that actually decides cases is POS receipts, surveillance footage, server testimony, and training records — and plaintiff firms are explicitly coached that footage is often overwritten within days, so move fast.

> So the shift report is not only a record. It is the **trigger that preserves everything else**. The moment an incident is logged with a time and a location, the product should be generating a footage-preservation action with the exact camera and time window attached.

This reframes the value proposition away from "nicer paperwork". A venue that files a clean report but loses the footage has still lost the case. Nobody in the competitive set treats the report as an evidence-preservation trigger. **This is the feature I would put in front of a venue owner first** — it's the one that pays for the subscription.

---

## 4. Why now

Three regulatory currents are converging on exactly this workflow, which is presumably why the client is building it.

**The incident log is already a licence condition.** Maintaining an incident log is a standard premises-licence condition under the Licensing Act 2003; failing to comply with a licence condition is an offence under s.136. The obligation exists today and is widely met badly.

**The statutory field set is already specified.** Western Australia's incident register regulations are the most legible example of what "complete" means, and a good proxy for the shape of the requirement generally — nine recordable categories, a defined field set, and a **four-year retention period**, with a penalty for failing to maintain or produce the register. Crucially: *the regulations do not specify how soon after the event the entry must be made.* That silence is the entire product opportunity. Nothing stops a venue back-filling a register from memory a week later, and nothing but the product's own design will stop them.

**Martyn's Law lands in April 2027.** The Terrorism (Protection of Premises) Act 2025 received Royal Assent in April 2025, with enforcement expected from April 2027. Premises at 200+ capacity fall into a standard tier; 800+ triggers enhanced duties including written risk assessments, documented procedures, and a named Designated Senior Individual accountable for compliance. The SIA is the regulator.

For a nightlife venue that means a named person will shortly be *personally* accountable for documentation quality across evacuation, invacuation, lockdown and communication. Every venue in this bracket is about to go shopping for an audit trail. We should be on that shelf.

---

## 5. Competitive landscape

Four categories circle this problem. Each owns one half of it, and the halves have never been joined.

| Category | Examples | What they own | Where they leave the gap | Threat |
|---|---|---|---|---|
| **Restaurant ops / log books** | 7shifts, ShiftNote, Jolt, HotSchedules | Daily handover, tasks, POS-synced sales and labour. Real distribution in hospitality. | No incident primitive, no evidence attachment, no compliance framing. A shift note is not a register entry. | Medium |
| **Guard & security ops** | TrackTik, Silvertrac, GuardTek *(all now Trackforce)*, CSA360 | Rigorous incident records with time-stamped photo, video, audio and GPS — explicitly sold as litigation-grade. | Sold to contract guarding firms, not venues. Guard-shaped, not manager-shaped: patrols, checkpoints, tours. Heavy implementation. | **High** |
| **Venue & event ops** | 24/7 Software, VenueSumo, Momentus, CIP Reporting | Large-venue incident management: dispatch, live incident maps, routing to the right responder. | Built for stadiums and arenas with a control room. Wrong scale and price for a 400-cap club with one closing manager. | Medium |
| **Generic EHS / audit** | SafetyCulture (iAuditor), Safesite, Incident Tracker | Template engines, huge form libraries, cheap, enormous reach. | Template-shaped. Everything is a form to fill out — precisely the failure mode at 3am. | Medium |
| **Door / ID systems** | Patronscan, IDScan.net | Entry-point capture and cross-venue flagging of problem patrons. | Captures the door, not the night. Carries serious reputational risk — see §6. | Low / partner |

### The positioning gap

Plot the field on two axes — *rigour of the record* against *fit to a tired venue manager* — and the top-right quadrant is empty. Guard platforms are rigorous and badly fitted. Log books fit beautifully and record nothing that matters. Nobody has taken the security platform's evidentiary standard and delivered it through an interface a shattered human will actually complete at the end of a ten-hour shift.

**Our wedge is that AI collapses the trade-off those categories were built around. Rigour used to cost the user typing. It doesn't have to any more.**

### Platform: what the category has already learned

Checked across four incumbents. The caveat first: this is platform *availability* and vendor positioning, not measured usage — nobody publishes a mobile-vs-web split on entries created.

| Product | Mobile | Web | Split by |
|---|---|---|---|
| SafetyCulture / iAuditor | Explicitly mobile-first; works offline, syncs later | Analytics dashboards | Capture vs. analysis |
| TrackTik | Guard app — "the most important piece of equipment an officer can carry" | Supervisor dashboard, live map | **Role** — guard vs. supervisor |
| 24/7 Software | Communicator app, "report an issue in seconds" | Command centre, one screen, live venue map | **Role** — field staff vs. control room |
| 7shifts Manager Log Book | Yes — clipboard icon, bottom nav | Yes — left nav | **Neither. Same person, both surfaces.** |

**Three of the four split by role.** Field worker captures on mobile; supervisor reviews on web. Two people, two devices, two apps.

**Our user is both of those people.** The closing manager witnesses the ejection, writes it up, and signs it. Nobody in the competitive set has that user — so their architecture doesn't transfer. The seam isn't guard-vs-supervisor. It's the same person at 01:40 and at 03:40.

**7shifts is the closest analogue and the strongest evidence.** Same user, same feature, shipped on both surfaces rather than picking one. When the person capturing and the person reviewing are one, you don't choose a device — you choose per moment.

### The platform decision

| Moment | Surface | Why |
|---|---|---|
| **01:40, incident happens** | Mobile — capture only | Photo, one voice note, auto-timestamp, auto-location. Fifteen seconds. No fields, no review. Drops a `RawCapture` into tonight's report. |
| **03:40, writing the report** | Desktop web | Review, correct, triage, sign. Needs width for three zones, a keyboard for the dump, a sit-down for the signature. |

The phone is a **feeder**; the laptop is where judgement happens. These are not one responsive layout — trying to serve both produces a report too cramped to review and a capture flow too heavy to use on the floor.

**This is also the only way the brief's own success metric is reachable.** "Incident documentation captured close to the event, with evidence attached" cannot be hit by a laptop-only product, by construction — the manager is not at the laptop at 01:40. And note what the real incumbent is: the group chat, which lives on a phone. A desktop-only product replaces the spreadsheet, not the behaviour.

Worth treating as a vendor claim, but still striking: 24/7 Software reports the Buffalo Bills reached **100% incident reporting** after adopting mobile, and the Broncos replaced pagers with 250 mobile handsets. If mobile capture is what moves completion rate, the phone feeder is load-bearing for the >90% nights-filed target in §12, not a nice-to-have.

**For this task: desktop only.** The graded path is incident review, which is the desktop moment, and a second surface at hour six is exactly the move that reads as not knowing when to stop. The mobile feeder is named on the flow sketch as not built, and is the honest answer to "what would you do with eight more hours".

---

## 6. Two analogues worth stealing from — and fearing

### Axon Draft One — the closest thing to what we're building

Draft One drafts police reports from body-camera audio. It is the nearest existing product to "AI turns a frontline account into a legal document", it's deployed widely, and its public reception is the single most useful risk document available to us.

The upside is real: Fort Collins reported roughly a **67% reduction in report-writing time**, 45 minutes down to 10. That's our target ratio, in a domain with stricter standards than ours.

The criticism is where the design lives. The EFF's central objection was not that the AI wrote badly — it was that **when an officer edited and exported a report, the original AI draft was destroyed**, erasing any record of which words were the machine's and which the human's. In a courtroom that's fatal in both directions: it lets a witness disown inconvenient sentences, and it denies the defence any way to test the record. Axon shipped retention of the original unedited narrative in December 2025 — *after* the criticism.

> **What this dictates for us.** Provenance is not a nice-to-have we add in v2. The manager's raw words, the AI's proposed structuring, and the manager's corrections are three separate layers and **all three are retained, permanently and visibly**. It is simultaneously the correction mechanism, the trust mechanism, and the evidentiary mechanism. Building it later means rebuilding the data model later.

### Patronscan — the cautionary tale about classifying people

Patronscan flags problem patrons and shares those flags across a venue network. In a widely reported case, a lawyer who fell ill in a Winnipeg bar was flagged to a nationwide "public safety concern" network, then refused entry at a venue in another province without knowing why. The bar later accepted it was a mistake — it should have been an internal flag — and removed it.

> **The line we draw: AI may classify an *event*. AI may never classify a *person*.**

Our model can propose "this reads like an ejection". It must never propose "this person is aggressive", never auto-attach a name to a severity, and never pre-tick anything that follows a human out of the building. Naming an individual is a deliberate act by the manager, with a visible consequence attached. This is an ethical position and also a commercial one — it is exactly the failure mode that generates the article that kills the deal.

---

## 7. User and job

**Primary — the closing manager.** Ten hours in, 03:00, finishing at a laptop in a back office with the lights up and staff waiting to be let go. Experienced and competent; not motivated. Will do the minimum that closes the loop. Has already told three people what happened tonight, verbally, and resents typing it a fourth time.

**Consumer — the owner / operator.** Reads reports the next afternoon. Cares about patterns across nights and venues, and about having the right document when an insurer, a licensing officer or a solicitor asks. Not our user for this task, but the reason the product gets bought.

### The job, stated honestly

> *"When my shift ends and I just want to go home, help me discharge my responsibility for tonight in one pass, so that I'm not the reason we're exposed if something comes back on us."*

Note what that job is **not**. It is not "document the night thoroughly." Thoroughness is the owner's goal, and the insurer's. Designing as if it were the manager's goal is how every tool in §5 ended up with a completion-rate problem. Our job is to make the manager's actual goal — *discharge and leave* — produce the owner's outcome as a by-product.

---

## 8. Design principles

Seven positions. Each is falsifiable, and each resolves a specific tension in the brief.

1. **Structure is the output, never the input.** One box, typed or dictated. The manager narrates; the system structures. Nobody chooses "guided or freeform" at the start of the flow, because at 3am that choice is itself work.
2. **Guided mode is what the AI asks back.** The managers who want scaffolding get it as follow-up questions against the gaps in what they said — not as an empty form they have to face down. Same flow, different felt experience, no mode switch.
3. **AI proposes; it never commits.** Detection runs in a parallel lane and lands as reviewable cards. Never modal, never blocking the cursor, never silently written into the record. Two verbs only: confirm, correct.
4. **A blank beats a confident guess.** Below the confidence threshold the field stays empty and asks. Fabricating a timestamp in a document that may be read by an insurer is worse than leaving it out, and one hallucinated detail discovered at deposition discredits every other report the venue has ever filed.
5. **Three layers, all retained.** Raw account, AI structuring, human correction. Every structured field traces to the sentence it came from. Learned directly from Draft One's mistake.
6. **Log the incident, preserve the evidence.** Every confirmed incident emits a footage-preservation action with camera and time window. The report's job is to stop the evidence ageing out, not merely to describe it.
7. **Completeness is measured against the incident, not the report.** No progress bar across thirteen optional sections — that's just guilt with a UI. The only completeness that matters is whether each incident carries what someone will ask for later.

---

## 9. The incident record

The brief sets the minimum at time, location, type and description. The statutory registers ask for more, and since we're claiming legal defensibility we should meet the higher bar — while only ever *demanding* the first four from the manager.

| Field | Source | Who supplies it | Required |
|---|---|---|---|
| Venue name & address | Statutory register | System — known | Auto |
| Date, time, location on premises | Statutory + brief | AI proposes from narrative, manager confirms | **Yes** |
| Incident type | Brief + register categories | AI proposes, manager corrects | **Yes** |
| Description | Brief | Manager's own words, preserved verbatim | **Yes** |
| Manager on duty | Statutory register | System — session identity | Auto |
| Staff / door supervisors present | Statutory register | System proposes from rota; manager confirms who was actually there | Prompted |
| Action taken, incl. notifications | Statutory register | AI extracts if narrated, else asks | Prompted |
| Persons involved | Statutory register | **Manager only.** Never AI-proposed — see §6 | Manual |
| Evidence attachments | Brief | Manager drags in; system generates the CCTV preservation request | Prompted |
| Provenance & amendment trail | Our addition | System — automatic, immutable | Auto |

### Type taxonomy

Rather than invent categories, we inherit the ones a regulator already recognises — refusal of entry, repeat entry attempts after refusal, removal from premises, ID failure or suspected forgery, indecent behaviour, intoxication, injury, complaints — plus venue additions for drugs, theft, damage and staff injury. Inheriting the regulator's taxonomy means our export *is* the register, rather than something a venue has to transcribe into one.

---

## 10. How the flow bends

One path, three pressures. The spine is identical — open, dump, review, submit. What changes is what the system does with **silence** and with **volume**.

| | Quiet night — 0 incidents | Typical night — 1–3 | Chaotic night — 20+ |
|---|---|---|---|
| **1** | Dump, or say nothing at all | Dump — typed or dictated | Dump, probably in fragments |
| **2** | Nothing detected — system says so plainly | Cards surface as the AI reads along | AI clusters, de-duplicates, ranks by severity |
| **3** | Manager makes an explicit **positive attestation**: no incidents occurred | Confirm each; fill the gaps it asks about | Batch-confirm the minor; forced review on injury, police, ejection, refusal |
| **4** | Sign, submit | Attach what exists, sign, submit | File the serious ones now, amend the rest tomorrow |
| **Target** | Under 60 seconds | Under 10 minutes | Serious incidents filed in under 10 min |

### The quiet night is a feature, not a fall-through

An empty report proves nothing. A report in which a named manager affirmatively recorded that nothing happened *is* evidence — it establishes that the venue was running its process on that date. Most tools treat zero incidents as the case where the user simply doesn't show up. It is in fact the most common case, and the cheapest place to build the daily habit that makes the product work on the night it matters.

### Amendments, not a permanently open draft

Nobody writes twenty careful entries at 3am, and pretending otherwise produces twenty bad ones. Real incident registers amend; we should too. An amendment is timestamped and attributed, which is stronger than a report silently completed over three days — and much stronger than the entries that never get written at all.

> [!WARNING]
> **Open question for Kris.** Does any jurisdiction the client sells into impose a *deadline* for incident register entries? WA's regulations conspicuously don't. If a target market does, the amendment model needs a hard cut-off and the UI needs to show the clock. This changes the design, and I'd want the answer before build rather than after.

---

## 11. Out of scope

- **The other twelve sections.** Visible in the shell, stubbed. The incident path is the only road built.
- **Real file handling.** Chips, fake upload states, stubbed thumbnails.
- **Cross-venue patron flagging.** Deliberately not built, and per §6 I'd argue against ever building it in the form Patronscan did.
- **Live CCTV integration.** The preservation *request* is in scope as a designed artefact; the DVR integration behind it is not.
- **Owner-side analytics.** Different user, different product surface.
- **A visual identity.** One typeface, one accent, defaults everywhere except the polished screen.

---

## 12. Success metrics

| Measure | Target | Why this one |
|---|---|---|
| Time to submit, typical night | < 10 min | The brief's bar, and roughly Draft One's demonstrated ratio. |
| Time to submit, quiet night | < 60 sec | Habit is built on the boring nights. |
| Nights with a filed report | > 90% | The metric the incumbents quietly fail. A register with gaps is a register that doesn't defend you. |
| Incidents with all four required fields | 100% | Non-negotiable; it's the definition of a valid entry. |
| Incidents with evidence attached or preserved | > 60% | The differentiator from §3. |
| **AI proposals corrected by the manager** | **Track, don't minimise** | A correction rate near zero means managers have stopped reading. Rubber-stamping is the failure mode, not a win. |
| Median lag, event → entry | Same shift | Contemporaneous records carry more evidential weight than reconstructed ones. |

The sixth is the one I'd defend hardest in a metrics review. Every AI product in a compliance context drifts toward the user clicking confirm without reading, at which point the product has quietly become a liability generator with a good completion rate.

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Rubber-stamping | Force review on high-severity types. Never pre-confirm. Track correction rate as a health metric. |
| Hallucinated detail in a legal document | Confidence gating; blanks over guesses; verbatim source retained beside every extracted field. |
| "The AI wrote that" defence | Three retained layers plus a signed attestation at submit. The manager signs the record, not the draft. |
| Naming people wrongly | AI never proposes a person. Manual entry only, with the consequence stated at the point of entry. |
| Trackforce moves down-market | They're guard-shaped and enterprise-priced. Our defensibility is workflow fit at 3am, not features. |
| Dictation fails in a loud venue | Design for the back office after close, not the floor mid-shift. Typing is the primary path; voice is the accelerant. |

---

## 14. What gets built for this task

Scope held deliberately tight, per the brief's eight-hour cap.

- **Shell** — all thirteen sections visible, twelve visibly stubbed, incidents live.
- **Capture** — single freeform box with a dictation affordance, real state, sample dump for reviewers who won't type a paragraph.
- **Detection** — keyword-driven with believable latency and confidence gating, so free typing produces plausible behaviour rather than a canned demo.
- **Review & correct** — *the polished screen.* Full state ladder: detecting, proposed, needs-attention, correcting, confirmed, evidence attached. Inline correction, provenance on hover, split and merge, dismiss as not-an-incident.
- **Submit** — attestation and sign-off, producing a real record object.
- **Branches** — quiet night and chaotic night both reachable, because the flow's bend is the interesting part.

> The polished screen is **the review card**: the instant the AI hands back what it thinks happened and a tired human decides whether to trust it. That is the whole product, compressed into one component.

---

## 15. Questions for the product owner

1. **Which jurisdictions?** It drives the type taxonomy, the retention period, and whether there's a filing deadline. I've assumed UK-primary with the WA register as a structural model.
2. **Does the venue's CCTV system have an API, in any of the target accounts?** If even one does, the preservation trigger stops being a task and becomes an automated export — and that's the strongest feature in the product.
3. **Who signs?** If Martyn's Law's Designated Senior Individual is the accountable party, does the closing manager's submission need counter-signature? That's a second approval state and it materially changes the flow.
4. **Does the door team file separately today?** If so, reconciling two accounts of one ejection is a real design problem and probably a v2 headline feature.
5. **Is the manager's raw dump discoverable?** We're arguing to retain it permanently for defensibility. A defence solicitor might argue the opposite. Worth a legal opinion before we commit the data model.


---

## Sources

Desk research, 11 Sep 2026. **No practitioner interviews** — see the confidence note in §2. Regulatory summaries are secondary sources and should be verified against primary legislation before anything ships to a client.

**Regulatory**
- [Incident register at licensed premises — Government of Western Australia](https://www.wa.gov.au/government/publications/incident-register-licensed-premises) — statutory field set, nine categories, four-year retention, penalty, no mandated entry timeframe
- [Guidance issued under s.182 of the Licensing Act 2003 — Home Office](https://assets.publishing.service.gov.uk/media/5a79561de5274a2acd18bf75/guidance-section-182-licensing.pdf)
- [Legal responsibilities of door supervisors in the UK — CR Protection](https://www.crprotection.co.uk/blog/the-legal-responsibilities-of-door-supervisors-in-the-uk) — incident log as licence condition; s.136 offence
- [Martyn's Law / Protect Duty 2026 guide — Security Journal UK](https://securityjournaluk.com/protect-duty-2026-security-guide/) and [Home Office statutory guidance summary — Controlled Events](https://controlledevents.com/martyns-law-terrorism-guidance/)

**Evidence & liability**
- [CCTV retention period — Active Communications](https://www.activecomms.co.uk/blog/cctv-footage-retention-period-uk-law) and [CCTV regulations — NDML](https://www.ndml.co.uk/articles/cctv-what-are-the-regulations/) — 31-day guidance, overwrite-on-capacity behaviour, separate-storage advice
- [How to prove a dram shop case — Siddons Law Firm](https://siddonslaw.com/how-to-prove-dram-shop-case-evidence/) and [Dram shop legislation and insurers — Sarno Law](https://sarnolawfirm.com/blogs/dram-shop-legislation-how-alcohol-liability-laws-affect-businesses-victims-and-insurers/)

**Analogues**
- [Axon's Draft One is designed to defy transparency — EFF](https://www.eff.org/deeplinks/2025/07/axons-draft-one-designed-defy-transparency), [AI police reports: year in review — EFF](https://www.eff.org/deeplinks/2025/12/ai-police-reports-year-review), [CNN Business on AI police reports](https://www.cnn.com/2025/08/12/tech/ai-police-reports-axon)
- [Woman flagged by ID scanner as nationwide 'public safety concern' — CBC News](https://www.cbc.ca/news/canada/manitoba/patronscan-id-winnipeg-riverside-bar-9.7312942) and [ID scanners and how bars treat you — The Markup](https://themarkup.org/2024/07/27/id-scanners-can-change-how-your-local-bar-treats-you-and-whether-it-lets-you-in)

**Competitors & current practice**
- [7shifts Manager Log Book](https://www.7shifts.com/manager-log-book/), [ShiftNote](https://www.shiftforce.com/shiftnote-restaurant-manager-log-book)
- Platform research: [SafetyCulture iAuditor](https://mitti.com/iauditor), [TrackTik guard management](https://www.trackforce.com/products/tracktik/guard-management/), [7shifts Log Book docs](https://kb.7shifts.com/hc/en-us/articles/4417520176531-7shifts-101-Log-Book), [24/7 Software mobile incident reporting](https://www.247software.com/platform/mobile-incident-reporting-software), [24/7 Software safety \& security](https://www.247software.com/use-cases/safety-security)
- [TrackTik security incident reporting](https://www.trackforce.com/products/tracktik/security-incident-reporting/), [Trackforce 2026 buyer's guide](https://www.trackforce.com/resources/blog-articles/security-guard-management-software-compared-2026-buyers-guide/), [24/7 Software](https://www.247software.com/blog/streamlining-large-venue-safety-incident-management-best-practices-through-operations-software), [VenueSumo](https://venuesumo.com/features/incidentreporting/)
- [Bar closing checklists — SafetyCulture](https://safetyculture.com/library/hospitality/closing-down-bar-tasks), [Bar opening & closing checklist — WebstaurantStore](https://www.webstaurantstore.com/article/131/bar-closing-checklist.html)
