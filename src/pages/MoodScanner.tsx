import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FeatureNavbar from "@/components/ui/FeatureNavbar";
import { Camera, Mic, ScanFace, Sparkles } from "lucide-react";
import { apiUrl, parseJsonResponse } from "@/lib/api";

interface ScanResult {
  id?: string;
  detectedEmotion: string;
  energyLevel: string;
  fatigueDetected: boolean;
  confidence: number;
  wellbeingPrompt: string;
  supportiveSuggestions: string[];
  createdAt?: string;
  source?: string;
}

const MoodScanner = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [voiceNote, setVoiceNote] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [error, setError] = useState("");

  const emotionBadgeClass: Record<string, string> = {
    happy: "bg-emerald-100 text-emerald-800 border-emerald-300",
    calm: "bg-sky-100 text-sky-800 border-sky-300",
    tired: "bg-amber-100 text-amber-800 border-amber-300",
    anxious: "bg-orange-100 text-orange-800 border-orange-300",
    sad: "bg-indigo-100 text-indigo-800 border-indigo-300",
    angry: "bg-rose-100 text-rose-800 border-rose-300",
    neutral: "bg-slate-100 text-slate-800 border-slate-300",
  };

  const emotionScore: Record<string, number> = {
    angry: 18,
    anxious: 32,
    sad: 40,
    tired: 48,
    neutral: 58,
    calm: 74,
    happy: 90,
  };

  const speakPrompt = (text: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis failures.
    }
  };

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
    } catch {
      setError("Camera access nahi mila. Browser permission allow karein.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const captureFrameAsBase64 = (targetWidth = 320) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const sourceWidth = video.videoWidth || 640;
    const sourceHeight = video.videoHeight || 480;
    const width = Math.min(targetWidth, sourceWidth);
    const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
  };

  const captureFramesBurst = (count: number) => {
    const frames: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const frame = captureFrameAsBase64();
      if (frame) frames.push(frame);
    }
    return frames;
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;
      const res = await fetch(apiUrl("/api/mood-scanner/history"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await parseJsonResponse(res, "Unable to parse mood scanner history");
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // Ignore history failures silently.
    }
  };

  useEffect(() => {
    loadHistory();
    return () => stopCamera();
  }, []);

  const runScan = async () => {
    if (!cameraReady || isScanning) return;
    setError("");
    setResult(null);
    setIsScanning(true);
    setCountdown(5);
    const frameSamples: string[] = [];

    for (let i = 5; i >= 1; i -= 1) {
      setCountdown(i);
      const frame = captureFrameAsBase64();
      if (frame) frameSamples.push(frame);
      // Countdown for 5-second active scan.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const burstFrames = captureFramesBurst(1);
    const allFrames = [...frameSamples, ...burstFrames].filter(Boolean);
    const imageBase64 = allFrames[Math.floor(allFrames.length / 2)] || captureFrameAsBase64();
    if (!imageBase64) {
      setIsScanning(false);
      setCountdown(0);
      setError("Scan image capture nahi hua. Dubara try karein.");
      return;
    }

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        throw new Error("Please login again to use mood scanner");
      }

      const res = await fetch(apiUrl("/api/mood-scanner/scan"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageBase64, framesBase64: allFrames.slice(0, 2), voiceNote }),
      });

      const data = await parseJsonResponse(res, "Unable to parse mood scan response");
      if (!res.ok) {
        throw new Error(data?.message || "Scan failed");
      }

      setResult(data);
      speakPrompt(data?.wellbeingPrompt || "Aap kaise feel kar rahe ho abhi?");
      setHistory((prev) => [data, ...prev].slice(0, 20));
    } catch (e: any) {
      setError(e?.message || "Mood scan failed");
    } finally {
      setIsScanning(false);
      setCountdown(0);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition browser me support nahi karta. Aap text manually likh sakte ho.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setVoiceNote((prev) => (prev ? `${prev}. ${transcript}` : transcript));
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const recentHistory = history.slice(0, 8);
  const emotionCounts = recentHistory.reduce<Record<string, number>>((acc, item) => {
    const key = item.detectedEmotion || "neutral";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
  const avgConfidence =
    recentHistory.length > 0
      ? Math.round((recentHistory.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / recentHistory.length) * 100)
      : 0;
  const fallbackRuns = recentHistory.filter((item) => (item.source || "").includes("fallback")).length;

  const trendPoints = recentHistory
    .slice()
    .reverse()
    .map((item, index) => ({
      index,
      emotion: item.detectedEmotion || "neutral",
      score: emotionScore[item.detectedEmotion || "neutral"] || 58,
      confidence: Math.round(Number(item.confidence || 0) * 100),
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-serenity-soft">
      <FeatureNavbar featureName="📷 Mood Scanner" />

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gradient-primary">Multimodal Mood Scanner</CardTitle>
            <CardDescription className="text-base">
              Camera se 5-second scan + optional voice input ke saath emotional check-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-serenity-calm/40 bg-card/70 p-3">
                <div className="relative overflow-hidden rounded-xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black/80" />
                  <div className="pointer-events-none absolute inset-0 border-2 border-cyan-300/30" />
                  {isScanning && (
                    <div className="pointer-events-none absolute inset-0 animate-pulse bg-cyan-400/10" />
                  )}
                  <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-cyan-300/40 bg-black/40 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
                    {isScanning ? `Live Scan ${countdown}s` : cameraReady ? "Camera Ready" : "Camera Off"}
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={startCamera} disabled={cameraReady} className="btn-primary-enhanced">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
                <Button onClick={stopCamera} variant="outline" disabled={!cameraReady}>
                  Stop Camera
                </Button>
                <Button onClick={runScan} disabled={!cameraReady || isScanning} className="btn-primary-enhanced">
                  <ScanFace className="mr-2 h-4 w-4" />
                  {isScanning ? `Scanning... ${countdown}s` : "Scan Mood (5s)"}
                </Button>
              </div>

              <div className="rounded-xl border border-serenity-calm/40 bg-card/70 p-4 space-y-3">
                <label className="text-sm font-semibold text-foreground">Voice Context (optional)</label>
                <textarea
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="Example: Aaj kaam zyada tha, aankhein heavy feel ho rahi hain..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm min-h-24"
                />
                <Button type="button" variant="outline" onClick={toggleVoiceInput}>
                  <Mic className="mr-2 h-4 w-4" />
                  {isListening ? "Stop Voice Capture" : "Use Voice Input"}
                </Button>
              </div>

              {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              {result?.source?.includes("fallback") && (
                <p className="rounded-lg border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Scanner fallback mode me chal raha hai, isliye neutral/medium zyada aa sakta hai. Server AI key ya permission check karein.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border border-primary/25 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground">Latest Insight</CardTitle>
                </CardHeader>
                <CardContent>
                  {!result ? (
                    <p className="text-sm text-muted-foreground">Scan complete karte hi yaha emotion insight show hoga.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${emotionBadgeClass[result.detectedEmotion] || emotionBadgeClass.neutral}`}
                        >
                          {result.detectedEmotion}
                        </span>
                        <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          Energy {result.energyLevel}
                        </span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                          Confidence {Math.round((result.confidence || 0) * 100)}%
                        </span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                          Mode {result.source || "ai"}
                        </span>
                      </div>
                      <p className="text-sm"><strong>Fatigue:</strong> {result.fatigueDetected ? "Yes" : "No"}</p>
                      <div className="rounded-lg border border-primary/30 bg-card/80 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Scanner Says</p>
                        <p className="text-sm font-medium text-foreground">{result.wellbeingPrompt}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Suggestions</p>
                        <ul className="space-y-1">
                          {(result.supportiveSuggestions || []).map((tip, idx) => (
                            <li key={`${tip}-${idx}`} className="text-sm text-foreground">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Scan History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Abhi tak koi mood scan history nahi hai.</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Dominant</p>
                          <p className="mt-1 text-sm font-bold text-foreground capitalize">{dominantEmotion}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Avg Confidence</p>
                          <p className="mt-1 text-sm font-bold text-foreground">{avgConfidence}%</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Scans</p>
                          <p className="mt-1 text-sm font-bold text-foreground">{recentHistory.length}</p>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">AI Reliability</p>
                          <p className="mt-1 text-sm font-bold text-foreground">{Math.max(0, recentHistory.length - fallbackRuns)}/{recentHistory.length}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Emotion Trend (latest window)</p>
                        <div className="flex items-end gap-1.5 h-24">
                          {trendPoints.map((point) => (
                            <div key={`${point.index}-${point.emotion}-${point.confidence}`} className="group relative flex-1">
                              <div
                                className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-cyan-300/80 transition-all duration-300 group-hover:from-primary group-hover:to-cyan-300"
                                style={{ height: `${Math.max(12, point.score)}%` }}
                              />
                              <span className="mt-1 block truncate text-center text-[10px] font-semibold uppercase text-muted-foreground">
                                {point.emotion.slice(0, 3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {recentHistory.map((item, idx) => (
                          <div key={`${item.id || item.createdAt || idx}`} className="rounded-lg border border-border/70 bg-card/70 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${emotionBadgeClass[item.detectedEmotion] || emotionBadgeClass.neutral}`}
                              >
                                {item.detectedEmotion}
                              </span>
                              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                {item.energyLevel}
                              </span>
                              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                                {Math.round(Number(item.confidence || 0) * 100)}%
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}</p>
                            <p className="text-[11px] text-muted-foreground">Mode: {item.source || "ai"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MoodScanner;
