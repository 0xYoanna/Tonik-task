/* ─────────────────────────────────────────────────────────────
   REPORT STATE — conversation-shaped

   The manager talks. This reads, decides the one question worth
   asking next, and writes the record out of the back of the
   answers. There is no form anywhere in here, by construction.

   Three layers still retained separately:
     raw       — every word the manager said.   Immutable.
     proposed  — what it read from those words. Frozen.
     record    — what the answers produced.     Amendable.
   ───────────────────────────────────────────────────────────── */

import { createContext, createElement, useContext, useMemo, useReducer } from "react";
import { detect, severityOf, preservationWindow, cameraFor, TYPES } from "../lib/detector.js";
import {
  nextQuestion, applyAnswer, isReady, saysDone, saysNothing, opening,
  reportOpening, looksSubstantive, unclassified, groupOf, saysAttaching, isOffTopic,
  CONFIRM_Q, CHANGE_Q, saidYes, saidNo, applyCorrection, saidLogAsIs, QUICK_KEYS,
} from "../lib/conversation.js";
import { evidence } from "../data/sampleShift.js";
import { shiftNow } from "../lib/clock.js";
import { SECTIONS, matchSections, knownFacts, suggestNext } from "../lib/sections.js";
import { venue } from "../data/sampleShift.js";

export const ReportContext = createContext(null);

let mid = 0;
const msg = (role, kind, text, extra = {}) => ({
  id: `m${++mid}`, role, kind, text, at: Date.now(), ...extra,
});

export const initialState = {
  thread: [],
  mode: "report", // quick = mid-shift, one exchange · report = end of shift
  covered: {},    // sectionKey -> { how: "said" | "known", note }
  showReport: true,
  raw: [],
  incidents: [],
  dropped: [],
  pending: null, // { incidentId | groupIds, question }
  phase: "dashboard", // dashboard → quick | report → summary → filed
  thinking: false,
  attested: false,
  filedAt: null,
  amendments: [],
};

/* Decide what it says next. Runs after every manager turn.
   One incident is carried to completion before the next begins —
   jumping between them is how a conversation stops making sense. */
function advance(state) {
  const quick = state.mode === "quick";
  const thread = [...state.thread];
  let incidents = [...state.incidents];
  let pending = null;

  /* Volume: nine refusals at the door are one question, not nine. */
  const group = quick ? null : groupOf(incidents.filter((i) => !i.logged));
  if (group && !state.groupAsked) {
    const q = {
      key: "group",
      field: "group",
      q: `${group.times.length} ${group.label.toLowerCase()}s at the door — same story for all of them, too far gone to come in?`,
      options: ["Yes, all the same", "No, let me go through them"],
    };
    thread.push(msg("ai", "question", q.q, { question: q }));
    return { ...state, thread, incidents, pending: { groupIds: group.ids, question: q }, groupAsked: true };
  }

  for (const inc of incidents) {
    /* `logged` means it's in the register; `full` means every
       detail has been captured. Mid-shift we stop at logged — at
       close we keep going until it's full, which is how the
       deferred questions get picked back up. */
    if (quick ? inc.logged : inc.full) continue;
    const q = nextQuestion(inc, quick);
    if (q) {
      thread.push(msg("ai", "question", q.q, { question: q, incidentId: inc.id }));
      pending = { incidentId: inc.id, question: q };
      return { ...state, thread, incidents, pending };
    }

    /* Complete. The record appears in the thread, where the
       conversation is — not in a side panel. */
    const record = prepare(inc, quick);
    incidents = incidents.map((i) => (i.id === inc.id ? record : i));
    thread.push(msg("ai", "record", "", { incidentId: record.id }));

    /* Nothing reaches the register on the machine's say-so. It
       shows what it wrote and asks — two words to accept, two to
       change it. */
    if (!record.logged && !(record.asked ?? []).includes("confirm")) {
      thread.push(msg("ai", "question", CONFIRM_Q.q, { question: CONFIRM_Q, incidentId: record.id }));
      return {
        ...state,
        thread,
        incidents,
        pending: { incidentId: record.id, question: CONFIRM_Q },
      };
    }

    /* Already in the register from a mid-shift log — this pass
       only filled in the detail it was missing. */
    thread.push(msg("ai", "text", "Updated."));
    return { ...state, thread, incidents, pending: null };
  }

  if (quick) {
    thread.push(msg("ai", "text", incidents.length
      ? "Anything else, or back to it?"
      : "Nothing's jumped out yet. What happened?"));
    return { ...state, thread, incidents, pending: null };
  }

  /* Two suggestions at most, and only twice. Thirteen questions
     would produce thirteen padded answers, which is worse than
     honest blanks. */
  const nudge = suggestNext(state.covered ?? {});
  const nudges = state.nudges ?? 0;
  if (nudge.length && nudges < 2) {
    thread.push(msg("ai", "text",
      `Anything on ${nudge.map((s) => s.label.toLowerCase()).join(" or ")}? If not, say so and we'll sign it off.`));
    return { ...state, thread, incidents, pending: null, nudges: nudges + 1 };
  }

  /* The last thing asked, every time. Evidence is the part that
     can't be reconstructed later — and the part a manager only
     remembers they have once nothing else is being asked of them. */
  if (!state.extrasAsked) {
    thread.push(msg("ai", "text",
      "Anything else you want to add? Photos, notes, additional information?"));
    return { ...state, thread, incidents, pending: null, extrasAsked: true };
  }

  thread.push(msg("ai", "text", "That's the night. Ready to sign off?"));
  return { ...state, thread, incidents, pending: null };
}

