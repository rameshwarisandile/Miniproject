import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MoodTracker from "./pages/MoodTracker";
import MoodScanner from "./pages/MoodScanner";
import MoodToArt from "./pages/MoodToArt";
import MindGut from "./pages/MindGut";
import MeditationPlayer from "./components/ui/MeditationPlayer";
import WellnessJournal from "./components/ui/WellnessJournal";
import WellnessAnalytics from "./components/ui/WellnessAnalytics";
import CrisisSupport from "./components/ui/CrisisSupport";
import WellnessReminderScheduler from "./components/ui/WellnessReminderScheduler";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WellnessReminderScheduler />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/mood-scanner" element={<MoodScanner />} />
          <Route path="/mood-to-art" element={<MoodToArt />} />
          <Route path="/mind-gut" element={<MindGut />} />
          <Route path="/meditation" element={<MeditationPlayer />} />
          <Route path="/journal" element={<WellnessJournal />} />
          <Route path="/analytics" element={<WellnessAnalytics />} />
          <Route path="/crisis-support" element={<CrisisSupport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
