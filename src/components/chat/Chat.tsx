import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, User, Loader, Mic, MicOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../../lib/config';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId] = useState(() => localStorage.getItem('chatUserId') || uuidv4());
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('chatUserId', userId);
    loadChatHistory();
    checkConnection();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/health`);
      const data = await response.json();
      setIsConnected(data.success);
    } catch {
      setIsConnected(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/history?user_id=${userId}`);
      const data = await response.json();
      if (data.success) setMessages(data.messages);
    } catch {
      // Silent fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = input.trim();
    setInput('');
    setError(null);

    const newUserMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, user_id: userId }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const newAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/chat/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      setMessages([]);
    } catch {
      setError('Failed to clear chat');
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <Bot className="avatar-icon" />
              </div>
              <div>
                <h1 className="font-semibold text-pink-900">DermAI Assistant</h1>
                <p className="text-xs text-gray-500">
                  {isConnected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <button onClick={clearChat} className="btn-ghost text-gray-400" title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat */}
        <div className="card mb-4">
          <div className="h-[55vh] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="empty-state">
                <Bot className="empty-state-icon" />
                <p className="empty-state-title">Start a conversation</p>
                <p className="empty-state-text">Ask me anything about skin health</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'assistant' ? 'bg-pink-100' : 'bg-pink-500'
                      }`}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 text-pink-600" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl text-sm ${message.role === 'user'
                        ? 'bg-pink-600 text-white rounded-tr-none shadow-sm whitespace-pre-wrap'
                        : 'bg-white border border-pink-100/80 text-gray-800 rounded-tl-none shadow-sm'
                      }`}>
                      {message.role === 'user' ? (
                        message.content
                      ) : (
                        <div className="space-y-2 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ ...props }) => <h1 className="text-lg font-bold text-pink-900 mt-3 mb-2 border-b border-pink-100 pb-1" {...props} />,
                              h2: ({ ...props }) => <h2 className="text-base font-bold text-pink-900 mt-3 mb-1.5 border-b border-pink-100 pb-1" {...props} />,
                              h3: ({ ...props }) => <h3 className="text-sm font-bold text-pink-900 mt-3 mb-1 flex items-center gap-1.5" {...props} />,
                              h4: ({ ...props }) => <h4 className="text-sm font-semibold text-gray-900 mt-2 mb-1" {...props} />,
                              p: ({ ...props }) => <p className="mb-2 text-gray-700 last:mb-0 leading-normal" {...props} />,
                              ul: ({ ...props }) => <ul className="list-disc pl-5 my-2 space-y-1 text-gray-700" {...props} />,
                              ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-gray-700" {...props} />,
                              li: ({ ...props }) => <li className="text-gray-700 leading-snug" {...props} />,
                              strong: ({ ...props }) => <strong className="font-semibold text-pink-950" {...props} />,
                              table: ({ ...props }) => (
                                <div className="overflow-x-auto my-3 rounded-lg border border-pink-200">
                                  <table className="w-full text-xs text-left divide-y divide-pink-200" {...props} />
                                </div>
                              ),
                              thead: ({ ...props }) => <thead className="bg-pink-50/80" {...props} />,
                              th: ({ ...props }) => <th className="px-3 py-2 text-xs font-semibold text-pink-900" {...props} />,
                              td: ({ ...props }) => <td className="px-3 py-2 text-xs border-t border-pink-100 text-gray-700 align-top" {...props} />,
                              hr: ({ ...props }) => <hr className="my-3 border-pink-100" {...props} />,
                              blockquote: ({ ...props }) => (
                                <blockquote className="border-l-4 border-pink-400 pl-3 italic text-gray-600 my-2 bg-pink-50/60 py-1.5 rounded-r" {...props} />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-pink-600" />
                    </div>
                    <div className="bg-pink-50 px-4 py-2.5 rounded-lg flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin text-pink-500" />
                      <span className="text-sm text-pink-600">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-pink-100 flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type your message..."}
                className={`input pr-10 ${isListening ? 'border-pink-500 ring-1 ring-pink-500' : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded ${isListening ? 'text-pink-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={isLoading || !input.trim()} className="btn-primary">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}