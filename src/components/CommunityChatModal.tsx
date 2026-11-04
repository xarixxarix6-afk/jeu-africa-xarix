import React, { useState, useRef, useEffect } from 'react';
import { PlayerProfile } from '../types/game';
import { botChatService } from '../services/botChatService';
import { sound } from '../services/sound';
import { tacticalVoice } from '../services/tacticalVoice';
import {
  MessageSquare,
  Users,
  Send,
  Mic,
  Square,
  Play,
  Volume2,
  Smile,
  X,
  AtSign,
  Radio,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface CommunityMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  senderPortraitUrl?: string;
  type: 'text' | 'voice';
  text?: string;
  audioBase64?: string;
  timestamp: number;
  taggedUsers?: string[];
  isAi?: boolean;
}

interface CommunityChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayer: PlayerProfile;
  otherProfiles?: PlayerProfile[];
}

const STORAGE_KEY = 'afro_community_chat_messages_v1';
const CHANNEL_NAME = 'afro_community_chat_channel';

const INITIAL_COMMUNITY_MESSAGES: CommunityMessage[] = [
  {
    id: 'c_init_1',
    sender: 'IA Amicale',
    senderAvatar: '🤖',
    type: 'text',
    text: 'Bienvenue au Salon des Potes ! Taggez vos amis avec @pseudo ou écrivez-moi directement avec @IA, je suis toujours là pour discuter avec le sourire et dans la bonne humeur !',
    timestamp: Date.now() - 3600000,
    isAi: true,
  },
];

