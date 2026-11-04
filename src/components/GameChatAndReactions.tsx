import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, GameMode, GameType } from '../types/game';
import { peerService } from '../services/peerService';
import { tacticalVoice } from '../services/tacticalVoice';
import { sound } from '../services/sound';
import { botChatService } from '../services/botChatService';
import {
  MessageSquare,
  Mic,
  Square,
  Send,
  Play,
  Volume2,
  Smile,
  X,
  Sparkles,
  Radio,
  Plus,
  AlertTriangle,
} from 'lucide-react';

interface GameChatAndReactionsProps {
  gameType: GameType;
  gameMode: GameMode;
  playerName: string;
  playerAvatar: string;
  playerPortraitUrl?: string;
  opponentName: string;
  opponentPortraitUrl?: string;
}

export const EMOJI_CATEGORIES = [
  {
    id: 'royal',
    name: '👑 Couronne & Gloire',
    emojis: ['👑', '🦁', '⚔️', '🛡️', '🏹', '🏰', '🏆', '🎖️', '⚜️', '💎', '🪙', '🦅'],
  },
  {
    id: 'energy',
    name: '🔥 Feu & Énergie',
    emojis: ['🔥', '⚡', '💥', '🎯', '🌪️', '🚀', '💣', '🩸', '🥊', '✨', '☄️', '🌋'],
  },
  {
    id: 'mood',
    name: '😎 Humeurs & Esprit',
    emojis: ['😂', '🤣', '😎', '😈', '💀', '😤', '😱', '🥳', '🥶', '🤯', '🤫', '🧐', '😏', '🥱'],
  },
  {
    id: 'gestures',
    name: '🤝 Gestes & Respect',
    emojis: ['👏', '🤝', '👊', '✌️', '🙏', '💪', '🤙', '🫡', '👀', '💯', '👋', '🤞'],
  },
  {
    id: 'heritage',
    name: '🌍 Racines & Symboles',
    emojis: ['🌍', '🌴', '🥁', '🪘', '☀️', '🌟', '🌙', '🪄', '🍀', '☕', '🐍', '🐘'],
  },
];

// Flat list of dock-recommended emojis
export const DOCK_EMOJIS = ['👑', '🦁', '🔥', '😎', '💀', '😱', '😤', '🎯', '👏', '🤝', '⚡', '🏆', '😂', '💪'];

const QUICK_PHRASES = [
  'Bien joué !',
  'Joli coup tactique !',
  'Prends garde à ton Roi !',
  'Je domine le centre !',
  'Prépare-toi à la défaite !',
  'Revanche au sommet ?',
];