function prepare(inc, quick = false) {
  const severity = severityOf(inc.type, inc.outcomes);
  /* The CCTV step the quick flow exists for: a time and a place
     is all it needs to name the camera and the window, so it does
     it rather than asking. */
  const preserve = quick ? true : inc.preserve;
  /* Flagged without being asked, so the end-of-shift pass must not
     ask again — answering it twice is exactly the double-entry the
     split exists to avoid. */
  const asked = quick
    ? [...new Set([...(inc.asked ?? []), "footage"])]
    : inc.asked;
  return {
    ...inc,
    asked,
    full: !quick || nextQuestion({ ...inc, asked, preserve }, false) === null,
    severity,
    preservation:
      preserve && inc.occurredAt
        ? {
            window: preservationWindow(inc.occurredAt),
            camera: cameraFor(inc.location) ?? "Unassigned camera",
            status: "outstanding",
          }
        : null,
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case "thinking":
      return { ...state, thinking: true };

    case "say": {
      const text = action.text.trim();
      if (!text) return state;

      const thread = [...state.thread, msg("manager", "text", text)];
      const raw = [...state.raw, { id: `raw_${state.raw.length + 1}`, text, at: new Date().toISOString() }];
      let incidents = [...state.incidents];
      let next = {
        ...state,
        thread,
        raw,
        thinking: false,
        /* Which reader answered last — surfaced in the header so
           "is the model actually running?" is answerable without
           a curl. */
        lastSource: action.analysis?.source ?? "keywords",
      };

      /* Answering the question it just asked. */
      if (state.pending) {
        const { incidentId, groupIds, question } = state.pending;
        if (groupIds) {
          const together = /\b(yes|yeah|yep|same|all)\b/i.test(text);
          incidents = incidents.map((i) =>
            groupIds.includes(i.id)
              ? together
                ? ({ ...prepare({ ...i, asked: ["group", "footage", "staff"], notes: [{ key: "group", question: question.q, answer: text }] }), logged: true, loggedAt: new Date().toISOString() })
                : { ...i, asked: [...(i.asked ?? [])] }
              : i,
          );
          if (together) {
            next.thread = [
              ...thread,
              msg("ai", "record-group", "", { ids: groupIds }),
            ];
          }
        } else if (saidLogAsIs(text)) {
          /* Escape hatch: stop probing, keep what we have. */
          incidents = incidents.map((i) =>
            i.id === incidentId
              ? { ...i, asked: [...new Set([...(i.asked ?? []), ...QUICK_KEYS])] }
              : i,
          );
          return advance({ ...next, incidents, pending: null });
        } else if (question.key === "confirm") {
          if (saidYes(text)) {
            incidents = incidents.map((i) =>
              i.id === incidentId
                ? { ...i, logged: true, loggedAt: new Date().toISOString(),
                    asked: [...(i.asked ?? []), "confirm"] }
                : i,
            );
            return advance({
              ...next,
              incidents,
              pending: null,
              thread: [...thread, msg("ai", "text",
                "Saved. It'll be in tonight's shift report.")],
            });
          }
          /* An explicit no — find out what's wrong before writing. */
          if (saidNo(text)) {
            return {
              ...next,
              incidents,
              pending: { incidentId, question: CHANGE_Q },
              thread: [...thread, msg("ai", "question", CHANGE_Q.q, { question: CHANGE_Q, incidentId })],
            };
          }

          /* Neither yes nor no: they're still telling us what
             happened. Fold it into the record and show it again —
             a person who keeps talking is adding detail, not
             rejecting the draft. */
          incidents = incidents.map((i) =>
            i.id === incidentId ? applyCorrection(i, text) : i,
          );
          return advance({
            ...next,
            incidents,
            pending: null,
            thread: [...thread, msg("ai", "text", "Added that.")],
          });
        } else if (question.key === "change") {
          incidents = incidents.map((i) =>
            i.id === incidentId ? applyCorrection(i, text) : i,
          );
          return advance({ ...next, incidents, pending: null });
        } else {
          incidents = incidents.map((i) =>
            i.id === incidentId ? applyAnswer(i, question, text) : i,
          );
          /* "Not an incident" — drop it outright. Whatever got it
             here (a missed off-topic guess, a manager thinking
             out loud) must not leave a trace in a register kept
             for four years. */
          const discarded = incidents.find((i) => i.discard);
          if (discarded) {
            return {
              ...next,
              incidents: incidents.filter((i) => !i.discard),
              pending: null,
              thread: [...thread, msg("ai", "text", "Dropped it — nothing recorded.")],
            };
          }
        }
        return advance({ ...next, incidents, pending: null });
      }

      /* Not report content. Decline in one line and write nothing
         — a question about the weather must never reach a register
         that's kept for four years. No lecture: the manager made a
         reasonable mistake about what this box is for. */
      /* The model decides when it answered; the regex only covers
         the no-key path. An OR between them let the word list
         veto a reading it had no basis to overrule — a question
         about the smoke machine is a maintenance note, and only
         one of these two can tell. */
      const offTopic =
        action.analysis?.source === "model"
          ? action.analysis.kind === "off_topic"
          : isOffTopic(text);

      if (offTopic) {
        return {
          ...next,
          incidents,
          thread: [...thread, msg("ai", "text",
            state.mode === "quick"
              ? "I only do tonight's incidents. What's happened?"
              : "I only do tonight's report. What else from the shift?")],
        };
      }

      /* Evidence being handed over, not more narrative. */
      if (saysAttaching(text)) {
        const target = incidents.filter((i) => i.logged).slice(-1)[0];
        return {
          ...next,
          incidents,
          thread: [
            ...thread,
            msg("manager", "attachment", "", { src: evidence.note.src, label: evidence.note.label }),
            msg("ai", "transcription", "", { incidentId: target?.id ?? null }),
            msg("ai", "text",
              target
                ? `Attached to the ${target.occurredAt} ${target.typeLabel.toLowerCase()}. Correct anything I've misread — the scan stays either way.`
                : "Filed with tonight's report. Correct anything I've misread — the scan stays either way."),
          ],
        };
      }

      /* Ticking happens as a side effect of talking. The manager
         never picks a section. */
      if (state.mode === "report") {
        const hit = action.analysis?.sections ?? matchSections(text);
        if (hit.length) {
          next.covered = { ...state.covered };
          for (const k of hit) next.covered[k] = { how: "said", note: text.trim() };
        }
      }

      /* A fresh account. Read it, or admit it couldn't and ask. */
      /* "Nothing else" doesn't end the conversation on its own —
         evidence gets one last ask first. It's the part that can't
         be reconstructed later, and the part a manager only
         remembers once nothing else is being asked of them. */
      if (saysDone(text) && incidents.length) {
        if (!state.extrasAsked)
          return {
            ...next,
            incidents,
            extrasAsked: true,
            thread: [...thread, msg("ai", "text",
              "Anything else you want to add? Photos, notes, additional information?")],
          };
        return {
          ...next,
          incidents,
          thread: [...thread, msg("ai", "text", "Right — here's what I'll file.")],
          phase: "summary",
        };
      }

      const read = action.analysis?.incidents ?? detect(text);

      /* Nothing happened is an answer, not a gap. It routes
         straight to an affirmation — which IS the evidence that
         the venue was running its process that night. */
      if (!read.length && saysNothing(text)) {
        return {
          ...next,
          incidents,
          thread: [
            ...thread,
            msg("ai", "text", incidents.length
              ? "Understood. Nothing else to add then — here's what I'll file."
              : "A clean night, then. I'll record that nothing happened — you'll sign it, and that signature is what proves the venue was running its process tonight."),
          ],
          phase: "summary",
        };
      }

      /* Model output when the server answered, keyword output when
         it didn't. Same shape either way — nothing downstream
         knows or cares which one produced this. */
      const found = read.map((inc) => ({
        ...inc,
        id: `${inc.id}_${state.raw.length}`,
        asked: [],
        proposed: { ...inc },
        /* No silent stamp. A brawl reported at 01:42 may have
           happened at 01:20, and inventing the time is the one
           thing this product must never do — so it asks, with
           "Just now" one tap away. */
        capturedAt: state.mode === "quick" ? shiftNow() : null,
      }));

      if (found.length) incidents = [...incidents, ...found];
      else if (looksSubstantive(text))
        incidents = [...incidents, unclassified(text, `inc_u${state.raw.length}`)];
      else if (!incidents.length)
        return {
          ...next,
          incidents,
          thread: [...thread, msg("ai", "text", "Quiet one? I'll record it as a clean night unless you tell me otherwise.")],
          phase: "summary",
        };

      return advance({ ...next, incidents });
    }

    /* Correction is conversation, not editing: reopening puts the
       question back in the thread rather than opening a field. */
    case "reopen": {
      const inc = state.incidents.find((i) => i.id === action.id);
      if (!inc) return state;
      const incidents = state.incidents.map((i) =>
        i.id === action.id
          ? { ...i, logged: false, asked: (i.asked ?? []).filter((k) => k !== action.field), [action.field]: null }
          : i,
      );
      return advance({
        ...state,
        incidents,
        thread: [...state.thread, msg("ai", "text", "Fair enough — let me ask again.")],
      });
    }

    case "drop": {
      const target = state.incidents.find((i) => i.id === action.id);
      return advance({
        ...state,
        incidents: state.incidents.filter((i) => i.id !== action.id),
        dropped: target ? [...state.dropped, target] : state.dropped,
        thread: [...state.thread, msg("ai", "text", "Dropped it. Still in the transcript if you need it.")],
      });
    }

    case "add-person":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.id
            ? { ...i, personsInvolved: [...i.personsInvolved, action.person] }
            : i,
        ),
      };

    /* Mid-shift. Time is NOW, so it never has to ask. */
    case "log-incident":
      return {
        ...state,
        phase: "quick",
        mode: "quick",
        pending: null,
        /* Empty on purpose — Thread renders the pointers until the
           manager says something. */
        thread: [],
      };

    /* End of shift. Opens holding whatever was logged as it
       happened, so nothing gets narrated twice. */
    case "add-report": {
      const lines = reportOpening(state.incidents);
      const known = knownFacts();

      /* Anything already true of tonight starts ticked, marked as
         coming from the shift data rather than from the manager —
         so it can be corrected, and so the tick isn't a lie. */
      const covered = Object.fromEntries(
        Object.entries(known).map(([k, note]) => [k, { how: "known", note }]),
      );
      if (state.incidents.length)
        covered.incidents = {
          how: "said",
          note: `${state.incidents.length} logged during the shift.`,
        };

      const thread = [
        ...lines.map((l, i) => msg("ai", i === lines.length - 1 ? "text" : "context", l)),
        msg("ai", "checklist", ""),
        msg("ai", "text",
          "I've filled in what I already know from tonight — tasks, stock, " +
          "maintenance, the door. Tell me if any of it changed, or just talk " +
          "me through the night and I'll file it under the right headings."),
      ];

      /* Don't wait to be spoken to. It already knows what was
         logged mid-shift and what those records are missing, so it
         opens by asking — otherwise the manager's first sentence
         lands before any question and gets wasted. */
      return advance({
        ...state,
        phase: "report",
        mode: "report",
        pending: null,
        groupAsked: false,
        covered,
        thread,
      });
    }

    case "dashboard":
      return { ...state, phase: "dashboard", pending: null };

    case "summary":
      return { ...state, phase: "summary" };

    case "back":
      return { ...state, phase: "talking" };

    case "toggle-report":
      return { ...state, showReport: !state.showReport };

    /* Explicitly nothing to add is stronger than a blank — it says
       the manager considered it. */
    case "skip-section":
      return {
        ...state,
        covered: { ...state.covered, [action.key]: { how: "none", note: "Nothing to add." } },
      };

    case "attest":
      return { ...state, attested: action.value };

    case "file":
      return { ...state, phase: "filed", filedAt: new Date().toISOString() };

    case "amend":
      return {
        ...state,
        amendments: [...state.amendments, { at: new Date().toISOString(), by: venue.manager, note: action.note }],
        phase: "talking",
      };

    case "reset":
      mid = 0;
      return {
        ...initialState,
        thread: opening().map((line, i) =>
          msg("ai", i === opening().length - 1 ? "text" : "context", line),
        ),
      };

    default:
      return state;
  }
}

