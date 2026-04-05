import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureNavbar from "@/components/ui/FeatureNavbar";
import { apiUrl, parseJsonResponse } from "@/lib/api";
import { Download, Copy, Sparkles, WandSparkles, Palette, Mic, Square } from "lucide-react";

interface ArtShape {
  type:
    | "orb"
    | "wave"
    | "spark"
    | "mist"
    | "glow"
    | "petal"
    | "moon"
    | "rain"
    | "sun"
    | "cloud"
    | "mountain"
    | "river"
    | "leaf"
    | "bird"
    | "lotus"
    | "horizon";
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
}

interface MoodArtResult {
  id?: string;
  title: string;
  moodSummary: string;
  composition: string;
  palette: string[];
  overlayText: string;
  socialCaption: string;
  shapes: ArtShape[];
  source?: string;
  createdAt?: string;
  styleMode?: string;
}

type ArtStyleMode = "cinematic" | "dreamy" | "bold" | "minimal";

const ART_STYLE_OPTIONS: Array<{ key: ArtStyleMode; label: string; hint: string }> = [
  { key: "cinematic", label: "Cinematic", hint: "Deep contrast and layered drama" },
  { key: "dreamy", label: "Dreamy", hint: "Soft mist, pastel glow, calm aura" },
  { key: "bold", label: "Bold", hint: "High energy strokes and punchy color" },
  { key: "minimal", label: "Minimal", hint: "Clean composition with gentle space" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const raw = String(hex || "").trim().replace("#", "");
  const normalized = raw.length === 3
    ? raw.split("").map((ch) => ch + ch).join("")
    : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHsl = (r: number, g: number, b: number) => {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s, l };
};

const getColorMeaning = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return {
      title: "Emotional tone",
      meaning: "A mixed shade reflecting layered emotions and transitions.",
    };
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (l > 0.88 && s < 0.2) {
    return {
      title: "Clarity",
      meaning: "Peace, openness, and mental breathing space.",
    };
  }
  if (l < 0.2) {
    return {
      title: "Depth",
      meaning: "Inner reflection, seriousness, and emotional grounding.",
    };
  }
  if (s < 0.16) {
    return {
      title: "Balance",
      meaning: "Neutral state, stability, and emotional reset.",
    };
  }

  if (h < 20 || h >= 345) {
    return {
      title: "Intensity",
      meaning: "Strong emotion, urgency, courage, and emotional release.",
    };
  }
  if (h < 45) {
    return {
      title: "Warmth",
      meaning: "Motivation, movement, and expressive confidence.",
    };
  }
  if (h < 70) {
    return {
      title: "Hope",
      meaning: "Optimism, joy, and brighter outlook.",
    };
  }
  if (h < 165) {
    return {
      title: "Healing",
      meaning: "Growth, recovery, and gentle emotional renewal.",
    };
  }
  if (h < 205) {
    return {
      title: "Calm",
      meaning: "Mental ease, breath, and cool stability.",
    };
  }
  if (h < 255) {
    return {
      title: "Trust",
      meaning: "Safety, reflection, and emotional consistency.",
    };
  }
  if (h < 315) {
    return {
      title: "Imagination",
      meaning: "Intuition, dreams, and creative inner space.",
    };
  }
  return {
    title: "Compassion",
    meaning: "Tenderness, self-love, and emotional softness.",
  };
};

const samplePrompts = [
  "I feel a bit happy today, but also slightly afraid.",
  "I am tired, but I still feel hopeful inside.",
  "Today felt calm and I felt grateful.",
  "I feel anxious, but I am trying to stay grounded.",
];

const defaultPrompt = samplePrompts[0];

