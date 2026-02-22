import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, X, Bot, User, AlertCircle, Settings } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

type ApiProvider = "openai" | "grok";

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Hello! I'm Mindful Buddy, your AI companion for mental wellness. How are you feeling today? 💙",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [apiProvider, setApiProvider] = useState<ApiProvider>("openai");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load API key and provider from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("ai_api_key");
    const savedProvider = localStorage.getItem("ai_api_provider") as ApiProvider;
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiProvider(savedProvider || "openai");
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleApiKeySubmit = (key: string, provider: ApiProvider) => {
    if (key.trim()) {
      setApiKey(key.trim());
      setApiProvider(provider);
      localStorage.setItem("ai_api_key", key.trim());
      localStorage.setItem("ai_api_provider", provider);
      setShowApiKeyInput(false);
      
      // Clear chat history and start fresh with new API key
      setMessages([
        {
          id: generateId(),
          sender: "bot",
          text: "Hello! I'm Mindful Buddy, your AI companion for mental wellness. How are you feeling today? 💙",
          timestamp: new Date()
        }
      ]);
    }
  };

  const callOpenAI = async (conversationHistory: any[], currentInput: string) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are Mindful Buddy, a compassionate AI mental health companion. Your role is to:

1. Provide empathetic, supportive responses to users sharing their feelings
2. Use therapeutic communication techniques like active listening and validation
3. Offer gentle coping strategies and mindfulness techniques when appropriate
4. Always maintain a warm, caring tone with emojis like 💙 🌟 ✨
5. Ask follow-up questions to encourage deeper reflection
6. Remind users that you're not a substitute for professional help
7. Focus on emotional support, validation, and gentle guidance
8. Keep responses conversational and not too long (2-3 sentences max)