export const CommunityChatModal: React.FC<CommunityChatModalProps> = ({
  isOpen,
  onClose,
  activePlayer,
  otherProfiles = [],
}) => {
  const [messages, setMessages] = useState<CommunityMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_COMMUNITY_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentlyPlayingAudioId, setCurrentlyPlayingAudioId] = useState<string | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Setup broadcast channel for cross-tab multi-user communication
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_COMMUNITY_MESSAGE') {
            const incoming: CommunityMessage = event.data.message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              const next = [...prev, incoming];
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
            sound.playMove();
          }
        };
      } catch {}
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const saveMessages = (updated: CommunityMessage[]) => {
    setMessages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const broadcastMessage = (msg: CommunityMessage) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'NEW_COMMUNITY_MESSAGE',
          message: msg,
        });
      } catch {}
    }
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    // Detect tags (e.g. @Kwame, @Nathan, @IA, @bot)
    const tagMatches = text.match(/@(\w+)/g) || [];
    const taggedUsers = tagMatches.map((t) => t.substring(1));

    const newMsg: CommunityMessage = {
      id: `comm_${Date.now()}_${Math.random()}`,
      sender: activePlayer.pseudo,
      senderAvatar: activePlayer.avatar,
      senderPortraitUrl: activePlayer.customPortraitUrl,
      type: 'text',
      text,
      timestamp: Date.now(),
      taggedUsers,
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    broadcastMessage(newMsg);
    setInputText('');
    setShowEmojiPicker(false);
    setShowTagMenu(false);
    sound.playMove();

    // Check if @IA or @bot was tagged or mentioned
    const isTaggingAi =
      taggedUsers.some((u) => u.toLowerCase() === 'ia' || u.toLowerCase() === 'bot') ||
      text.toLowerCase().includes('@ia') ||
      text.toLowerCase().includes('@bot');

    if (isTaggingAi) {
      // Clean query for AI
      const promptQuery = text.replace(/@(ia|bot)/gi, '').trim() || 'Bonjour !';
      setIsAiThinking(true);

      botChatService
        .askCognitiveAI(promptQuery, activePlayer.pseudo, {
          gameType: 'chess',
          playerName: activePlayer.pseudo,
          opponentName: 'IA Cognitive',
        })
        .then((reply) => {
          setIsAiThinking(false);

          const aiMsg: CommunityMessage = {
            id: `comm_ai_${Date.now()}`,
            sender: 'IA Cognitive',
            senderAvatar: '🧠',
            type: 'text',
            text: `@${activePlayer.pseudo}\n\n${reply}`,
            timestamp: Date.now(),
            taggedUsers: [activePlayer.pseudo],
            isAi: true,
          };

          setMessages((prev) => {
            const next = [...prev, aiMsg];
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });

          broadcastMessage(aiMsg);
          sound.playMove();
        })
        .catch(() => {
          setIsAiThinking(false);
        });
    }
  };

  // Push-to-Talk Voice Recording
  const startRecording = async () => {
    setMicNotice(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicNotice("L'enregistrement vocal n'est pas supporté sur ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendVoiceMessage(base64Audio);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 15) {
            stopRecording();
            return 15;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      // Graceful notification without alert or unhandled console.error
      setMicNotice("Accès microphone refusé ou non disponible. Vous pouvez envoyer un message écrit avec emojis ou tag @IA !");
      setTimeout(() => setMicNotice(null), 7000);
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendVoiceMessage = (audioBase64: string) => {
    const newMsg: CommunityMessage = {
      id: `comm_v_${Date.now()}`,
      sender: activePlayer.pseudo,
      senderAvatar: activePlayer.avatar,
      senderPortraitUrl: activePlayer.customPortraitUrl,
      type: 'voice',
      audioBase64,
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    broadcastMessage(newMsg);
    sound.playMove();
  };

  const playVoiceMessage = (id: string, audioBase64?: string) => {
    if (!audioBase64) return;
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }
    if (currentlyPlayingAudioId === id) {
      setCurrentlyPlayingAudioId(null);
      return;
    }

    const audio = new Audio(audioBase64);
    currentAudioElementRef.current = audio;
    setCurrentlyPlayingAudioId(id);
    audio.onended = () => {
      setCurrentlyPlayingAudioId(null);
      currentAudioElementRef.current = null;
    };
    audio.play().catch(() => setCurrentlyPlayingAudioId(null));
  };

  const handleInsertTag = (tag: string) => {
    setInputText((prev) => `${prev} @${tag} `);
    setShowTagMenu(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-md h-[560px] max-h-[90vh] bg-gradient-to-b from-[#2e1408] via-[#1a0a04] to-[#0c0402] border-2 border-[#d4a017] rounded-3xl shadow-[0_0_50px_rgba(212,160,23,0.35)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-b from-[#3a180a] to-[#200c05] border-b-2 border-[#d4a017] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl border border-amber-300 shadow">
              <Users className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-xs font-royal font-bold text-[#ffd700] uppercase tracking-wide flex items-center gap-1.5">
                <span>Taverne des Potes & Chat Général</span>
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-full text-[9px]">
                  En direct
                </span>
              </h2>
              <p className="text-[10px] text-[#cca072]">
                Échanges libres hors-match • Tag @ami ou @IA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tagging Shortcut Bar */}
        <div className="px-3 py-1.5 bg-[#140602] border-b border-[#d4a017]/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px]">
          <span className="text-[#cca072] font-semibold flex items-center gap-1 shrink-0">
            <AtSign className="w-3 h-3 text-amber-400" /> Taguer :
          </span>
          <button
            onClick={() => handleInsertTag('IA')}
            className="px-2 py-0.5 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 border border-purple-400 text-purple-200 font-bold rounded-lg shrink-0 flex items-center gap-1"
          >
            <span>🤖 @IA (Parler à l'IA)</span>
          </button>
          {otherProfiles.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => handleInsertTag(p.pseudo)}
              className="px-2 py-0.5 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 text-amber-200 font-medium rounded-lg shrink-0"
            >
              @{p.pseudo}
            </button>
          ))}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender === activePlayer.pseudo;
            const isAi = msg.isAi || msg.sender.toLowerCase().includes('ia');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-[#cca072] mb-0.5 px-1 flex items-center gap-1.5">
                  {msg.senderPortraitUrl ? (
                    <img
                      src={msg.senderPortraitUrl}
                      alt={msg.sender}
                      className="w-4 h-4 rounded-full border border-[#ffd700] object-cover bg-black/50"
                    />
                  ) : (
                    <span className="text-xs">{msg.senderAvatar || (isAi ? '🤖' : '👑')}</span>
                  )}
                  <span className={`font-bold ${isAi ? 'text-cyan-300' : 'text-amber-200'}`}>
                    {msg.sender}
                  </span>
                  {isAi && (
                    <span className="text-[8px] bg-gradient-to-r from-purple-950 to-indigo-950 text-cyan-200 px-1.5 py-0.5 rounded border border-cyan-400/50 font-bold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                      <span>IA COGNITIVE</span>
                    </span>
                  )}
                </div>

                {msg.type === 'text' && (
                  <div
                    className={`p-2.5 rounded-2xl text-xs max-w-[88%] break-words whitespace-pre-wrap leading-relaxed shadow ${
                      isAi
                        ? 'bg-gradient-to-br from-[#1c0e2a] via-[#150a20] to-[#0d0514] text-stone-100 border border-purple-500/70 rounded-tl-none shadow-purple-950/50'
                        : isMe
                        ? 'bg-gradient-to-r from-[#7a3917] to-[#52240e] text-white border border-[#ffd700]/70 rounded-tr-none'
                        : 'bg-[#241006] text-amber-100 border border-[#d4a017]/40 rounded-tl-none'
                    }`}
                  >
                    {/* Highlight @tags */}
                    {msg.text?.split(/(@\w+)/g).map((chunk, idx) => {
                      if (chunk.startsWith('@')) {
                        return (
                          <span
                            key={idx}
                            className="font-bold text-[#ffd700] bg-black/40 px-1 py-0.2 rounded mx-0.5"
                          >
                            {chunk}
                          </span>
                        );
                      }
                      return chunk;
                    })}
                  </div>
                )}

                {msg.type === 'voice' && (
                  <div
                    className={`p-2.5 rounded-2xl flex items-center gap-2 max-w-[85%] shadow ${
                      isMe
                        ? 'bg-gradient-to-r from-[#7a3917] to-[#52240e] border border-[#ffd700] rounded-tr-none'
                        : 'bg-[#241006] border border-[#d4a017]/40 rounded-tl-none'
                    }`}
                  >
                    <button
                      onClick={() => playVoiceMessage(msg.id, msg.audioBase64)}
                      className="w-8 h-8 rounded-full bg-[#ffd700] text-black flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all shadow cursor-pointer shrink-0"
                    >
                      {currentlyPlayingAudioId === msg.id ? (
                        <Square className="w-3.5 h-3.5 fill-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      )}
                    </button>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-amber-200 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-[#ffd700]" />
                        <span>Note Vocale</span>
                      </div>
                      <div className="text-[9px] text-[#d8b28a]">
                        {currentlyPlayingAudioId === msg.id ? 'Lecture...' : 'Écouter'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isAiThinking && (
            <div className="flex flex-col items-start space-y-1 my-2 animate-in fade-in">
              <div className="text-[10px] text-cyan-300 px-1 flex items-center gap-1.5 font-bold">
                <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-[10px]">
                  🧠
                </span>
                <span>IA Cognitive</span>
                <span className="text-[9px] text-stone-400 font-normal">analyse et rédige la réponse...</span>
              </div>
              <div className="p-3 bg-gradient-to-r from-[#1c0e2a] to-[#12071d] border border-cyan-500/50 rounded-2xl rounded-tl-none text-xs text-cyan-200 flex items-center gap-2.5 shadow-lg">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-cyan-100">
                  Recherche approfondie & synthèse cognitive en cours...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-2.5 bg-gradient-to-t from-[#200c05] to-[#140602] border-t border-[#d4a017]/40 space-y-2">
          {micNotice && (
            <div className="p-2 bg-amber-950/90 border border-amber-500/70 rounded-xl text-[11px] text-amber-200 flex items-start justify-between gap-2 shadow-lg animate-in fade-in">
              <div className="flex items-start gap-1.5 flex-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-tight">{micNotice}</span>
              </div>
              <button
                onClick={() => setMicNotice(null)}
                className="text-stone-400 hover:text-white shrink-0 cursor-pointer text-xs px-1"
                title="Fermer"
              >
                ✕
              </button>
            </div>
          )}
          {isRecording ? (
            <div className="flex items-center justify-between p-2 bg-red-950/80 border-2 border-red-500 rounded-2xl animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-red-200">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span>Enregistrement : {recordingSeconds}s / 15s</span>
              </div>
              <button
                onClick={stopRecording}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Arrêter & Envoyer</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleInsertTag('IA')}
                className="p-2 bg-purple-950/70 hover:bg-purple-900 border border-purple-500/60 rounded-xl text-purple-300 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Taguer @IA"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Parlez avec vos potes ou tapez @IA..."
                className="flex-1 bg-black/60 border border-[#d4a017]/50 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[#ffd700]"
              />

              {/* Push-to-Talk Voice Record Button */}
              <button
                onClick={startRecording}
                className="p-2 bg-[#421c0e] hover:bg-[#5f2913] border border-[#d4a017] text-[#ffd700] rounded-xl transition-all active:scale-95 cursor-pointer shadow shrink-0"
                title="Enregistrer un message vocal"
              >
                <Mic className="w-4 h-4 text-amber-300" />
              </button>

              {/* Send Text Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="p-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-black font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