const MoodToArt = () => {
  const artRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const [inputText, setInputText] = useState(defaultPrompt);
  const [result, setResult] = useState<MoodArtResult | null>(null);
  const [history, setHistory] = useState<MoodArtResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [error, setError] = useState("");
  const [styleMode, setStyleMode] = useState<ArtStyleMode>("cinematic");
  const [variationSeed, setVariationSeed] = useState(0);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      const response = await fetch(apiUrl("/api/mood-art/history"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;
      const data = await parseJsonResponse(response, "Unable to load mood art history");
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // Silent fallback.
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
    recognition.lang = "hi-IN";
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
          if (!cleanPrev || cleanPrev === defaultPrompt) return transcript;
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
        // ignore stop errors on unmount
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

  const generateArt = async (options?: { isVariant?: boolean }) => {
    if (!inputText.trim()) {
      setError("Please write a few words about your day first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("Please login again to generate mood art.");
      }

      const response = await fetch(apiUrl("/api/mood-art/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputText,
          styleMode,
          variationSeed: options?.isVariant ? Date.now() : variationSeed,
        }),
      });

      const data = await parseJsonResponse(response, "Unable to parse mood art response");
      if (!response.ok) {
        throw new Error(data?.message || "Mood art generation failed");
      }

      setResult(data);
      setHistory((prev) => [data, ...prev].slice(0, 20));
      if (typeof data?.styleMode === "string") {
        const normalizedStyle = data.styleMode.toLowerCase() as ArtStyleMode;
        if (ART_STYLE_OPTIONS.some((option) => option.key === normalizedStyle)) {
          setStyleMode(normalizedStyle);
        }
      }
      if (options?.isVariant) {
        setVariationSeed(Date.now());
      }
    } catch (err: any) {
      setError(err?.message || "Mood art generation failed");
    } finally {
      setLoading(false);
    }
  };

  const regenerateVariant = async () => {
    await generateArt({ isVariant: true });
  };

  const downloadArt = async () => {
    if (!artRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(artRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `mood-to-art-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    if (!result?.socialCaption) return;
    try {
      await navigator.clipboard.writeText(result.socialCaption);
    } catch {
      // ignore clipboard failure
    }
  };

  const artPalette = result?.palette?.length ? result.palette : ["#0B1026", "#2A4AA0", "#D46A88", "#F0B77A", "#F2EDE2"];
  // Ensure every shape has a color; fallback to palette if missing
  const shapes = (result?.shapes || []).map((shape, idx) => ({
    ...shape,
    color: shape.color && shape.color.trim() ? shape.color : artPalette[idx % artPalette.length],
  }));
  const painterStrokes = artPalette.map((color, index) => ({
    color,
    width: 44 + index * 10,
    left: 10 + index * 19,
    top: 16 + (index % 2 === 0 ? index * 11 : index * 9),
    rotate: -24 + index * 16,
    opacity: 0.2 + index * 0.07,
  }));

  const cinematicBackdrop = `
    radial-gradient(circle at 12% 18%, ${artPalette[0]}DD 0%, transparent 44%),
    radial-gradient(circle at 82% 14%, ${artPalette[1]}CC 0%, transparent 36%),
    radial-gradient(circle at 20% 86%, ${artPalette[2]}AA 0%, transparent 42%),
    radial-gradient(circle at 86% 80%, ${artPalette[3]}99 0%, transparent 38%),
    linear-gradient(145deg, ${artPalette[0]} 0%, ${artPalette[1]} 28%, ${artPalette[2]} 56%, ${artPalette[3]} 78%, ${artPalette[4] || artPalette[3]} 100%)
  `;

  const bloomFlares = artPalette.slice(0, 4).map((color, index) => ({
    color,
    left: 14 + index * 23,
    top: index % 2 === 0 ? 24 + index * 10 : 70 - index * 8,
    size: 26 + index * 9,
    opacity: clamp(0.16 + index * 0.04, 0.16, 0.34),
  }));

  const colorInsights = artPalette.slice(0, 5).map((color, index) => ({
    color,
    ...getColorMeaning(color),
    share: index === 0 ? "Primary mood" : index === 1 ? "Secondary tone" : `Accent ${index - 1}`,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-serenity-soft to-background">
      <FeatureNavbar featureName="🎨 Mood-to-Art" />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="rounded-[2rem] border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-purple-950/20">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md text-white shadow-none">
              <CardHeader>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                  <WandSparkles className="h-3.5 w-3.5" />
                  Generative Therapy
                </div>
                <CardTitle className="text-3xl font-bold text-white sm:text-4xl">Turn your feelings into a digital painting</CardTitle>
                <CardDescription className="text-base text-white/70">
                  Describe your mood, Gemini will transform it into an abstract art direction, and the app will render it as a beautiful painting.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-sm"
                  placeholder="I feel calm, but a little uncertain about tomorrow..."
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleVoiceInput}
                    disabled={!speechSupported}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    {isListening ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isListening ? "Stop Mic" : "Speak Mood"}
                  </Button>
                  <p className="text-xs text-white/70">
                    {speechSupported ? "You can speak your mood and it will be added here." : "Speech-to-text is not supported in this browser."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      onClick={() => setInputText(prompt)}
                      className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      {prompt.length > 38 ? `${prompt.slice(0, 38)}...` : prompt}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/60">Art Style</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ART_STYLE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setStyleMode(option.key)}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          styleMode === option.key
                            ? "border-white/60 bg-white/20"
                            : "border-white/15 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="text-xs text-white/70">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={generateArt} disabled={loading} className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 font-semibold text-white shadow-lg shadow-fuchsia-500/20">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {loading ? "Painting..." : "Generate Mood Art"}
                  </Button>
                  <Button variant="outline" onClick={regenerateVariant} disabled={loading || !inputText.trim()} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <WandSparkles className="mr-2 h-4 w-4" />
                    {loading ? "Regenerating..." : "Regenerate Variant"}
                  </Button>
                  <Button variant="outline" onClick={downloadArt} disabled={!result || downloading} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Download className="mr-2 h-4 w-4" />
                    {downloading ? "Downloading..." : "Download PNG"}
                  </Button>
                  <Button variant="outline" onClick={copyCaption} disabled={!result} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Caption
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <div
                ref={artRef}
                className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900 p-4 shadow-2xl shadow-black/30"
                style={{ minHeight: 620 }}
              >
                <div className="absolute inset-0 opacity-[0.98]" style={{ background: cinematicBackdrop }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_34%)]" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.45))" }} />
                <div className="absolute inset-0 backdrop-blur-[1px]" />

                <div className="relative z-10 flex h-full min-h-[590px] flex-col justify-between rounded-[1.4rem] border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-white/60">Mood To Art</p>
                      <p className="mt-2 inline-block rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">Style {ART_STYLE_OPTIONS.find((item) => item.key === styleMode)?.label || "Cinematic"}</p>
                      <h2 className="mt-2 text-2xl font-bold text-white">{result?.title || "Untitled Mood Painting"}</h2>
                      <p className="mt-1 max-w-md text-sm text-white/75">{result?.moodSummary || "Your feeling will appear here as an artwork."}</p>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/15 px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">Palette</p>
                      <div className="mt-2 flex gap-1.5 justify-end">
                        {artPalette.slice(0, 5).map((color) => (
                          <span key={color} className="h-4 w-4 rounded-full border border-white/40" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative flex-1 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/10">
                    {bloomFlares.map((flare, index) => (
                      <div
                        key={`flare-${index}`}
                        className="absolute rounded-full blur-3xl"
                        style={{
                          left: `${flare.left}%`,
                          top: `${flare.top}%`,
                          width: `${flare.size}%`,
                          height: `${flare.size}%`,
                          opacity: flare.opacity,
                          transform: "translate(-50%, -50%)",
                          background: flare.color,
                          mixBlendMode: "screen",
                        }}
                      />
                    ))}

                    {painterStrokes.map((stroke, index) => (
                      <div
                        key={`stroke-${index}`}
                        className="absolute rounded-[48%] blur-[3px]"
                        style={{
                          left: `${stroke.left}%`,
                          top: `${stroke.top}%`,
                          width: `${stroke.width}%`,
                          height: "18%",
                          opacity: stroke.opacity,
                          transform: `translate(-50%, -50%) rotate(${stroke.rotate}deg)`,
                          background: `linear-gradient(120deg, ${stroke.color}F2 0%, transparent 88%)`,
                          mixBlendMode: "screen",
                        }}
                      />
                    ))}

                    {shapes.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-white/80">
                        <div>
                          <Palette className="mx-auto mb-3 h-10 w-10 text-white/70" />
                          <p className="text-lg font-semibold">Your art will appear here</p>
                          <p className="mt-1 text-sm text-white/55">A mood-based abstract painting will be generated from your words.</p>
                        </div>
                      </div>
                    ) : (
                      shapes.map((shape, index) => {
                        const style: CSSProperties = {
                          left: `${shape.x * 100}%`,
                          top: `${shape.y * 100}%`,
                          width: `${shape.size * 30}%`,
                          height: `${shape.size * 24}%`,
                          opacity: clamp(shape.opacity, 0.12, 0.92),
                          transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
                          background: `linear-gradient(130deg, ${shape.color}, rgba(255,255,255,0.08))`,
                        };

                        if (shape.type === "wave") {
                          return <div key={`${shape.type}-${index}`} className="absolute rounded-[999px] blur-lg" style={{ ...style, height: `${shape.size * 14}%`, mixBlendMode: "screen", boxShadow: `0 0 30px ${shape.color}66` }} />;
                        }

                        if (shape.type === "sun") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-full"
                              style={{
                                ...style,
                                width: `${shape.size * 20}%`,
                                height: `${shape.size * 20}%`,
                                background: `radial-gradient(circle, ${shape.color} 0%, ${shape.color}AA 45%, transparent 80%)`,
                                boxShadow: `0 0 58px ${shape.color}99`,
                                mixBlendMode: "screen",
                              }}
                            />
                          );
                        }

                        if (shape.type === "cloud") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-[999px] blur-sm"
                              style={{
                                ...style,
                                width: `${shape.size * 38}%`,
                                height: `${shape.size * 14}%`,
                                background: `linear-gradient(90deg, ${shape.color}C8, ${shape.color}66)`,
                                mixBlendMode: "screen",
                              }}
                            />
                          );
                        }

                        if (shape.type === "mountain") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute"
                              style={{
                                ...style,
                                width: `${shape.size * 46}%`,
                                height: `${shape.size * 28}%`,
                                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                                background: `linear-gradient(180deg, ${shape.color}D0, ${shape.color}66)`,
                                filter: "saturate(1.1)",
                              }}
                            />
                          );
                        }

                        if (shape.type === "river") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-[999px] blur-[1px]"
                              style={{
                                ...style,
                                width: `${shape.size * 52}%`,
                                height: `${shape.size * 8}%`,
                                background: `linear-gradient(90deg, transparent 0%, ${shape.color}C8 35%, ${shape.color}88 70%, transparent 100%)`,
                                mixBlendMode: "screen",
                              }}
                            />
                          );
                        }

                        if (shape.type === "horizon") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-[999px]"
                              style={{
                                ...style,
                                width: `${shape.size * 58}%`,
                                height: `${shape.size * 4.5}%`,
                                background: `linear-gradient(90deg, transparent, ${shape.color}AA, transparent)`,
                                mixBlendMode: "screen",
                              }}
                            />
                          );
                        }

                        if (shape.type === "bird") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute"
                              style={{
                                ...style,
                                width: `${shape.size * 12}%`,
                                height: `${shape.size * 5}%`,
                                borderTop: `2px solid ${shape.color}`,
                                borderRadius: "999px",
                                background: "transparent",
                                boxShadow: `10px 0 0 -8px ${shape.color}`,
                              }}
                            />
                          );
                        }

                        if (shape.type === "lotus") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-full"
                              style={{
                                ...style,
                                width: `${shape.size * 22}%`,
                                height: `${shape.size * 14}%`,
                                background: `radial-gradient(ellipse at center, ${shape.color}, ${shape.color}55)`,
                                boxShadow: `0 0 24px ${shape.color}88`,
                              }}
                            />
                          );
                        }

                        if (shape.type === "leaf") {
                          return (
                            <div
                              key={`${shape.type}-${index}`}
                              className="absolute rounded-[60%_40%_60%_40%]"
                              style={{
                                ...style,
                                width: `${shape.size * 16}%`,
                                height: `${shape.size * 24}%`,
                                background: `linear-gradient(160deg, ${shape.color}, ${shape.color}66)`,
                                filter: "saturate(1.2)",
                              }}
                            />
                          );
                        }

                        if (shape.type === "mist") {
                          return <div key={`${shape.type}-${index}`} className="absolute rounded-full blur-3xl" style={{ ...style, width: `${shape.size * 42}%`, height: `${shape.size * 30}%`, mixBlendMode: "screen" }} />;
                        }

                        if (shape.type === "glow") {
                          return <div key={`${shape.type}-${index}`} className="absolute rounded-full blur-2xl" style={{ ...style, boxShadow: `0 0 42px ${shape.color}`, mixBlendMode: "screen" }} />;
                        }

                        if (shape.type === "moon") {
                          return <div key={`${shape.type}-${index}`} className="absolute rounded-full shadow-[0_0_50px_rgba(255,255,255,0.35)]" style={{ ...style, width: `${shape.size * 18}%`, height: `${shape.size * 18}%` }} />;
                        }

                        if (shape.type === "rain") {
                          return (
                            <div key={`${shape.type}-${index}`} className="absolute rounded-full blur-sm" style={{ ...style, width: `${shape.size * 5}%`, height: `${shape.size * 26}%`, mixBlendMode: "screen" }} />
                          );
                        }

                        if (shape.type === "petal") {
                          return <div key={`${shape.type}-${index}`} className="absolute rounded-[40%] blur-[1px]" style={{ ...style, width: `${shape.size * 18}%`, height: `${shape.size * 28}%` }} />;
                        }

                        return <div key={`${shape.type}-${index}`} className="absolute rounded-[44%] shadow-[0_0_30px_rgba(255,255,255,0.22)]" style={{ ...style, mixBlendMode: "screen", filter: "saturate(1.15) contrast(1.06)" }} />;
                      })
                    )}

                    <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 130px rgba(0,0,0,0.36), inset 0 0 34px rgba(255,255,255,0.12)" }} />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Composition</p>
                      <p className="mt-2 text-sm leading-6 text-white/80">{result?.composition || "Gemini-generated composition will appear here."}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Overlay</p>
                      <p className="mt-2 text-lg font-semibold text-white">{result?.overlayText || "Let the feeling unfold."}</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{result?.socialCaption || "Your generated caption will appear here for sharing."}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="border border-white/10 bg-white/5 text-white shadow-none backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                    <Sparkles className="h-5 w-5 text-fuchsia-300" />
                    Ready-to-share caption
                  </CardTitle>
                  <CardDescription className="text-white/65">Copy this for Instagram, WhatsApp status, or stories.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/80">
                    {result?.socialCaption || "Generate an artwork to see a shareable caption."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-white/10 bg-white/5 text-white shadow-none backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                    <Palette className="h-5 w-5 text-sky-300" />
                    Color Meaning Guide
                  </CardTitle>
                  <CardDescription className="text-white/65">
                    Each color in your art reflects a mood layer so you can understand what the painting is expressing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {colorInsights.map((item) => (
                      <div key={`${item.color}-${item.share}`} className="rounded-xl border border-white/10 bg-black/15 p-3">
                        <div className="flex items-center gap-3">
                          <span className="h-6 w-6 rounded-full border border-white/50" style={{ backgroundColor: item.color }} />
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-white/55">{item.share}</p>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/75">{item.meaning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Card className="card-elevated border-white/10 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gradient-primary">Recent Mood Paintings</CardTitle>
            <CardDescription className="text-base">Your generated paintings history is saved in MongoDB.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mood artwork generated yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {history.slice(0, 6).map((item) => (
                  <div key={item.id || `${item.createdAt}-${item.title}`} className="rounded-2xl border border-border/70 bg-gradient-to-br from-card to-serenity-soft p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.title}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">{item.moodSummary}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.palette?.slice(0, 3).map((color) => (
                          <span key={color} className="h-3.5 w-3.5 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground line-clamp-3">{item.socialCaption}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoodToArt;