Remember: You're here to listen, validate feelings, and provide gentle support. Never give medical advice.`
          },
          ...conversationHistory
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't process that right now. Can you try rephrasing?";
  };

  const callGrok = async (conversationHistory: any[], currentInput: string) => {
    try {
      // Try the official Grok API endpoint
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: `You are Mindful Buddy, a compassionate AI mental health companion. Your role is to:

1. Provide empathetic, supportive responses to users sharing their feelings
2. Use therapeutic communication techniques like active listening and validation
3. Offer gentle coping strategies and mindfulness techniques when appropriate
4. Always maintain a warm, caring tone with emojis like 💙 🌟 ✨
5. Ask follow-up questions to encourage deeper reflection
6. Remind users that you're not a substitute for professional help
7. Focus on emotional support, validation, and gentle guidance
8. Keep responses conversational and not too long (2-3 sentences max)

Remember: You're here to listen, validate feelings, and provide gentle support. Never give medical advice.`
            },
            ...conversationHistory
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from Grok');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I'm sorry, I couldn't process that right now. Can you try rephrasing?";
    } catch (error) {
      // If Grok API fails, provide a helpful fallback response
      console.warn('Grok API failed, using fallback response:', error);
      
      // Generate a contextual response based on the user's message
      const userMessage = currentInput.toLowerCase();
      
      if (userMessage.includes('sad') || userMessage.includes('depressed') || userMessage.includes('down')) {
        return "I'm sorry you're feeling down. It's completely normal to have difficult days. What's one thing that usually helps lift your spirits, even just a little? 💙";
      }
      if (userMessage.includes('anxious') || userMessage.includes('worried') || userMessage.includes('stress')) {
        return "Anxiety can be really overwhelming. Let's take a deep breath together. Inhale for 4 counts, hold for 4, exhale for 4. What's causing you the most worry right now?";
      }
      if (userMessage.includes('angry') || userMessage.includes('frustrated') || userMessage.includes('mad')) {
        return "It's okay to feel angry - that's a valid emotion. Sometimes anger can be a sign that something important to us has been affected. What's behind these feelings?";
      }
      if (userMessage.includes('tired') || userMessage.includes('exhausted') || userMessage.includes('burnout')) {
        return "It sounds like you're really worn out. Rest is not a luxury, it's a necessity. What would help you feel more rested and recharged?";
      }
      if (userMessage.includes('happy') || userMessage.includes('good') || userMessage.includes('great')) {
        return "That's wonderful! I'm so glad you're feeling good today. What's contributing to this positive mood? It's great to celebrate the good moments! 🌟";
      }
      
      // Default supportive response
      const fallbackResponses = [
        "I hear you, and your feelings are valid. Can you tell me more about what's on your mind? 💙",
        "Thank you for sharing that with me. It takes courage to open up. How can I support you right now?",
        "I'm here to listen. Sometimes just talking about our feelings can help us process them better.",
        "That sounds challenging. Remember, it's okay to not be okay. What would be most helpful for you right now?",
        "I appreciate you trusting me with this. Let's work through this together. What's one small step you could take?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      if (!apiKey) {
        throw new Error("API key not configured");
      }

      // Prepare conversation history for AI
      const conversationHistory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // Add the current user message
      conversationHistory.push({
        role: 'user',
        content: currentInput
      });

      let botResponse: string;

      if (apiProvider === "openai") {
        botResponse = await callOpenAI(conversationHistory, currentInput);
      } else {
        botResponse = await callGrok(conversationHistory, currentInput);
      }
      
      const botMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = "I'm having trouble connecting right now. Please try again in a moment. 💙";
      
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "Please configure your AI API key to start chatting with me! 🔑";
          setShowApiKeyInput(true);
        } else if (error.message.includes("rate limit")) {
          errorMessage = "I'm getting too many requests right now. Please wait a moment and try again. ⏳";
        } else if (error.message.includes("quota")) {
          errorMessage = "I've reached my usage limit. Please check your account or try switching to a different AI provider. 💳";
        } else if (error.message.includes("Failed to get response")) {
          errorMessage = `Connection to ${apiProvider === 'openai' ? 'OpenAI' : 'Grok'} failed. Please check your API key or try switching providers. 🔌`;
        }
      }
      
      const errorBotMessage: Message = {
        id: generateId(),
        sender: "bot",
        text: errorMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg z-50"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-96 h-[500px] shadow-2xl rounded-2xl flex flex-col z-50 border-0 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5" />
            <CardTitle className="text-lg font-semibold">Mindful Buddy 🤖</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-blue-100 mt-1">Your AI companion for mental wellness</p>
      </CardHeader>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {showApiKeyInput ? (
          <div className="flex-1 p-4 flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Setup Required</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              To use Mindful Buddy, you need to provide an AI API key. 
              Choose your preferred provider below.
            </p>
            
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select AI Provider:</label>
                <div className="flex space-x-2">
                  <Button
                    variant={apiProvider === "openai" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setApiProvider("openai")}
                    className="flex-1"
                  >
                    OpenAI
                  </Button>
                  <Button
                    variant={apiProvider === "grok" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setApiProvider("grok")}
                    className="flex-1"
                  >
                    Grok
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {apiProvider === "openai" ? "OpenAI" : "Grok"} API Key:
                </label>
                <Input
                  type="password"
                  placeholder={`Enter your ${apiProvider === "openai" ? "OpenAI" : "Grok"} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button 
                onClick={() => handleApiKeySubmit(apiKey, apiProvider)}
                disabled={!apiKey.trim()}
                className="w-full"
              >
                Save API Key
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
              <p>
                {apiProvider === "openai" ? (
                  <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">OpenAI Platform</a></>
                ) : (
                  <>Get your API key from <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Grok Console</a></>
                )}
              </p>
              <p>You can switch providers anytime using the ⚙️ button</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-3 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === "user" 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-200 text-gray-700"
                      }`}>
                        {message.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t bg-gray-50 rounded-b-2xl p-4 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Share how you're feeling..."
                  className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">
                    This is not a substitute for professional medical advice
                  </p>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {apiProvider === "openai" ? "OpenAI" : "Grok"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeyInput(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 p-1 h-6"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default Chatbot;
