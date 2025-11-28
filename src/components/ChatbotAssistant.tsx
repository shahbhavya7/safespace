import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, Smile, Frown, Meh, Bot, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  quickActions?: Array<{ label: string; action: string }>;
}

interface ChatbotResponse {
  success: boolean;
  reply: string;
  intent: string;
  mood: 'happy' | 'neutral' | 'upset' | 'frustrated' | 'confused';
  suggestions?: string[];
  quickActions?: Array<{ label: string; action: string }>;
}

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I\'m your SafeSpace assistant. I\'m here to help you stay safe and feel supported. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        'Show me safety features',
        'I need wellness support',
        'How do I use this app?',
        'I want to report an issue'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<'happy' | 'neutral' | 'upset' | 'frustrated' | 'confused'>('neutral');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMoodIcon = () => {
    switch (currentMood) {
      case 'happy':
        return <Smile className="h-4 w-4 text-green-600" />;
      case 'upset':
      case 'frustrated':
        return <Frown className="h-4 w-4 text-red-600" />;
      case 'confused':
        return <Meh className="h-4 w-4 text-yellow-600" />;
      default:
        return <Meh className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMoodLabel = () => {
    switch (currentMood) {
      case 'happy':
        return 'Positive';
      case 'upset':
        return 'Needs Support';
      case 'frustrated':
        return 'Frustrated';
      case 'confused':
        return 'Seeking Help';
      default:
        return 'Neutral';
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputMessage.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call chatbot API
      const response = await fetch('http://localhost:5001/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data: ChatbotResponse = await response.json();

      if (data.success) {
        // Update mood
        setCurrentMood(data.mood);

        // Add bot response
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
          suggestions: data.suggestions,
          quickActions: data.quickActions
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Failed to connect', {
        description: 'Could not reach chatbot service. Please try again.'
      });

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    console.log('🔵 Quick Action clicked:', action);
    
    toast.success('Navigating...', {
      description: `Taking you to ${action}`
    });
    
    // Close chat and navigate
    setIsOpen(false);
    
    // Use setTimeout to ensure state updates before navigation
    setTimeout(() => {
      console.log('🔵 Navigating to:', action);
      navigate(action);
    }, 100);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="h-6 w-6 group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          💬
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] shadow-2xl">
      <Card className="h-[600px] max-h-[80vh] flex flex-col bg-white">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">SafeSpace Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Mood Indicator */}
          <div className="flex items-center space-x-2 mt-2 bg-white/20 rounded-full px-3 py-1 w-fit">
            {getMoodIcon()}
            <span className="text-xs font-medium">Mood: {getMoodLabel()}</span>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'bot' && (
                      <Bot className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    {message.sender === 'user' && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 ml-6 space-y-2">
                  <p className="text-xs text-gray-500">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs h-auto py-1 px-2 bg-white hover:bg-blue-50"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {message.quickActions && message.quickActions.length > 0 && (
                <div className="mt-2 ml-6 space-y-2">
                  <p className="text-xs text-gray-500">Quick Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.quickActions.map((action, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        onClick={() => handleQuickAction(action.action)}
                        className="text-xs h-auto py-1 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-4 border-t bg-white rounded-b-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex space-x-2"
          >
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
