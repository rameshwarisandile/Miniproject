import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeatureNavbar from "@/components/ui/FeatureNavbar";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import { Soup, Sparkles, ShieldCheck, Droplets, Mic, Square } from "lucide-react";

interface FoodItem {
  name: string;
  reason: string;
  timing: string;
  nutrients?: string[];
}

interface MindGutResult {
  id?: string;
  moodLabel: string;
  suggestionSummary: string;
  whyItHelps: string;
  foods: FoodItem[];
  avoid: string[];
  hydrationTip: string;
  source?: string;
  createdAt?: string;
}

const sampleInputs = [
  "I feel anxious and restless since morning.",
  "I feel low and emotionally tired today.",
  "I am okay but I want foods that keep my mood stable.",
  "I had poor sleep and now I feel foggy and stressed.",
];

const MindGut = () => {
  const recognitionRef = useRef<any>(null);
  const [inputText, setInputText] = useState(sampleInputs[0]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MindGutResult | null>(null);
  const [history, setHistory] = useState<MindGutResult[]>([]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      const response = await fetch(apiUrl("/api/mind-gut/history"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;
      const data = await parseJsonResponse(response, "Unable to load mind-gut history");
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // Ignore load errors.
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (transcript) {
        setInputText((prev) => {
          const cleanPrev = prev.trim();
          if (!cleanPrev || cleanPrev === sampleInputs[0]) return transcript;
          return `${cleanPrev} ${transcript}`.trim();
        });
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors on unmount.
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setError("");
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setError("Could not start the mic. Please allow microphone permission and try again.");
    }
  };

  const generateSuggestion = async () => {
    if (!inputText.trim()) {
      setError("Please describe your mood first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("Please login again to continue.");
      }

      const response = await fetch(apiUrl("/api/mind-gut/suggest"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inputText }),
      });

      const data = await parseJsonResponse(response, "Unable to parse mind-gut response");
      if (!response.ok) {
        throw new Error(data?.message || "Unable to generate mind-gut suggestion");
      }

      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 20));
    } catch (err: any) {
      setError(err?.message || "Mind-gut suggestion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      <FeatureNavbar featureName="🥗 Mind-Gut Connection" />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Card className="card-elevated border-serenity-calm/30">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gradient-primary">Mood-Based Food Guidance</CardTitle>
            <CardDescription className="text-base">
              Tell how you feel, and get practical food suggestions that support mood through the gut-brain connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-serenity-calm/40 bg-card/70 px-4 py-3 text-sm outline-none"
              placeholder="Example: I feel anxious and mentally heavy today."
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={toggleVoiceInput}
                disabled={!speechSupported}
              >
                {isListening ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isListening ? "Stop Voice" : "Use Voice Input"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {speechSupported ? "Speak your mood and it will be added to the text box." : "Speech-to-text is not supported in this browser."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {sampleInputs.map((item) => (
                <Button key={item} variant="outline" size="sm" onClick={() => setInputText(item)}>
                  {item.length > 48 ? `${item.slice(0, 48)}...` : item}
                </Button>
              ))}
            </div>

            {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button onClick={generateSuggestion} disabled={loading} className="btn-primary-enhanced">
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? "Generating Suggestions..." : "Get Mind-Gut Plan"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Latest Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <p className="text-sm text-muted-foreground">Generate once to see your personalized food guidance.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-serenity-calm/40 bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected Mood</p>
                    <p className="text-lg font-semibold text-foreground">{result.moodLabel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{result.suggestionSummary}</p>
                  </div>

                  <div className="rounded-xl border border-serenity-calm/40 bg-card/70 p-4">
                    <p className="text-sm font-medium text-foreground">Why this helps</p>
                    <p className="mt-1 text-sm text-muted-foreground">{result.whyItHelps}</p>
                  </div>

                  <div className="space-y-3">
                    {result.foods?.map((food, idx) => (
                      <div key={`${food.name}-${idx}`} className="rounded-xl border border-serenity-calm/40 bg-card/70 p-4">
                        <p className="text-sm font-semibold text-foreground">{food.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{food.reason}</p>
                        <p className="mt-2 text-xs text-primary">Best time: {food.timing || "Anytime"}</p>
                        {!!food.nutrients?.length && (
                          <p className="mt-1 text-xs text-muted-foreground">Nutrients: {food.nutrients.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Food To Limit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!result?.avoid?.length ? (
                  <p className="text-sm text-muted-foreground">No specific limits suggested yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.avoid.map((item, idx) => (
                      <li key={`${item}-${idx}`} className="rounded-lg border border-serenity-calm/30 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Droplets className="h-5 w-5 text-primary" />
                  Hydration Tip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result?.hydrationTip || "Hydration guidance will appear after generation."}</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Soup className="h-5 w-5 text-primary" />
                  Recent Mind-Gut Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recommendation history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id || `${item.createdAt}-${item.moodLabel}`} className="rounded-xl border border-serenity-calm/30 bg-card/70 px-3 py-2">
                        <p className="text-sm font-semibold text-foreground">{item.moodLabel}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.suggestionSummary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindGut;