export const GameChatAndReactions: React.FC<GameChatAndReactionsProps> = ({
  gameType,
  gameMode,
  playerName,
  playerAvatar,
  playerPortraitUrl,
  opponentName,
  opponentPortraitUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'emojis'>('chat');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Floating Reactions over board
  const [floatingReactions, setFloatingReactions] = useState<
    Array<{ id: string; emoji: string; sender: string; x: number }>
  >([]);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [currentlyPlayingAudioId, setCurrentlyPlayingAudioId] = useState<string | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom on new message
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen to incoming peer messages
  useEffect(() => {
    const handlePeerMessage = (msg: any) => {
      if (msg.type === 'CHAT') {
        const chatMsg: ChatMessage = msg.payload;
        setMessages((prev) => [...prev, chatMsg]);
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
        sound.playMove();
      } else if (msg.type === 'REACTION') {
        triggerFloatingReaction(msg.payload.emoji, msg.payload.sender);
      }
    };

    peerService.onMessage(handlePeerMessage);
  }, [isOpen]);

  const triggerFloatingReaction = (emoji: string, sender: string) => {
    sound.playMove();
    const id = `react_${Date.now()}_${Math.random()}`;
    const x = Math.floor(Math.random() * 60 + 20); // 20% to 80% horizontal
    setFloatingReactions((prev) => [...prev, { id, emoji, sender, x }]);

    // Announce mood with AI voice occasionally
    if (Math.random() > 0.4) {
      tacticalVoice.announceMoodReaction(emoji, sender);
    }

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2400);
  };

  const handleSendEmoji = (emoji: string) => {
    triggerFloatingReaction(emoji, playerName);

    if (gameMode === 'online') {
      peerService.sendMessage({
        type: 'REACTION',
        gameType,
        payload: { emoji, sender: playerName },
        senderId: peerService.getMyId(),
      });
    }

    // Also add to chat log
    const reactionMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: playerName,
      avatar: playerAvatar,
      type: 'reaction',
      emoji,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, reactionMsg]);

    // Bot witty reaction if playing against Bot
    if (gameMode === 'bot') {
      const delay = Math.floor(Math.random() * 400 + 800);
      setTimeout(() => {
        const botReply = botChatService.generateReply(
          emoji,
          {
            gameType,
            playerName,
            opponentName,
          },
          'reaction'
        );

        const botMsg: ChatMessage = {
          id: `m_bot_${Date.now()}`,
          sender: opponentName || 'Ton Pote IA',
          avatar: '🤖',
          type: 'text',
          text: botReply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        sound.playMove();
      }, delay);
    }
  };

  const handleAppendEmojiToInput = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    sound.playMove();
  };

  const handleSendText = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: playerName,
      avatar: playerAvatar,
      type: 'text',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setIsEmojiPickerOpen(false);
    sound.playMove();

    if (gameMode === 'online') {
      peerService.sendMessage({
        type: 'CHAT',
        gameType,
        payload: newMsg,
        senderId: peerService.getMyId(),
      });
    } else if (gameMode === 'bot') {
      // Intelligent, prompt, contextual Bot reply
      const delay = Math.floor(Math.random() * 400 + 700);
      setTimeout(() => {
        const botReply = botChatService.generateReply(
          text,
          {
            gameType,
            playerName,
            opponentName,
          },
          'text'
        );

        const botMsg: ChatMessage = {
          id: `m_bot_${Date.now()}`,
          sender: opponentName || 'Ton Pote IA',
          avatar: '🤖',
          type: 'text',
          text: botReply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        sound.playMove();
      }, delay);
    }
  };

  // Push-to-Talk / Voice Recording
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

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => {
          if (sec >= 15) {
            stopRecording();
            return 15;
          }
          return sec + 1;
        });
      }, 1000);
    } catch {
      // Handled cleanly without console.error (which triggers dev alerts)
      setMicNotice("Accès microphone refusé ou bloqué. Autorisez le micro dans votre navigateur pour enregistrer une note, ou envoyez un message texte.");
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
    const newMsg: ChatMessage = {
      id: `v_${Date.now()}`,
      sender: playerName,
      avatar: playerAvatar,
      type: 'voice',
      audioBase64,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    sound.playMove();

    if (gameMode === 'online') {
      peerService.sendMessage({
        type: 'CHAT',
        gameType,
        payload: newMsg,
        senderId: peerService.getMyId(),
      });
    } else if (gameMode === 'bot') {
      // Bot prompt response to voice message
      setTimeout(() => {
        const botReply = botChatService.generateReply(
          '',
          {
            gameType,
            playerName,
            opponentName,
          },
          'voice'
        );

        const botMsg: ChatMessage = {
          id: `m_bot_${Date.now()}`,
          sender: opponentName || 'Ton Pote IA',
          avatar: '🤖',
          type: 'text',
          text: botReply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMsg]);
        sound.playMove();
      }, 950);
    }
  };

  const playVoiceMessage = (msgId: string, audioBase64?: string) => {
    if (!audioBase64) return;

    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current = null;
    }

    if (currentlyPlayingAudioId === msgId) {
      setCurrentlyPlayingAudioId(null);
      return;
    }

    const audio = new Audio(audioBase64);
    currentAudioElementRef.current = audio;
    setCurrentlyPlayingAudioId(msgId);

    audio.onended = () => {
      setCurrentlyPlayingAudioId(null);
      currentAudioElementRef.current = null;
    };

    audio.onerror = () => {
      setCurrentlyPlayingAudioId(null);
      currentAudioElementRef.current = null;
    };

    audio.play().catch(() => {
      setCurrentlyPlayingAudioId(null);
    });
  };

  return (
    <>
      {/* Floating Animated Emojis Display over Board */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            style={{ left: `${r.x}%`, bottom: '25%' }}
            className="absolute transform -translate-x-1/2 flex flex-col items-center animate-bounce-up select-none pointer-events-none"
          >
            <span className="text-4xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] scale-125 transition-transform">
              {r.emoji}
            </span>
            <span className="text-[10px] font-bold text-[#ffd700] bg-black/80 px-2 py-0.5 rounded-full border border-[#d4a017]/60 mt-1 shadow">
              {r.sender}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Emoji Reaction Strip (Always accessible dock at bottom) */}
      <div className="w-full max-w-sm mt-2 px-1 flex items-center justify-between gap-1.5 z-30">
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 px-2 bg-gradient-to-r from-[#2e1408]/90 to-[#170903]/90 border border-[#d4a017]/50 rounded-2xl shadow-lg scrollbar-none">
          {DOCK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendEmoji(emoji)}
              className="text-lg p-1 hover:scale-125 active:scale-95 transition-transform cursor-pointer rounded-lg hover:bg-black/40 shrink-0"
              title="Envoyer réaction instantanée"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Toggle Full Chat & Voice Modal */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setUnreadCount(0);
          }}
          className="relative p-2.5 bg-gradient-to-br from-[#7a3917] to-[#451b08] hover:from-[#92451d] hover:to-[#57230b] border-2 border-[#d4a017] rounded-2xl text-[#ffd700] shadow-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
          title="Ouvrir le Chat écrit & Vocal"
        >
          <MessageSquare className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-red-600 text-white font-extrabold text-[10px] rounded-full border border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Full Chat & Voice Dialogue Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm h-[540px] max-h-[88vh] bg-gradient-to-b from-[#2e1408] via-[#1a0a04] to-[#0c0402] border-2 border-[#d4a017] rounded-3xl shadow-[0_0_40px_rgba(212,160,23,0.4)] flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="p-3 bg-gradient-to-b from-[#3a180a] to-[#200c05] border-b border-[#d4a017]/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 rounded-xl border border-amber-500/40 text-[#ffd700]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-royal font-bold text-[#ffd700] uppercase">
                    Discussion & Emojis Libres
                  </h3>
                  <p className="text-[10px] text-[#cca072]">
                    Échanges en direct avec {opponentName || 'l’adversaire'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab(activeTab === 'chat' ? 'emojis' : 'chat')}
                  className="px-2.5 py-1 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-lg text-[10px] text-amber-200 font-bold transition-all"
                >
                  {activeTab === 'chat' ? '😀 Emojis Libres' : '💬 Discussion'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === 'emojis' ? (
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                    Galerie Emojis Sans Restriction
                  </span>
                  <span className="text-[9px] text-[#cca072]">Touchez pour réagir ou insérer</span>
                </div>

                {/* Categories tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {EMOJI_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedEmojiCategory(idx)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                        selectedEmojiCategory === idx
                          ? 'bg-[#d4a017] text-black shadow'
                          : 'bg-black/40 text-amber-200 border border-white/10 hover:bg-black/60'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Grid of emojis in current category */}
                <div className="grid grid-cols-6 gap-2 p-2 bg-black/30 rounded-2xl border border-[#d4a017]/30">
                  {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji) => (
                    <div key={emoji} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleSendEmoji(emoji)}
                        className="w-10 h-10 rounded-xl bg-black/40 hover:bg-[#5a2712] border border-[#d4a017]/30 hover:border-[#ffd700] flex items-center justify-center text-2xl transition-all active:scale-90 cursor-pointer shadow"
                        title="Envoyer en direct"
                      >
                        {emoji}
                      </button>
                      <button
                        onClick={() => handleAppendEmojiToInput(emoji)}
                        className="text-[9px] text-amber-300/80 hover:text-amber-200"
                        title="Insérer dans le message"
                      >
                        + texte
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                  Phrases rapides personnalisables
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PHRASES.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleSendText(phrase)}
                      className="p-2 text-left bg-black/40 hover:bg-[#4d230f] border border-[#d4a017]/30 rounded-xl text-[10px] font-medium text-[#f3e5d8] transition-all active:scale-95 cursor-pointer"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Thread */
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#8e684a]">
                    <Radio className="w-8 h-8 text-[#d4a017]/40 mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-amber-200">
                      Canal de communication libre en temps réel
                    </p>
                    <p className="text-[11px] mt-1 text-[#cca072]">
                      Écrivez librement vos messages, envoyez vos emojis ou enregistrez un vocal.
                      {gameMode === 'bot' && ' Le Bot vous répondra en direct !'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender === playerName;
                    const portrait = msg.portraitUrl || (isMe ? playerPortraitUrl : opponentPortraitUrl);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[9px] text-[#cca072] mb-0.5 px-1 flex items-center gap-1.5">
                          {portrait ? (
                            <img
                              src={portrait}
                              alt={msg.sender}
                              className="w-4 h-4 rounded-full border border-[#ffd700] object-cover bg-black/50"
                            />
                          ) : (
                            <span>{msg.avatar || (isMe ? playerAvatar : '🤖')}</span>
                          )}
                          <span className="font-semibold">{msg.sender}</span>
                        </div>

                        {/* Text Message */}
                        {msg.type === 'text' && (
                          <div
                            className={`p-2.5 rounded-2xl text-xs max-w-[85%] break-words whitespace-pre-wrap leading-relaxed shadow ${
                              isMe
                                ? 'bg-gradient-to-r from-[#7a3917] to-[#52240e] text-white border border-[#ffd700]/70 rounded-tr-none'
                                : 'bg-[#241006] text-amber-100 border border-[#d4a017]/40 rounded-tl-none'
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}

                        {/* Reaction in chat */}
                        {msg.type === 'reaction' && (
                          <div className="text-2xl p-1.5 bg-black/40 rounded-xl border border-[#d4a017]/30">
                            {msg.emoji}
                          </div>
                        )}

                        {/* Voice Note Message */}
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
                                {currentlyPlayingAudioId === msg.id ? 'Lecture en cours...' : 'Appuyer pour écouter'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Quick Popover Emoji Drawer when typing */}
            {isEmojiPickerOpen && (
              <div className="p-2 bg-[#1b0a04] border-t border-[#d4a017]/50 flex gap-1.5 overflow-x-auto">
                {EMOJI_CATEGORIES.flatMap((c) => c.emojis.slice(0, 4)).map((e, idx) => (
                  <button
                    key={`${e}-${idx}`}
                    onClick={() => handleAppendEmojiToInput(e)}
                    className="text-xl p-1 rounded-lg hover:bg-black/50 hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Controls (Input + Voice push-to-talk + Free Emojis) */}
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
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="p-2 bg-black/40 hover:bg-black/60 border border-[#d4a017]/40 rounded-xl text-amber-200 transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Ajouter un emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="Écrivez librement votre message..."
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
                    onClick={() => handleSendText()}
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
      )}
    </>
  );
};
