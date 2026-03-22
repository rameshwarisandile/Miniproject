import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, Bot, User, Mic, MicOff } from "lucide-react";

// --- TypeScript: SpeechRecognition typings for cross-browser support ---
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type SpeechRecognitionType = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const LANGUAGE = "en-US";

const Chatbot: React.FC = () => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I'm Mindful Buddy 🤖 How are you feeling today? 💙",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // --- Voice Output (Text-to-Speech) ---
  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE;
    window.speechSynthesis.speak(utterance);
  }, []);

  // --- Send message to backend and handle response ---
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;
      setIsLoading(true);
      setInput("");
      setError(null);

      const userMessage: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // LocalStorage: user-specific
      const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
      const userId = loggedInUser?.id || loggedInUser?._id || null;
      let allChats = JSON.parse(localStorage.getItem("allChatMessages") || '{}');
      if (userId) {
        if (!allChats[userId]) allChats[userId] = [];
        allChats[userId] = [...allChats[userId], userMessage];
        localStorage.setItem("allChatMessages", JSON.stringify(allChats));
      }

      try {
        const token = localStorage.getItem("jwtToken");
        if (token) {
          await axios.post("/api/chats", { message: text }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        const response = await axios.post("/api/ask", { message: text });
        const botMessage: Message = {
          id: Math.random().toString(36).substring(7),
          sender: "bot",
          text: response.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        // LocalStorage: Save bot reply
        if (userId) {
          allChats[userId] = [...allChats[userId], botMessage];
          localStorage.setItem("allChatMessages", JSON.stringify(allChats));
        }
        // Backend: Save bot reply
        if (token) {
          await axios.post("/api/chats", { message: text, reply: response.data.reply }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        // Speak bot response
        speakText(botMessage.text);
      } catch (error) {
        const botMessage: Message = {
          id: Math.random().toString(36).substring(7),
          sender: "bot",
          text: "⚠️ Server connection error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        if (userId) {
          allChats[userId] = [...allChats[userId], botMessage];
          localStorage.setItem("allChatMessages", JSON.stringify(allChats));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, speakText]
  );

  // --- Voice Input (SpeechRecognition) ---
  const getSpeechRecognition = (): SpeechRecognition | null => {
    const SpeechRecognition: SpeechRecognitionType =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    return new SpeechRecognition();
  };

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
    }
    const recognition = getSpeechRecognition();
    if (!recognition) {
      setError("Voice not supported in this browser");
      return;
    }
    recognitionRef.current = recognition;
    recognition.lang = LANGUAGE;
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      console.log("[SpeechRecognition] onstart");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
      console.log("[SpeechRecognition] onresult", finalTranscript + interimTranscript);

      // Only send on final result, and only once
      if (
        finalTranscript &&
        event.results[event.results.length - 1].isFinal &&
        isListeningRef.current
      ) {
        setIsListening(false);
        isListeningRef.current = false;
        setInput(finalTranscript.trim());
        sendMessage(finalTranscript.trim());
        recognition.stop();
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      isListeningRef.current = false;
      console.log("[SpeechRecognition] onerror", event.error);
      if (event.error === "no-speech") {
        setError("No speech detected, retrying...");
        setTimeout(() => {
          if (!isListeningRef.current) {
            startListening();
          }
        }, 600);
      } else if (event.error === "audio-capture") {
        setError("No microphone found. Please check your mic.");
      } else if (event.error === "not-allowed") {
        setError("Microphone permission denied.");
      } else {
        setError(`Mic error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      console.log("[SpeechRecognition] onend");
      // Only restart if user hasn't manually stopped
      if (isListeningRef.current) {
        setTimeout(() => {
          if (!isListeningRef.current) {
            startListening();
          }
        }, 600);
      }
    };

    try {
      recognition.start();
      console.log("[SpeechRecognition] start called");
    } catch (err) {
      setError("Could not start microphone.");
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [sendMessage]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.stop();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Handle Enter key for text input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  // UI rendering
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-blue-500 text-white shadow-lg"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-96 h-[500px] shadow-2xl flex flex-col rounded-xl">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <CardTitle className="text-lg font-semibold">
              Mindful Buddy <span role="img" aria-label="robot">🤖</span>
            </CardTitle>
          </div>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="ml-auto">
            <X className="w-5 h-5 text-white" />
          </Button>
        </div>
        <p className="text-sm text-blue-100 mt-1">Your AI companion for mental wellness</p>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center
                ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-2
                ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}
              >
                <div className="text-sm">{msg.text}</div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-gray-500" />
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-sm text-gray-500">Thinking...</span>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <Button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center justify-center ${isListening ? "bg-red-500 animate-pulse" : ""}`}
          title={isListening ? "Stop Listening" : "Start Voice Input"}
          disabled={isListening}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask something..."
          disabled={isLoading}
        />
        <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {isListening && (
        <div className="px-4 pb-2 text-xs text-red-500">Listening...</div>
      )}
      {error && <div className="px-4 pb-2 text-xs text-red-500">{error}</div>}
    </Card>
  );
};

export default Chatbot;