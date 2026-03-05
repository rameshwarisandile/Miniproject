import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Timer, Heart, Sparkles } from "lucide-react";

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: "meditation" | "breathing" | "sleep" | "anxiety" | "gratitude";
  audioUrl?: string;
  type: "guided" | "timer" | "breathing";
}

interface CompletedSession {
  id: string;
  sessionTitle: string;
  sessionType: string;
  duration: number;
  completedAt: string;
  meditationStep?: number;
  breathingCount?: number;
}

const meditationSessions: MeditationSession[] = [
  {
    id: "1",
    title: "Mindful Breathing",
    description: "A simple 5-minute breathing exercise to center yourself",
    duration: 5,
    category: "breathing",
    type: "breathing"
  },
  {
    id: "2",
    title: "Body Scan Meditation",
    description: "Progressive relaxation through body awareness",
    duration: 10,
    category: "meditation",
    type: "guided"
  },
  {
    id: "3",
    title: "Sleep Preparation",
    description: "Gentle meditation to help you drift into peaceful sleep",
    duration: 15,
    category: "sleep",
    type: "guided"
  },
  {
    id: "4",
    title: "Anxiety Relief",
    description: "Quick techniques to calm anxious thoughts",
    duration: 8,
    category: "anxiety",
    type: "guided"
  },
  {
    id: "5",
    title: "Gratitude Practice",
    description: "Cultivate appreciation and positive mindset",
    duration: 7,
    category: "gratitude",
    type: "guided"
  }
];

