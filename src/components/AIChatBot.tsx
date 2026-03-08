import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Send, Loader2, Bot, User, Minimize2, Maximize2, Sparkles, Trash2, Copy, Check, RefreshCw, ExternalLink, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { WolfLogo } from '@/components/WolfLogo';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp?: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pushdex-chat`;

const QUICK_PROMPTS = [
  { message: 'How do I swap tokens on PushDex?', icon: '🔄', label: 'How to swap' },
  { message: 'How do I add liquidity and earn fees?', icon: '💧', label: 'Add liquidity' },
  { message: 'How does farming work on PushDex?', icon: '🌾', label: 'Start farming' },
  { message: 'How does the airdrop system work?', icon: '🪂', label: 'Airdrop guide' },
  { message: 'What is Push Chain and how is it different?', icon: '⛓️', label: 'Push Chain' },
  { message: 'How do I stake tokens for rewards?', icon: '🪙', label: 'Staking' },
  { message: 'Explain impermanent loss with examples', icon: '📉', label: 'IL explained' },
  { message: 'What tokens are supported on PushDex?', icon: '🪙', label: 'Token list' },
];

// Suggested follow-up prompts based on context
const getSuggestedFollowUps = (lastAssistantMsg: string): string[] => {
  const lower = lastAssistantMsg.toLowerCase();
  if (lower.includes('swap')) return ['What is slippage?', 'How to set slippage?', 'Show me token list'];
  if (lower.includes('liquidity')) return ['What is impermanent loss?', 'How to farm LP tokens?', 'Best pools to join'];
  if (lower.includes('farming') || lower.includes('farm')) return ['How to harvest rewards?', 'What is APR vs APY?', 'How to unstake LP tokens?'];
  if (lower.includes('airdrop')) return ['How to earn more points?', 'Explain the tier system', 'How does referral work?'];
  if (lower.includes('staking') || lower.includes('stake')) return ['What APR is available?', 'How to unstake?', 'Staking vs Farming?'];
  if (lower.includes('push chain') || lower.includes('network')) return ['How to add network?', 'Get testnet tokens', 'What wallets are supported?'];
  if (lower.includes('impermanent loss')) return ['How to minimize IL?', 'Best pairs for low IL', 'Is IL always bad?'];
  return ['How to start trading?', 'Explain DeFi basics', 'What makes PushDex unique?'];
};

// Detect links in text
const detectAndRenderLinks = (text: string): React.ReactNode => {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" 
           className="text-primary hover:underline inline-flex items-center gap-0.5">
          {part.length > 40 ? part.slice(0, 40) + '...' : part}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
    }
    return part;
  });
};

// Enhanced markdown renderer with link detection
const renderContent = (text: string) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const langMatch = part.match(/```(\w*)\n?/);
      const lang = langMatch?.[1] || '';
      const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
      return (
        <div key={i} className="my-3 rounded-xl overflow-hidden border border-border/30 group/code relative">
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/20">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{lang || 'code'}</span>
            <CodeCopyButton code={code.trim()} />
          </div>
          <pre className="p-3 bg-background/60 text-xs font-mono overflow-x-auto leading-relaxed">
            <code>{code.trim()}</code>
          </pre>
        </div>
      );
    }
    
    return part.split('\n').map((line, j) => {
      // Table support
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
        const isSeparator = cells.every(c => /^[-:]+$/.test(c));
        if (isSeparator) return null;
        return (
          <div key={`${i}-${j}`} className="flex gap-0 text-xs">
            {cells.map((cell, ci) => (
              <div key={ci} className="flex-1 px-2 py-1 border-b border-border/20 text-muted-foreground">
                {formatInline(cell)}
              </div>
            ))}
          </div>
        );
      }

      if (line.startsWith('### ')) return <h4 key={`${i}-${j}`} className="font-bold text-sm mt-3 mb-1.5 text-foreground flex items-center gap-1.5">{formatInline(line.slice(4))}</h4>;
      if (line.startsWith('## ')) return <h3 key={`${i}-${j}`} className="font-bold text-sm mt-3 mb-1.5 text-foreground">{formatInline(line.slice(3))}</h3>;
      if (line.startsWith('# ')) return <h2 key={`${i}-${j}`} className="font-bold text-base mt-3 mb-1.5 text-foreground">{formatInline(line.slice(2))}</h2>;
      
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={`${i}-${j}`} className="flex gap-2 my-0.5 pl-1">
            <span className="text-primary mt-0.5 text-xs shrink-0">●</span>
            <span className="flex-1">{formatInline(line.slice(2))}</span>
          </div>
        );
      }
      
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch) {
        return (
          <div key={`${i}-${j}`} className="flex gap-2 my-0.5 pl-1">
            <span className="text-primary font-semibold min-w-[1.4em] text-xs shrink-0">{numMatch[1]}.</span>
            <span className="flex-1">{formatInline(line.slice(numMatch[0].length))}</span>
          </div>
        );
      }

      // Blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={`${i}-${j}`} className="border-l-2 border-primary/40 pl-3 my-1.5 text-muted-foreground italic">
            {formatInline(line.slice(2))}
          </div>
        );
      }
      
      if (line.trim() === '') return <div key={`${i}-${j}`} className="h-2" />;
      
      return <p key={`${i}-${j}`} className="my-0.5 leading-relaxed">{formatInline(line)}</p>;
    });
  });
};

