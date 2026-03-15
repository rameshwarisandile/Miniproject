import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Loader2, Send, X, Bot, User } from "lucide-react";


interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

const Chatbot = () => {

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I'm Mindful Buddy 🤖 How are you feeling today? 💙",
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const generateId = () => Math.random().toString(36).substring(7);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: input,
      timestamp: new Date()
    };
    // LocalStorage: user-specific
    const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
    const userId = loggedInUser?.id || loggedInUser?._id || null;
    let allChats = JSON.parse(localStorage.getItem("allChatMessages") || '{}');
    if (!userId) return;
    if (!allChats[userId]) allChats[userId] = [];
    allChats[userId] = [...allChats[userId], userMessage];
    localStorage.setItem("allChatMessages", JSON.stringify(allChats));
    setMessages(prev => [...prev, userMessage]);
    const userText = input;
    setInput("");
    setIsLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        await axios.post("/api/chats", { message: userText }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      // Change /ask to /api/ask for proxy compatibility
      const response = await axios.post("/api/ask", { message: userText });
      const botMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: response.data.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      // LocalStorage: Save bot reply
      allChats[userId] = [...allChats[userId], botMessage];
      localStorage.setItem("allChatMessages", JSON.stringify(allChats));
      // Backend: Save bot reply
      if (token) {
        await axios.post("/api/chats", { message: userText, reply: response.data.reply }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      const botMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: "⚠️ Server connection error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      allChats[userId] = [...allChats[userId], botMessage];
      localStorage.setItem("allChatMessages", JSON.stringify(allChats));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  useEffect(() => {
    // On every login, always reset chat for this user if new user (no data)
    const loggedInUser = JSON.parse(localStorage.getItem("backendUser") || '{}');
    const userId = loggedInUser?.id || loggedInUser?._id || null;
    let allChats = JSON.parse(localStorage.getItem("allChatMessages") || '{}');
    if (userId && (!allChats[userId] || allChats[userId].length === 0)) {
      allChats[userId] = [
        {
          id: "1",
          sender: "bot",
          text: "Hello! I'm Mindful Buddy 🤖 How are you feeling today? 💙",
          timestamp: new Date()
        }
      ];
      localStorage.setItem("allChatMessages", JSON.stringify(allChats));
      setMessages(allChats[userId]);
    } else if (userId && allChats[userId]) {
      setMessages(allChats[userId]);
    } else {
      setMessages([
        {
          id: "1",
          sender: "bot",
          text: "Hello! I'm Mindful Buddy 🤖 How are you feeling today? 💙",
          timestamp: new Date()
        }
      ]);
    }
  }, [localStorage.getItem("backendUser")]);

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
            <Bot className="w-5 h-5"/>
            <CardTitle className="text-lg font-semibold">Mindful Buddy <span role="img" aria-label="robot">🤖</span></CardTitle>
          </div>
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="ml-auto">
            <X className="w-5 h-5 text-white"/>
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

              <div className={`w-8 h-8 rounded-full flex items-center justify-center
              ${msg.sender === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"}`}>

                {msg.sender === "user"
                  ? <User className="w-4 h-4"/>
                  : <Bot className="w-4 h-4"/>}

              </div>

              <div className={`rounded-2xl px-4 py-2
              ${msg.sender === "user"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-800"}`}>

                <div className="text-sm">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

              </div>

            </div>

          </div>

        ))}

        {isLoading && (

          <div className="flex items-center gap-2">

            <Bot className="w-4 h-4 text-gray-500"/>

            <Loader2 className="w-4 h-4 animate-spin text-gray-500"/>

            <span className="text-sm text-gray-500">
              Thinking...
            </span>

          </div>

        )}

      </ScrollArea>

      <div className="p-4 border-t flex gap-2">

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask something..."
        />

        <Button
          onClick={handleSend}
          disabled={isLoading}
        >
          <Send className="w-4 h-4"/>
        </Button>

      </div>

    </Card>

  );
};

export default Chatbot;