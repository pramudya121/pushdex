import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2, Sparkles, Trash2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { WolfLogo } from '@/components/WolfLogo';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pushdex-chat`;

const QUICK_PROMPTS = [
  { label: '🔄 How to swap?', message: 'How do I swap tokens on PushDex?' },
  { label: '💧 Add liquidity', message: 'How do I add liquidity and earn fees?' },
  { label: '🌾 Start farming', message: 'How does farming work on PushDex?' },
  { label: '⛓️ Push Chain', message: 'What is Push Chain and how is it different?' },
];

// Simple markdown-like renderer
const renderContent = (text: string) => {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
      return (
        <pre key={i} className="my-2 p-3 rounded-lg bg-background/80 border border-border/30 text-xs font-mono overflow-x-auto">
          <code>{code.trim()}</code>
        </pre>
      );
    }
    
    // Process inline formatting
    return part.split('\n').map((line, j) => {
      // Headers
      if (line.startsWith('### ')) return <h4 key={`${i}-${j}`} className="font-bold text-sm mt-2 mb-1 text-foreground">{line.slice(4)}</h4>;
      if (line.startsWith('## ')) return <h3 key={`${i}-${j}`} className="font-bold text-sm mt-2 mb-1 text-foreground">{line.slice(3)}</h3>;
      if (line.startsWith('# ')) return <h2 key={`${i}-${j}`} className="font-bold text-base mt-2 mb-1 text-foreground">{line.slice(2)}</h2>;
      
      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={`${i}-${j}`} className="flex gap-1.5 my-0.5">
            <span className="text-primary mt-0.5">•</span>
            <span>{formatInline(line.slice(2))}</span>
          </div>
        );
      }
      
      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch) {
        return (
          <div key={`${i}-${j}`} className="flex gap-1.5 my-0.5">
            <span className="text-primary font-medium min-w-[1.2em]">{numMatch[1]}.</span>
            <span>{formatInline(line.slice(numMatch[0].length))}</span>
          </div>
        );
      }
      
      if (line.trim() === '') return <div key={`${i}-${j}`} className="h-1.5" />;
      
      return <p key={`${i}-${j}`} className="my-0.5">{formatInline(line)}</p>;
    });
  });
};

const formatInline = (text: string): React.ReactNode => {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    // Inline code
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={`${i}-${j}`} className="px-1 py-0.5 rounded bg-background/60 text-primary text-xs font-mono">{cp.slice(1, -1)}</code>;
      }
      return cp;
    });
  });
};

export const AIChatBot: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const streamChat = useCallback(async (userMessage: string, allMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        message: userMessage,
        history: allMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        toast.error('Rate limit reached. Please wait a moment.');
        throw new Error('Rate limited');
      }
      if (resp.status === 402) {
        toast.error('AI credits exhausted.');
        throw new Error('Payment required');
      }
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to get response');
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Add assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: assistantContent };
              }
              return updated;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Finalize streaming
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      await streamChat(text, [...messages, userMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, streamChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-[gradient-shift_3s_ease_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-ping opacity-30" />
            </button>
            {/* Status dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-background shadow-sm">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={cn(
              "fixed z-50 overflow-hidden",
              "bg-card/95 backdrop-blur-2xl",
              "border border-border/40",
              "rounded-2xl shadow-2xl shadow-black/30",
              isMinimized
                ? "bottom-20 lg:bottom-6 right-4 lg:right-6 w-72 h-14"
                : "bottom-20 lg:bottom-6 right-4 lg:right-6 w-[380px] h-[560px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
            )}
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              {/* Header gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                      <WolfLogo size={20} />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border border-card" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      PushDex AI
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-medium text-primary">
                        PRO
                      </span>
                    </h3>
                    {!isMinimized && (
                      <p className="text-[11px] text-muted-foreground">Powered by Gemini • Always online</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {hasMessages && !isMinimized && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive"
                      onClick={clearChat}
                      title="Clear chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 h-[430px]" ref={scrollAreaRef}>
                  <div className="p-4 space-y-1">
                    {/* Welcome state */}
                    {!hasMessages && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-6 space-y-5"
                      >
                        <div className="relative inline-block">
                          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
                            <WolfLogo size={36} />
                          </div>
                          <motion.div
                            className="absolute -inset-2 rounded-3xl border border-primary/10"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1">Welcome to PushDex AI</h3>
                          <p className="text-sm text-muted-foreground max-w-[260px] mx-auto">
                            Your intelligent DeFi assistant. Ask me anything about trading, liquidity, and Push Chain.
                          </p>
                        </div>
                        
                        {/* Quick prompts */}
                        <div className="grid grid-cols-2 gap-2 px-2">
                          {QUICK_PROMPTS.map((prompt) => (
                            <button
                              key={prompt.label}
                              onClick={() => sendMessage(prompt.message)}
                              className="text-left px-3 py-2.5 rounded-xl bg-surface/80 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-xs text-muted-foreground hover:text-foreground active:scale-95"
                            >
                              {prompt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Messages */}
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex gap-2.5 py-2",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[82%] px-3.5 py-2.5 text-[13px] leading-relaxed",
                            msg.role === 'user'
                              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                              : "bg-surface/80 border border-border/30 rounded-2xl rounded-bl-md"
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose-sm">
                              {renderContent(msg.content)}
                              {msg.isStreaming && (
                                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 rounded-full align-middle" />
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5 text-accent" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2.5 py-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="bg-surface/80 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border/30 bg-card/50">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask PushDex AI..."
                        rows={1}
                        className={cn(
                          "w-full resize-none rounded-xl px-4 py-2.5 text-sm",
                          "bg-surface/80 border border-border/40",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                          "placeholder:text-muted-foreground/50",
                          "transition-all duration-200",
                          "max-h-[80px] scrollbar-hide"
                        )}
                        disabled={isLoading}
                        style={{ minHeight: '40px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = '40px';
                          target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-xl transition-all duration-200",
                        input.trim()
                          ? "bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95"
                          : "bg-muted"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                    PushDex AI can make mistakes. Verify important info.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

AIChatBot.displayName = 'AIChatBot';
