/* ─────────────────────────────────────────────────────────────
   THE WRITTEN ACCOUNT
   Turns the structured record into the prose a licensing officer,
   an insurer or a solicitor will actually read two years from now.

   The structured fields are the register entry. This is the
   narrative that has to stand up beside them — and the two must
   never disagree, which is why it is generated FROM the record
   rather than from the conversation.
   ───────────────────────────────────────────────────────────── */

import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `You write the narrative section of a statutory incident report for a licensed venue, from a structured record a duty manager has already confirmed.

This document may be read years later by a licensing officer, an insurer, a solicitor, or a court. A report is defensible when a reader who was not present can establish five things: what occurred, when and where, who was involved, what was done, and what happened afterwards.

Rules, in order of importance:

1. Invent nothing. Every fact must come from the record. Where something is missing, say so explicitly ("no time was recorded", "the individuals were not identified"). A stated gap is defensible; a plausible guess is not.
2. Facts, not conclusions. Strip evaluative adjectives — no "aggressive", "hostile", "suspicious", "intoxicated-looking". Write observable behaviour and, where recorded, the words actually used. "Punches were thrown by both men" is a fact; "an unprovoked assault" is a conclusion.
3. Attribute every fact to its source. Make clear what the duty manager witnessed, what door staff reported, what a written slip records, and what the system captured automatically. Where two accounts differ, RECORD BOTH AND SAY THEY DIFFER — never silently prefer one. A noted discrepancy strengthens a report; a smoothed-over one destroys it under cross-examination.
4. Evidence must be specific: camera identifier, the exact time window, what was attached, who supplied it, and whether anything was unavailable.
5. Past tense, third person, plain English.

Output EXACTLY these three sections, each on its own line as a bare heading with no numbering, no markdown, no colon:

Description of the event
Injuries
Actions taken

Under each heading write plain prose paragraphs. If a section has nothing recorded, say so in one sentence rather than omitting the heading. Put evidence, preservation and chain of custody at the end of "Actions taken".

Never restate a question you were given. The record contains questions and answers; use the answers as facts and discard the question text.

Aim for a thorough account. Length must come from detail actually present in the record, never from padding.`;

const client = new Anthropic();

export async function narrate({ venue, incidents = [], sections = {}, notes = "", attachments = [] }) {
  /* Attached documents are a second account of the same night and
     often the more detailed one. They go in as evidence to be
     reconciled, not as facts to be merged. */
  const record = JSON.stringify(
    { venue, incidents, sections, attachedDocuments: attachments, changeRequest: notes },
    null,
    1,
  );
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `Write the narrative account from this record. Return prose only — no preamble, no headings, no markdown.${
          notes
            ? `\n\nThe manager read a previous draft and asked for this: "${notes}". Honour it, but never at the cost of accuracy to the record.`
            : ""
        }\n\n${record}`,
      },
    ],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("empty narrative");
  return { narrative: text };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "POST only" }));
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await narrate(body ?? {});
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: err?.message ?? "narrative failed" }));
  }
}