/* Derived state + actions, built in one place so a test can
   construct the same value a component sees. */
export function buildValue(state, dispatch) {
  const logged = state.incidents.filter((i) => i.logged);
  return {
    ...state,
    venue,
    logged,
      incomplete: logged.filter((i) => !i.full),
      SECTIONS,
      coveredCount: SECTIONS.filter((s) => state.covered?.[s.key]).length,
      open: state.incidents.filter((i) => !i.logged),
      preservations: logged.filter((i) => i.preservation).map((i) => ({ id: i.id, ...i.preservation, at: i.occurredAt, location: i.location })),
      byId: (id) => state.incidents.find((i) => i.id === id),
      TYPES,

      say: (text, analysis) => dispatch({ type: "say", text, analysis }),
      think: () => dispatch({ type: "thinking" }),
      reopen: (id, field) => dispatch({ type: "reopen", id, field }),
      drop: (id) => dispatch({ type: "drop", id }),
      addPerson: (id, person) => dispatch({ type: "add-person", id, person }),
      toSummary: () => dispatch({ type: "summary" }),
      logIncident: () => dispatch({ type: "log-incident" }),
      addReport: () => dispatch({ type: "add-report" }),
      toggleReport: () => dispatch({ type: "toggle-report" }),
      skipSection: (key) => dispatch({ type: "skip-section", key }),
      toDashboard: () => dispatch({ type: "dashboard" }),
      back: () => dispatch({ type: "back" }),
      attest: (v) => dispatch({ type: "attest", value: v }),
      file: () => dispatch({ type: "file" }),
      amend: (note) => dispatch({ type: "amend", note }),
    reset: () => dispatch({ type: "reset" }),
  };
}

export function ReportProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => buildValue(state, dispatch), [state]);
  // createElement rather than JSX so this stays a .js file, per READING-THE-CODE.md
  return createElement(ReportContext.Provider, { value }, children);
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport must be used inside <ReportProvider>");
  return ctx;
}