const MeditationPlayer = () => {
  const [currentSession, setCurrentSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingCount, setBreathingCount] = useState(0);
  const [meditationStep, setMeditationStep] = useState(0);
  const [stepTimeLeft, setStepTimeLeft] = useState(30);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const meditationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load completed sessions from localStorage
    const saved = localStorage.getItem('completedMeditationSessions');
    if (saved) {
      try {
        setCompletedSessions(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading completed sessions:', error);
      }
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      if (meditationIntervalRef.current) clearInterval(meditationIntervalRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);
  
  const saveCompletedSession = (session: MeditationSession) => {
    const completedSession: CompletedSession = {
      id: `${session.id}-${Date.now()}`,
      sessionTitle: session.title,
      sessionType: session.type,
      duration: session.duration,
      completedAt: new Date().toISOString(),
      meditationStep: session.type === "guided" ? meditationStep : undefined,
      breathingCount: session.type === "breathing" ? breathingCount : undefined
    };
    
    const updatedSessions = [...completedSessions, completedSession];
    setCompletedSessions(updatedSessions);
    
    // Save to localStorage
    localStorage.setItem('completedMeditationSessions', JSON.stringify(updatedSessions));
  };

  const startSession = (session: MeditationSession) => {
    setCurrentSession(session);
    setDuration(session.duration * 60); // Convert to seconds
    setCurrentTime(0);
    setIsPlaying(true);
    
    if (session.type === "breathing") {
      startBreathingExercise();
    } else {
      startTimer();
    }
  };

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMeditationStep(0);
    
    // Start guided meditation steps
    if (currentSession?.type === "guided") {
      startGuidedMeditation();
    } else {
      // Regular timer for other session types
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            handleSessionComplete();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };
  
  const startGuidedMeditation = () => {
    if (meditationIntervalRef.current) clearInterval(meditationIntervalRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    
    // Set up guided meditation steps
    const steps = getMeditationSteps();
    let currentStepIndex = 0;
    
    // Start step timer countdown
    setStepTimeLeft(30);
    stepTimerRef.current = setInterval(() => {
      setStepTimeLeft(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);
    
    // Function to advance to next step
    const advanceStep = () => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        setMeditationStep(currentStepIndex);
        setStepTimeLeft(30); // Reset timer for new step
        
        // Schedule next step
        setTimeout(advanceStep, 30000); // 30 seconds per step
      } else {
        // All steps completed, start regular timer
        startRegularTimer();
      }
    };
    
    // Start the first step
    setMeditationStep(0);
    
    // Schedule the first step change
    setTimeout(advanceStep, 30000); // First step change after 30 seconds
    
    // Start regular timer after guided portion
    const startRegularTimer = () => {
      if (meditationIntervalRef.current) clearInterval(meditationIntervalRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            handleSessionComplete();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    };
  };

  const startBreathingExercise = () => {
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    
    // Start with inhale phase
    setBreathingPhase("inhale");
    
    // Function to cycle through breathing phases
    const cycleBreathing = () => {
      setBreathingPhase(prevPhase => {
        if (prevPhase === "inhale") {
          // After inhale, go to hold
          setTimeout(() => setBreathingPhase("hold"), 4000);
          return "inhale";
        } else if (prevPhase === "hold") {
          // After hold, go to exhale
          setTimeout(() => setBreathingPhase("exhale"), 2000);
          return "hold";
        } else {
          // After exhale, go back to inhale and increment count
          setTimeout(() => {
            setBreathingPhase("inhale");
            setBreathingCount(prev => prev + 1);
          }, 4000);
          return "exhale";
        }
      });
    };
    
    // Start the cycle
    cycleBreathing();
    
    // Set up continuous cycling
    breathingIntervalRef.current = setInterval(cycleBreathing, 10000); // 10 seconds per complete cycle
  };

  const handleSessionComplete = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    
    // Save the completed session
    if (currentSession) {
      saveCompletedSession(currentSession);
    }
    
    // Show completion message
    alert("Session completed! Great job taking time for yourself. 🌟");
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    } else {
      setIsPlaying(true);
      if (currentSession?.type === "breathing") {
        startBreathingExercise();
      } else {
        startTimer();
      }
    }
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 30, duration);
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 30, 0);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstructions = () => {
    switch (breathingPhase) {
      case "inhale":
        return { text: "Breathe In", color: "text-blue-600", bgColor: "bg-blue-100" };
      case "hold":
        return { text: "Hold", color: "text-purple-600", bgColor: "bg-purple-100" };
      case "exhale":
        return { text: "Breathe Out", color: "text-green-600", bgColor: "bg-green-100" };
      default:
        return { text: "Ready", color: "text-gray-600", bgColor: "bg-gray-100" };
    }
  };
  
  const getMeditationSteps = () => {
    if (!currentSession) return [];
    
    switch (currentSession.title) {
      case "Body Scan Meditation":
        return [
          "Find a comfortable position and close your eyes",
          "Take 3 deep breaths to center yourself",
          "Focus on your toes - feel any sensations there",
          "Slowly move your attention up your legs",
          "Notice your abdomen and chest rising with each breath",
          "Feel your shoulders and arms relax",
          "Focus on your neck and head",
          "Scan your entire body from head to toe",
          "Take 3 more deep breaths and open your eyes"
        ];
      case "Sleep Preparation":
        return [
          "Lie down in your sleep position",
          "Take 5 slow, deep breaths",
          "Tense and relax your toes 3 times",
          "Feel your legs become heavy and relaxed",
          "Let your arms sink into the mattress",
          "Release tension from your shoulders",
          "Relax your face and jaw muscles",
          "Imagine a peaceful scene",
          "Drift into peaceful sleep"
        ];
      case "Anxiety Relief":
        return [
          "Sit comfortably and place your hands on your lap",
          "Take 4 deep breaths - inhale for 4, hold for 4, exhale for 4",
          "Notice where you feel tension in your body",
          "Breathe into those areas and release the tension",
          "Repeat: 'I am safe, I am calm, I am breathing'",
          "Focus on the present moment - what do you see, hear, feel?",
          "Take 3 more calming breaths",
          "Feel the anxiety melting away",
          "Return to your day feeling lighter"
        ];
      case "Gratitude Practice":
        return [
          "Sit comfortably and close your eyes",
          "Take 3 deep breaths to center yourself",
          "Think of 3 things you're grateful for today",
          "Feel the warmth of gratitude in your heart",
          "Think of someone who has helped you recently",
          "Send them loving thoughts and appreciation",
          "Reflect on a challenge you've overcome",
          "Feel grateful for your strength and resilience",
          "Take 3 more breaths and open your eyes with gratitude"
        ];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
       {/* Dashboard Back Button */}
      <div className="mb-4">
        <a href="/dashboard">
          <button className="flex items-center space-x-2 bg-transparent hover:bg-[#d946ef] active:bg-[#a21caf] text-[#d946ef] hover:text-white active:text-white font-bold rounded-xl px-6 py-3 shadow transition-all" style={{border: 'none'}}>
            <span className="mr-2" style={{display: 'inline-block'}}>&#8592;</span>
            <span>Dashboard</span>
          </button>
        </a>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Meditation & Wellness
        </h1>
        <p className="text-xl text-muted-foreground">
          Take a moment to breathe, reflect, and find your center
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
                 {/* Session List */}
         <div className="space-y-4">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-semibold">Available Sessions</h2>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setShowHistory(!showHistory)}
               className="text-sm"
             >
               {showHistory ? "Hide History" : `Show History (${completedSessions.length})`}
             </Button>
           </div>
          
                     {/* History Section */}
           {showHistory && (
             <Card className="mb-6 p-4 bg-green-50 border-green-200">
               <div className="space-y-3">
                 <h3 className="font-semibold text-green-800 mb-3">📊 Your Meditation History</h3>
                 {completedSessions.length === 0 ? (
                   <p className="text-sm text-green-700">No sessions completed yet. Start your first meditation!</p>
                 ) : (
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                     {completedSessions.slice(-5).reverse().map((session) => (
                       <div key={session.id} className="flex items-center justify-between p-2 bg-green-100 rounded text-sm">
                         <div>
                           <span className="font-medium text-green-800">{session.sessionTitle}</span>
                           <span className="text-green-600 ml-2">({session.duration}m)</span>
                         </div>
                         <div className="text-green-600 text-xs">
                           {new Date(session.completedAt).toLocaleDateString()}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 <div className="text-xs text-green-600">
                   Total sessions: {completedSessions.length} | 
                   Total time: {completedSessions.reduce((sum, s) => sum + s.duration, 0)} minutes
                 </div>
               </div>
             </Card>
           )}
           
           {/* Demo Section */}
           <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">🎯 How It Works - Quick Demo</h3>
              <p className="text-sm text-blue-700 mb-3">
                Click "Mindful Breathing" to see the breathing exercise in action!
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-blue-100 p-2 rounded">
                  <div className="font-bold text-blue-600">↗</div>
                  <div>Breathe In</div>
                  <div className="text-blue-500">4 seconds</div>
                </div>
                <div className="bg-purple-100 p-2 rounded">
                  <div className="font-bold text-purple-600">●</div>
                  <div>Hold</div>
                  <div className="text-purple-500">2 seconds</div>
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <div className="font-bold text-green-600">↘</div>
                  <div>Breathe Out</div>
                  <div className="text-green-500">4 seconds</div>
                </div>
              </div>
            </div>
          </Card>
          
          {meditationSessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
              onClick={() => startSession(session)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {session.category === "meditation" && <Sparkles className="w-4 h-4 text-purple-500" />}
                    {session.category === "breathing" && <Heart className="w-4 h-4 text-blue-500" />}
                    {session.category === "sleep" && <Timer className="w-4 h-4 text-indigo-500" />}
                    <span className="text-sm text-muted-foreground">{session.duration}m</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{session.description}</p>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Player */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Current Session</h2>
          
          {currentSession ? (
            <Card className="p-6">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{currentSession.title}</CardTitle>
                <p className="text-muted-foreground">{currentSession.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Breathing Exercise Display */}
                {currentSession.type === "breathing" && (
                  <div className="text-center">
                    <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-4 transition-all duration-1000 ${
                      getBreathingInstructions().bgColor
                    }`}>
                      <span className={getBreathingInstructions().color}>
                        {breathingPhase === "inhale" ? "↗" : breathingPhase === "hold" ? "●" : "↘"}
                      </span>
                    </div>
                    <p className={`text-xl font-semibold ${getBreathingInstructions().color}`}>
                      {getBreathingInstructions().text}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Breath count: {breathingCount}
                    </p>
                    
                                         {/* Step-by-step explanation */}
                     <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                       <h4 className="font-semibold text-sm mb-2">📖 What's Happening:</h4>
                       <div className="text-xs text-muted-foreground space-y-1">
                         <p>• <strong>Follow the circle:</strong> It changes color and size to guide your breathing</p>
                         <p>• <strong>Breathe slowly:</strong> Match your breath to the visual cues</p>
                         <p>• <strong>Stay focused:</strong> Watch the circle and count your breaths</p>
                         <p>• <strong>Relax:</strong> This activates your body's natural relaxation response</p>
                       </div>
                     </div>
                     
                     {/* Current Phase Indicator */}
                     <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                       <div className="text-center">
                         <p className="text-xs font-medium text-blue-700 mb-1">Current Phase:</p>
                         <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                           breathingPhase === "inhale" ? "bg-blue-100 text-blue-700" :
                           breathingPhase === "hold" ? "bg-purple-100 text-purple-700" :
                           "bg-green-100 text-green-700"
                         }`}>
                           {breathingPhase === "inhale" ? "🫁 Inhale" : 
                            breathingPhase === "hold" ? "⏸️ Hold" : 
                            "💨 Exhale"}
                         </div>
                       </div>
                     </div>
                  </div>
                )}

                                 {/* Timer Display */}
                 {currentSession.type !== "breathing" && (
                   <div className="text-center space-y-6">
                     {/* Timeline Bar - Always Visible */}
                     <div>
                       <div className="text-6xl font-bold text-primary mb-4">
                         {formatTime(duration - currentTime)}
                       </div>
                       <Progress 
                         value={(currentTime / duration) * 100} 
                         className="w-full h-3"
                       />
                       <p className="text-sm text-muted-foreground mt-2">
                         Session Progress
                       </p>
                     </div>
                     
                                           {/* Guided Meditation Steps */}
                      {currentSession.type === "guided" && meditationStep < getMeditationSteps().length && (
                        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                          <div className="text-2xl font-bold text-purple-600 mb-4">
                            Step {meditationStep + 1} of {getMeditationSteps().length}
                          </div>
                          
                          {/* Step Timer */}
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold text-purple-700">
                              {stepTimeLeft}s
                            </div>
                            <p className="text-sm text-purple-600">Time left in this step</p>
                          </div>
                          
                          <p className="text-xl font-semibold text-purple-800 mb-4">
                            {getMeditationSteps()[meditationStep]}
                          </p>
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                          </div>
                          <div className="text-sm text-muted-foreground mt-3">
                            <p>Take your time with each step. There's no rush.</p>
                          </div>
                        </div>
                      )}
                     
                     {/* Session Type Info */}
                     {currentSession.type === "guided" && meditationStep >= getMeditationSteps().length && (
                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                         <p className="text-sm text-blue-700">
                           ✨ Guided portion complete. Continue meditating in silence.
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={skipBackward}
                    className="w-12 h-12 rounded-full"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={skipForward}
                    className="w-12 h-12 rounded-full"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={([value]) => {
                      setVolume(value);
                      setIsMuted(value === 0);
                    }}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>

                {/* Session Info */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Session Type: {currentSession.type}</p>
                  <p>Duration: {currentSession.duration} minutes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Active Session</h3>
                <p>Select a session from the left to begin your wellness journey</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeditationPlayer;
