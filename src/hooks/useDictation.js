import { useCallback, useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   LIVE DICTATION
   Real speech recognition via the browser's Web Speech API.
   Chrome and Safari support it; Firefox does not.

   Why a hook and not a component: dictation is an input method,
   not a screen. Wherever capture ends up living, this comes with
   it unchanged.

   The text is NOT owned here. Final phrases are handed to the
   caller via onFinal so the draft stays the single source of
   truth — the same reason RawCapture is append-only.
   ───────────────────────────────────────────────────────────── */

const Recognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
    : null;

const MESSAGES = {
  "not-allowed": "Microphone blocked. Allow it in your browser's address bar.",
  "service-not-allowed": "Microphone blocked by the browser.",
  "audio-capture": "No microphone found.",
  network: "Speech service unreachable — check your connection.",
};

export function useDictation({ onFinal, lang = "en-GB" } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const wantedRef = useRef(false); // did the user ask to be listening?
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    if (!Recognition) return;

    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true; // this is what makes it live
    rec.lang = lang;

    rec.onresult = (event) => {
      let live = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          onFinalRef.current?.(text.trim());
        } else {
          live += text;
        }
      }
      setInterim(live);
    };

    rec.onerror = (event) => {
      // Silence between sentences isn't an error worth showing.
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(MESSAGES[event.error] ?? `Dictation error: ${event.error}`);
      wantedRef.current = false;
      setListening(false);
    };

    /* Chrome ends the session on its own after a pause. If the
       manager hasn't pressed stop, start it again — they are
       mid-thought, not finished. */
    rec.onend = () => {
      setInterim("");
      if (wantedRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantedRef.current = false;
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || wantedRef.current) return;
    setError(null);
    wantedRef.current = true;
    try {
      rec.start();
      setListening(true);
    } catch {
      wantedRef.current = false; // already running
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    wantedRef.current = false;
    setInterim("");
    setListening(false);
    try {
      rec?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const toggle = useCallback(() => {
    wantedRef.current ? stop() : start();
  }, [start, stop]);

  return {
    supported: Boolean(Recognition),
    listening,
    interim, // the words being said right now, not yet committed
    error,
    start,
    stop,
    toggle,
  };
}