const formatInline = (text: string): React.ReactNode => {
  // First handle links
  const linkParts = text.split(/(https?:\/\/[^\s)]+)/g);
  return linkParts.map((segment, si) => {
    if (segment.match(/^https?:\/\//)) {
      return (
        <a key={si} href={segment} target="_blank" rel="noopener noreferrer" 
           className="text-primary hover:underline inline-flex items-center gap-0.5 break-all">
          {segment.length > 35 ? segment.slice(0, 35) + '...' : segment}
          <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
        </a>
      );
    }
    // Then handle bold and inline code
    const parts = segment.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${si}-${i}`} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      const codeParts = part.split(/(`[^`]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return <code key={`${si}-${i}-${j}`} className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-mono border border-primary/10">{cp.slice(1, -1)}</code>;
        }
        return cp;
      });
    });
  });
};

// Code block copy button
const CodeCopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-1 rounded hover:bg-muted transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-[hsl(var(--success))]" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
};

// Message copy button
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted/50"
      title="Copy message"
    >
      {copied ? <Check className="w-3 h-3 text-[hsl(var(--success))]" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
};

// Typing indicator
const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-2.5 py-2"
  >
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <Zap className="w-4 h-4 text-primary" />
      </motion.div>
    </div>
    <div className="bg-surface/80 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
      <div className="flex gap-1.5 items-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-primary to-accent"
              animate={{ y: [0, -8, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <motion.span 
          className="text-[10px] text-muted-foreground ml-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          AI is thinking...
        </motion.span>
      </div>
    </div>
  </motion.div>
);

// Time formatter
const formatTime = (date?: Date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const AIChatBot: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) inputRef.current.focus();
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
        history: allMessages.slice(-14).map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) { toast.error('Rate limit reached. Please wait a moment.'); throw new Error('Rate limited'); }
      if (resp.status === 402) { toast.error('AI credits exhausted.'); throw new Error('Payment required'); }
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to get response');
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true, timestamp: new Date() }]);

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
              if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, content: assistantContent };
              return updated;
            });
          }
        } catch { textBuffer = line + "\n" + textBuffer; break; }
      }
    }

    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, isStreaming: false };
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      await streamChat(text, [...messages, userMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  }, [input, isLoading, messages, streamChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = useCallback(() => setMessages([]), []);

  const regenerateLastResponse = useCallback(async () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserIdx = messages.length - 2;
    if (messages[lastUserIdx]?.role !== 'user') return;
    const userMsg = messages[lastUserIdx].content;
    const previousMessages = messages.slice(0, lastUserIdx);
    setMessages(previousMessages);
    setIsLoading(true);
    try {
      const userMessage: Message = { role: 'user', content: userMsg, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
      await streamChat(userMsg, [...previousMessages, userMessage]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to regenerate. Please try again.', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  }, [messages, isLoading, streamChat]);

  const hasMessages = messages.length > 0;
  const messageCount = messages.filter(m => m.role === 'user').length;
  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.isStreaming);
  const suggestedFollowUps = lastAssistantMsg ? getSuggestedFollowUps(lastAssistantMsg.content) : [];

  return (
    <>
      {/* Toggle Button */}
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
              className="group relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary bg-[length:200%_200%] animate-[gradient-shift_3s_ease_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}>
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </button>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[hsl(var(--success))] rounded-full border-2 border-background shadow-sm">
              <span className="absolute inset-0 rounded-full bg-[hsl(var(--success))] animate-ping opacity-50" />
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
              "fixed z-50 overflow-hidden flex flex-col",
              "bg-card/95 backdrop-blur-2xl",
              "border border-border/40",
              "rounded-2xl shadow-2xl shadow-black/40",
              isMinimized
                ? "bottom-20 lg:bottom-6 right-4 lg:right-6 w-72 h-14"
                : isExpanded
                  ? "bottom-4 right-4 w-[560px] h-[720px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]"
                  : "bottom-20 lg:bottom-6 right-4 lg:right-6 w-[400px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
            )}
          >
            {/* Header */}
            <div className="relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/8 to-primary/10" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div 
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center"
                      whileHover={{ rotate: 5, scale: 1.05 }}
                    >
                      <WolfLogo size={22} />
                    </motion.div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))] border-2 border-card" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      PushDex AI
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary/15 to-accent/15 text-[10px] font-bold text-primary border border-primary/10">
                        PRO
                      </span>
                    </h3>
                    {!isMinimized && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] inline-block" />
                        Online • Gemini Flash
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {hasMessages && !isMinimized && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={clearChat} title="Clear chat">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {!isMinimized && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hidden lg:flex" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? 'Compact' : 'Expand'}>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => setIsOpen(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
                  <div className="p-4 space-y-1">
                    {/* Welcome */}
                    {!hasMessages && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-3 space-y-5">
                        <div className="relative inline-block">
                          <motion.div
                            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 border border-primary/15 flex items-center justify-center"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <WolfLogo size={44} />
                          </motion.div>
                          <motion.div className="absolute -inset-3 rounded-3xl border border-primary/10" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2.5, repeat: Infinity }} />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1">Hey! I'm PushDex AI 👋</h3>
                          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                            Your expert DeFi companion. I know everything about PushDex, DeFi, and Push Chain.
                          </p>
                        </div>

                        {/* Capability pills */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-muted-foreground px-2">
                          {['🧠 DeFi Expert', '📊 Analytics', '🔧 Troubleshoot', '🌍 Multi-lang'].map((cap) => (
                            <span key={cap} className="px-2 py-1 rounded-full bg-secondary/60 border border-border/30">{cap}</span>
                          ))}
                        </div>
                        
                        {/* Quick prompts grid */}
                        <div className="grid grid-cols-2 gap-1.5 px-1">
                          {QUICK_PROMPTS.map((prompt) => (
                            <motion.button
                              key={prompt.label}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => sendMessage(prompt.message)}
                              className="text-left px-3 py-2 rounded-xl bg-surface/80 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group/prompt"
                            >
                              <span className="text-sm">{prompt.icon}</span>
                              <span className="block text-[11px] font-medium text-muted-foreground group-hover/prompt:text-foreground transition-colors mt-0.5">{prompt.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Messages */}
                    <AnimatePresence>
                      {messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className={cn("flex gap-2.5 py-2 group", msg.role === 'user' ? "justify-end" : "justify-start")}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div className="max-w-[82%] space-y-1">
                            <div className={cn(
                              "px-3.5 py-2.5 text-[13px] leading-relaxed",
                              msg.role === 'user'
                                ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-2xl rounded-br-md shadow-md shadow-primary/10"
                                : "bg-surface/80 border border-border/30 rounded-2xl rounded-bl-md"
                            )}>
                              {msg.role === 'assistant' ? (
                                <div className="prose-sm">
                                  {renderContent(msg.content)}
                                  {msg.isStreaming && (
                                    <motion.span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 rounded-full align-middle"
                                      animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
                                  )}
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                            {/* Actions row */}
                            {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                              <div className="flex items-center gap-1 ml-1">
                                <CopyButton text={msg.content} />
                                {idx === messages.length - 1 && (
                                  <button onClick={regenerateLastResponse} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted/50" title="Regenerate">
                                    <RefreshCw className="w-3 h-3 text-muted-foreground" />
                                  </button>
                                )}
                                {msg.timestamp && (
                                  <span className="text-[9px] text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                    {formatTime(msg.timestamp)}
                                  </span>
                                )}
                              </div>
                            )}
                            {msg.role === 'user' && msg.timestamp && (
                              <div className="text-right">
                                <span className="text-[9px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                            )}
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="w-4 h-4 text-accent" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Typing indicator */}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}

                    {/* Suggested follow-ups */}
                    {!isLoading && hasMessages && lastAssistantMsg && !lastAssistantMsg.isStreaming && suggestedFollowUps.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-1.5 pt-2 pl-10"
                      >
                        {suggestedFollowUps.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => sendMessage(suggestion)}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-surface/60 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center gap-1"
                          >
                            <ArrowRight className="w-2.5 h-2.5 text-primary" />
                            {suggestion}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="shrink-0 p-3 border-t border-border/30 bg-gradient-to-t from-card/80 to-card/40 backdrop-blur-sm">
                  {messageCount > 0 && (
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] text-muted-foreground/40">{messageCount} message{messageCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about DeFi..."
                        rows={1}
                        className={cn(
                          "w-full resize-none rounded-xl px-4 py-2.5 text-sm",
                          "bg-surface/80 border border-border/40",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                          "placeholder:text-muted-foreground/40",
                          "transition-all duration-200",
                          "max-h-[100px] scrollbar-hide"
                        )}
                        disabled={isLoading}
                        style={{ minHeight: '42px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = '42px';
                          target.style.height = Math.min(target.scrollHeight, 100) + 'px';
                        }}
                      />
                    </div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className={cn(
                          "shrink-0 w-10 h-10 rounded-xl transition-all duration-300",
                          input.trim()
                            ? "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 hover:shadow-primary/40"
                            : "bg-muted"
                        )}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </motion.div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
                    PushDex AI may make mistakes • Verify important info
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
