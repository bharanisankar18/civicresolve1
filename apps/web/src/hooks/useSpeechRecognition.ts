import { useState, useEffect, useCallback } from "react";

interface ISpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: (langCode?: "en" | "ta" | "hi") => void;
  stopListening: () => void;
  hasSupport: boolean;
  error: string | null;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);

  const hasSupport =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!hasSupport) return;

    const win = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };

    const SpeechRecClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecClass) return;

    const instance = new SpeechRecClass();
    instance.continuous = false;
    instance.interimResults = true;

    instance.onresult = (event: ISpeechRecognitionEvent) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
        const resultItem = event.results[i];
        if (resultItem && resultItem[0]) {
          current += resultItem[0].transcript;
        }
      }
      setTranscript(current);
    };

    instance.onerror = (e: { error: string }) => {
      setError(e.error || "Speech recognition error");
      setIsListening(false);
    };

    instance.onend = () => {
      setIsListening(false);
    };

    setRecognition(instance);
  }, [hasSupport]);

  const startListening = useCallback(
    (langCode: "en" | "ta" | "hi" = "en") => {
      if (!recognition) return;
      setError(null);
      setTranscript("");

      const langMap: Record<string, string> = {
        en: "en-IN",
        ta: "ta-IN",
        hi: "hi-IN",
      };

      recognition.lang = langMap[langCode] || "en-IN";
      try {
        recognition.start();
        setIsListening(true);
      } catch (_err) {
        // Recognition already started
      }
    },
    [recognition],
  );

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasSupport,
    error,
  };
}
