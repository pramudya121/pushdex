import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Send, Loader2, Bot, User, Minimize2, Maximize2, Sparkles, Trash2, Copy, Check, RefreshCw, ExternalLink, Zap, ArrowRight, Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';
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

// TTS Button for assistant messages
const TTSButton = ({ text }: { text: string }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stripMarkdown = (md: string) => {
    return md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[|>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) 
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) window.speechSynthesis.cancel();
    };
  }, [isSpeaking]);

  return (
    <button
      onClick={speak}
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-muted/50",
        isSpeaking && "opacity-100 text-primary"
      )}
      title={isSpeaking ? "Stop speaking" : "Listen to response"}
    >
      {isSpeaking ? (
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <VolumeX className="w-3 h-3 text-primary" />
        </motion.div>
      ) : (
        <Volume2 className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
};

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

const formatTime = (date?: Date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Voice Input Hook
const useVoiceInput = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setVolume(0);
    setTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    try {
      // Get mic for volume visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Volume animation loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setVolume(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID'; // Support Indonesian, falls back gracefully

      let finalText = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += t + ' ';
          } else {
            interim = t;
          }
        }
        setTranscript((finalText + interim).trim());
      };

      recognition.onend = () => {
        const text = finalText.trim();
        if (text) onResult(text);
        stopListening();
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'aborted') {
          console.error('Speech recognition error:', e.error);
          toast.error(`Voice error: ${e.error}`);
        }
        stopListening();
      };

      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.error('Mic access error:', err);
      toast.error('Could not access microphone');
      stopListening();
    }
  }, [isSupported, onResult, stopListening]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return { isListening, transcript, volume, startListening, stopListening, isSupported };
};

// Auto-speak new assistant messages
const useAutoSpeak = (enabled: boolean) => {
  const speakText = useCallback((text: string) => {
    if (!enabled) return;
    
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[|>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  return { speakText };
};

export const AIChatBot: React.FC = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoVoiceReply, setAutoVoiceReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { speakText } = useAutoSpeak(autoVoiceReply);

  const handleVoiceResult = useCallback((text: string) => {
    setInput(text);
  }, []);

  const { isListening, transcript, volume, startListening, stopListening, isSupported: voiceSupported } = useVoiceInput(handleVoiceResult);

  // Update input with live transcript while listening
  useEffect(() => {
    if (isListening && transcript) {
      setInput(transcript);
    }
  }, [isListening, transcript]);

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

    // Auto-speak if enabled
    if (assistantContent) {
      speakText(assistantContent);
    }
  }, [speakText]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;
    setInput('');
    if (isListening) stopListening();
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      await streamChat(text, [...messages, userMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  }, [input, isLoading, messages, streamChat, isListening, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    window.speechSynthesis.cancel();
  }, []);

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
                        {autoVoiceReply && <Volume2 className="w-3 h-3 text-primary ml-1" />}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {/* Auto voice reply toggle */}
                  {!isMinimized && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("w-7 h-7", autoVoiceReply ? "text-primary" : "text-muted-foreground")}
                      onClick={() => {
                        setAutoVoiceReply(!autoVoiceReply);
                        toast.success(autoVoiceReply ? 'Voice reply OFF' : 'Voice reply ON 🔊');
                        if (autoVoiceReply) window.speechSynthesis.cancel();
                      }}
                      title={autoVoiceReply ? 'Disable voice replies' : 'Enable voice replies'}
                    >
                      {autoVoiceReply ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </Button>
                  )}
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
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }}>
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
                          {['🧠 DeFi Expert', '📊 Analytics', '🎤 Voice Input', '🔊 Voice Reply', '🌍 Multi-lang'].map((cap) => (
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
                                <TTSButton text={msg.content} />
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

                {/* Voice Recording Overlay */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-[120px] left-3 right-3 z-10"
                    >
                      <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/10">
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            className="w-10 h-10 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center"
                            animate={{ scale: [1, 1.1 + volume * 0.3, 1] }}
                            transition={{ duration: 0.3, repeat: Infinity }}
                          >
                            <Mic className="w-5 h-5 text-destructive" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">Listening...</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {transcript || 'Speak now...'}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 text-destructive hover:bg-destructive/10"
                            onClick={stopListening}
                          >
                            <Square className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                        {/* Volume bars */}
                        <div className="flex gap-0.5 items-end h-6 justify-center">
                          {Array.from({ length: 20 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 rounded-full bg-primary"
                              animate={{
                                height: Math.max(4, volume * 24 * (0.5 + Math.random() * 0.5)),
                              }}
                              transition={{ duration: 0.1 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        placeholder={isListening ? "Listening..." : "Ask me anything about DeFi..."}
                        rows={1}
                        className={cn(
                          "w-full resize-none rounded-xl px-4 py-2.5 text-sm",
                          "bg-surface/80 border border-border/40",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
                          "placeholder:text-muted-foreground/40",
                          "transition-all duration-200",
                          "max-h-[100px] scrollbar-hide",
                          isListening && "border-primary/50 ring-2 ring-primary/20"
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

                    {/* Mic button */}
                    {voiceSupported && (
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          onClick={isListening ? stopListening : startListening}
                          disabled={isLoading}
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "shrink-0 w-10 h-10 rounded-xl transition-all duration-300",
                            isListening
                              ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                              : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
                          )}
                          title={isListening ? "Stop recording" : "Voice input"}
                        >
                          {isListening ? (
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                              <MicOff className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </Button>
                      </motion.div>
                    )}

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
                    🎤 Voice input • 🔊 Voice reply • PushDex AI may make mistakes
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
