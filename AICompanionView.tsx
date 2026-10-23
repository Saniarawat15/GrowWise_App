import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Volume2,
  ArrowLeft,
  X,
  Compass,
  Bot,
  User,
  GraduationCap,
  Languages,
  Briefcase,
  Zap,
  HeartHandshake,
  ShieldCheck,
  Headphones,
  Wind,
  Plus,
  MessageSquare,
  History,
  Search,
  PanelLeftClose,
  PanelLeft,
  Clock,
  CheckCircle2,
  Building,
  Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, ChatSessionSummary, MentorMode } from '../../types';
import { api } from '../../services/apiClient';
import { MENTOR_MODES, MENTOR_MODE_LIST } from '../../data/mentorModes';
import { BreathingExerciseModal } from '../common/BreathingExerciseModal';

interface AICompanionViewProps {
  onClose?: () => void;
  initialPrompt?: string;
  initialMode?: string;
  initialVentMode?: boolean;
}

export const AICompanionView: React.FC<AICompanionViewProps> = ({
  onClose,
  initialPrompt,
  initialMode,
  initialVentMode = false,
}) => {
  const { user, setShowEmergencyModal } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState(initialPrompt || '');

  // Sessions & History
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('Coaching Session');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [historyTab, setHistoryTab] = useState<'all' | 'vent' | 'mentor'>('all');

  // Modes
  const validInitialMode = (initialMode && MENTOR_MODES[initialMode as MentorMode] ? initialMode : 'life') as MentorMode;
  const [selectedMode, setSelectedMode] = useState<MentorMode>(validInitialMode);
  const [ventMode, setVentMode] = useState<boolean>(initialVentMode);

  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [showFrameworkModal, setShowFrameworkModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  const isMentalFatigueOrBreathing = (text?: string) => {
    if (!text) return false;
    return /\b(mentally tired|tired|exhausted|burnout|burnt out|fatigued|drained|overwhelmed|brain is fried|can't think|cant think|mind is tired|so heavy|stress|stressed|headache|need a break|need to breathe|take a breath|breathing exercise|box breathing)\b/i.test(text);
  };

  // Framework inputs for Situation -> Thought -> Reality -> Action
  const [frameworkSituation, setFrameworkSituation] = useState('');
  const [frameworkThought, setFrameworkThought] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeMentor = MENTOR_MODES[selectedMode] || MENTOR_MODES.life;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    initChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load or create initial session
  const initChatSessions = async () => {
    try {
      const summaries = await api.getChatSessions();
      setSessions(summaries);

      if (initialVentMode) {
        // If user came specifically to Safe Vent, look for existing vent or create new
        const existingVent = summaries.find((s) => s.is_vent);
        if (existingVent) {
          await loadSessionById(existingVent.id);
        } else {
          await handleCreateNewSession('reflect', true, 'Safe Vent Sanctuary');
        }
      } else if (summaries.length > 0) {
        // Load most recent active session
        await loadSessionById(summaries[0].id);
      } else {
        // Create initial session
        await handleCreateNewSession(validInitialMode, false, 'Growth Coaching Session');
      }
    } catch (e) {
      console.warn('Failed to load chat sessions:', e);
      try {
        const session = await api.getChatSession();
        setMessages(session.messages || []);
        setActiveSessionId(session.id);
        setActiveSessionTitle(session.title || 'Growth Coaching');
      } catch {}
    }
  };

  const loadSessionById = async (sessionId: string) => {
    try {
      const session = await api.getChatSession(sessionId);
      setMessages(session.messages || []);
      setActiveSessionId(session.id);
      setActiveSessionTitle(session.title || (session.is_vent ? 'Safe Vent Sanctuary' : 'Growth Coaching'));
      setVentMode(!!session.is_vent);
      if (session.mode && MENTOR_MODES[session.mode as MentorMode]) {
        setSelectedMode(session.mode as MentorMode);
      }
    } catch (e) {
      console.warn('Error loading session:', e);
    }
  };

  // Create a brand new session (for AI Mentor or Safe Vent)
  const handleCreateNewSession = async (mode: MentorMode = 'life', isVent: boolean = false, title?: string) => {
    setIsLoading(true);
    try {
      const newSession = await api.createNewChatSession(mode, isVent, title);
      setMessages(newSession.messages || []);
      setActiveSessionId(newSession.id);
      setActiveSessionTitle(newSession.title);
      setSelectedMode(mode);
      setVentMode(isVent);

      // Refresh list
      const updatedSummaries = await api.getChatSessions();
      setSessions(updatedSummaries);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error('Error creating new session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to a previous session from history list
  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) {
      setIsSidebarOpen(false);
      return;
    }
    await loadSessionById(sessionId);
    setIsSidebarOpen(false);
  };

  // Delete a chat session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat from your history?')) return;

    try {
      await api.deleteChatSession(sessionId);
      const updatedSummaries = await api.getChatSessions();
      setSessions(updatedSummaries);

      if (sessionId === activeSessionId) {
        if (updatedSummaries.length > 0) {
          await loadSessionById(updatedSummaries[0].id);
        } else {
          await handleCreateNewSession('life', false);
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  // Send message
  const handleSend = async (customText?: string, modeOverride?: MentorMode, ventOverride?: boolean) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    const activeMode = modeOverride || selectedMode;
    const isVenting = ventOverride !== undefined ? ventOverride : ventMode;

    // Optimistic temporary message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId || 'active',
      sender: 'user',
      message: textToSend,
      timestamp: new Date().toISOString(),
      action_type: isVenting ? `${activeMode}-vent` : activeMode,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendChatMessage(
        textToSend,
        activeMode,
        activeMode,
        isVenting,
        activeSessionId || undefined
      );

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);

      if (res.session) {
        setActiveSessionTitle(res.session.title);
        setActiveSessionId(res.session.id);
      }

      // Silently refresh sessions in background to update snippets/titles
      api.getChatSessions().then(setSessions).catch(() => {});
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        session_id: activeSessionId || 'active',
        sender: 'assistant',
        message:
          'I am having trouble connecting to the AI service right now. Please check your connection or crisis resources if you need immediate care.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCurrentChat = async () => {
    if (window.confirm('Clear all messages in this current conversation?')) {
      await api.clearChatHistory(activeSessionId || undefined);
      if (activeSessionId) {
        await loadSessionById(activeSessionId);
      } else {
        setMessages([]);
      }
    }
  };

  const handleSpeak = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const submitFramework = () => {
    if (!frameworkSituation.trim() || !frameworkThought.trim()) return;
    const prompt = `Use the GrowWise 4-Step Framework (Situation → Thought → Reality → Action) for this experience:
• Situation: "${frameworkSituation}"
• Automatic Thought: "${frameworkThought}"
Please analyze the reality vs fear, and give me ONE concrete, achievable micro-action.`;
    setShowFrameworkModal(false);
    setFrameworkSituation('');
    setFrameworkThought('');
    handleSend(prompt, 'reflect', false);
  };

  const renderModeIcon = (modeId: MentorMode, sizeClass = 'w-4 h-4') => {
    switch (modeId) {
      case 'life':
        return <Compass className={sizeClass} />;
      case 'study':
        return <GraduationCap className={sizeClass} />;
      case 'english':
        return <Languages className={sizeClass} />;
      case 'career':
        return <Briefcase className={sizeClass} />;
      case 'motivation':
        return <Zap className={sizeClass} />;
      case 'reflect':
      default:
        return <HeartHandshake className={sizeClass} />;
    }
  };

  const preferredName = user?.nickname || user?.name?.split(' ')[0] || 'Friend';

  // Filtered session list for the ChatGPT-like history drawer
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      searchHistory.trim() === '' ||
      s.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
      (s.lastMessage && s.lastMessage.toLowerCase().includes(searchHistory.toLowerCase()));

    if (!matchesSearch) return false;
    if (historyTab === 'vent') return s.is_vent;
    if (historyTab === 'mentor') return !s.is_vent;
    return true;
  });

  return (
    <div className="relative flex h-[calc(100vh-4.5rem)] max-w-5xl mx-auto bg-stone-50 border-x border-stone-200 rounded-3xl overflow-hidden shadow-sm">
      {/* ---------------------------------------------------- */}
      {/* ChatGPT-STYLE CHAT HISTORY SIDEBAR / DRAWER          */}
      {/* ---------------------------------------------------- */}
      <div
        className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:flex flex-col bg-stone-900 text-stone-100 transition-all duration-300 ease-in-out border-r border-stone-800 ${
          isSidebarOpen
            ? 'w-80 sm:w-84 translate-x-0'
            : 'w-0 -translate-x-full lg:w-0 lg:-translate-x-full overflow-hidden'
        }`}
      >
        {/* Sidebar Header & New Chat Actions */}
        <div className="p-4 border-b border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-xs font-bold text-white tracking-wide">
                  GrowWise Chats
                </h3>
                <p className="text-[10px] text-stone-400">Personalized AI History</p>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Close chat history"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* "+ New Chat" Options */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleCreateNewSession('life', false, 'Growth Coaching Session')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
              title="Open a new AI Mentor conversation"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Mentor</span>
            </button>

            <button
              onClick={() => handleCreateNewSession('reflect', true, 'Safe Vent Sanctuary')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
              title="Open a new Safe Vent space"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>New Vent</span>
            </button>
          </div>

          {/* History Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 bg-stone-800/80 border border-stone-700/60 rounded-xl text-xs text-stone-200 placeholder:text-stone-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Tabs: All | Safe Vent | Mentors */}
          <div className="flex bg-stone-800 p-0.5 rounded-xl text-[11px] font-semibold text-stone-400">
            <button
              onClick={() => setHistoryTab('all')}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                historyTab === 'all' ? 'bg-stone-700 text-white shadow-2xs' : 'hover:text-stone-200'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              onClick={() => setHistoryTab('vent')}
              className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                historyTab === 'vent' ? 'bg-rose-950/80 text-rose-300 shadow-2xs' : 'hover:text-stone-200'
              }`}
            >
              <span>Vents</span>
            </button>
            <button
              onClick={() => setHistoryTab('mentor')}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                historyTab === 'mentor' ? 'bg-emerald-950/80 text-emerald-300 shadow-2xs' : 'hover:text-stone-200'
              }`}
            >
              Mentors
            </button>
          </div>
        </div>

        {/* Scrollable Chat Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-stone-600 opacity-60" />
              <p>No chats found.</p>
              <button
                onClick={() => handleCreateNewSession('life', false)}
                className="mt-2 text-emerald-400 underline font-medium hover:text-emerald-300"
              >
                Start a new conversation
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const dateLabel = new Date(session.updated_at || session.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group relative p-2.5 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 text-left ${
                    isActive
                      ? session.is_vent
                        ? 'bg-rose-950/70 border border-rose-800/80 text-rose-100 shadow-2xs'
                        : 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-100 shadow-2xs'
                      : 'hover:bg-stone-800/80 text-stone-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        session.is_vent
                          ? 'bg-rose-900/60 text-rose-300'
                          : 'bg-stone-800 text-emerald-400'
                      }`}
                    >
                      {session.is_vent ? (
                        <Headphones className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold truncate text-stone-100">
                          {session.title}
                        </p>
                      </div>
                      {session.lastMessage && (
                        <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                          {session.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {dateLabel}
                        </span>
                        {session.is_vent ? (
                          <span className="px-1.5 py-0.2 rounded-sm bg-rose-900/80 text-rose-300 font-medium">
                            Safe Vent
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-sm bg-stone-800 text-stone-400 font-medium">
                            {session.mode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-stone-400 hover:text-rose-400 hover:bg-stone-700/60 transition-all shrink-0"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer: Student Profile Details */}
        <div className="p-3 border-t border-stone-800 bg-stone-950/60 text-xs text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {preferredName.charAt(0)}
            </div>
            <div className="truncate">
              <p className="font-semibold text-stone-200 text-xs truncate">{user?.name || preferredName}</p>
              <p className="text-[10px] text-stone-500 truncate">{user?.college_name || 'GrowWise Student'}</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
            Active
          </span>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-stone-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN CHAT CONVERSATION CONTAINER                     */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full bg-stone-50 overflow-hidden">
        {/* Top Chat Navigation Bar */}
        <div className="bg-white px-3 sm:px-4 py-2.5 border-b border-stone-200 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Back"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Sidebar toggle button (ChatGPT style) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
              title="Toggle chat history list"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">History</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-300 text-[10px] font-bold">
                {sessions.length}
              </span>
            </button>

            {/* "+ New" Chat Quick Button */}
            <button
              onClick={() => handleCreateNewSession(selectedMode, ventMode)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors shadow-2xs"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Chat</span>
            </button>

            {/* Active Session Info & Student Profile Context */}
            <div className="truncate min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    ventMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <h2 className="font-heading text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {activeSessionTitle}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-500 truncate">
                <span>Personalized for {preferredName}</span>
                {user?.college_name && (
                  <span className="hidden sm:inline text-stone-400">• {user.college_name}</span>
                )}
                {user?.main_growth_goal && (
                  <span className="hidden md:inline text-stone-400">• Goal: {user.main_growth_goal}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => setShowBreathingModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
              title="Take a 1-minute mindful breathing reset"
            >
              <Wind className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Breathe</span>
            </button>

            <button
              onClick={() => setShowFrameworkModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
              title="4-Step Confidence Framework"
            >
              <Compass className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Framework</span>
            </button>

            <button
              onClick={handleClearCurrentChat}
              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-stone-100 transition-colors"
              title="Clear current chat messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Mentor Modes Selector Ribbon */}
        <div className="bg-white border-b border-stone-200 px-3 py-1.5 overflow-x-auto no-scrollbar flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
              Personas:
            </span>
            {MENTOR_MODE_LIST.map((mode) => {
              const isSelected = selectedMode === mode.id && !ventMode;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id);
                    setVentMode(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? `${mode.pillBg} shadow-2xs scale-102 ring-1 ring-stone-300 font-bold`
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {renderModeIcon(mode.id, 'w-3 h-3')}
                  <span>{mode.name}</span>
                </button>
              );
            })}
          </div>

          {/* Safe Vent Toggle Button */}
          <button
            onClick={() => setVentMode(!ventMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
              ventMode
                ? 'bg-rose-600 text-white shadow-xs scale-102'
                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
            title="When active, AI listens with pure empathy without lecturing"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{ventMode ? 'Safe Vent: ON' : 'Safe Vent: OFF'}</span>
          </button>
        </div>

        {/* Safe Vent Mode Banner when ON */}
        {ventMode && (
          <div className="bg-gradient-to-r from-rose-50 via-rose-100/70 to-pink-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <strong>Safe Vent Sanctuary:</strong> Feel free to type anything on your mind. There are no judgments, no unsolicited advice, and no expectations. Your mentor is here to listen.
              </div>
            </div>
            <button
              onClick={() => setVentMode(false)}
              className="text-[11px] text-rose-700 underline font-semibold ml-2 shrink-0 hover:text-rose-950"
            >
              Switch to Mentor
            </button>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Student Profile Card greeting if chat is fresh */}
          {messages.length <= 1 && (
            <div className="max-w-md mx-auto my-3 p-5 bg-white rounded-3xl border border-stone-200 text-center shadow-xs">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  ventMode
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {ventMode ? (
                  <Headphones className="w-6 h-6" />
                ) : (
                  renderModeIcon(activeMentor.id, 'w-6 h-6')
                )}
              </div>
              <h3 className="font-heading text-base font-bold text-stone-900 mb-0.5">
                {ventMode ? 'Safe Vent Sanctuary' : `Welcome, ${preferredName}`}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-3">
                {ventMode
                  ? 'A private, compassionate space where you can let everything out. Type freely in the box below.'
                  : `Your ${activeMentor.name} is ready. ${activeMentor.description}`}
              </p>

              {/* Student Details Stored & Verified */}
              <div className="text-left space-y-1.5 text-xs text-stone-700 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Your Profile Context:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-stone-600">
                  <div>
                    <span className="text-stone-400">Student:</span> {user?.name || preferredName}
                  </div>
                  <div>
                    <span className="text-stone-400">College:</span> {user?.college_name || 'College Student'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-400">Focus Goal:</span> {user?.main_growth_goal || 'Communication & Confidence'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showBreathingCard =
              !isUser &&
              (isMentalFatigueOrBreathing(msg.message) ||
                (prevMsg?.sender === 'user' && isMentalFatigueOrBreathing(prevMsg.message)));

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                      ventMode ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {ventMode ? <HeartHandshake className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-xl rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-tr-xs'
                      : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.message}</div>

                  {/* Inline Breathing Exercise Trigger when mentally tired / breathing mentioned */}
                  {showBreathingCard && (
                    <div className="mt-3 p-3 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Wind className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <p className="font-heading font-bold text-xs text-teal-950">
                            Mindful Breathing Exercise
                          </p>
                          <p className="text-[11px] text-teal-800 leading-snug">
                            Feeling mentally tired? Take 1 minute to release tension with haptic vibration & sound cues.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBreathingModal(true)}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>Start Breathing</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`mt-2 pt-1.5 flex items-center justify-between text-[10px] border-t ${
                      isUser ? 'border-emerald-600/60 text-emerald-200' : 'border-stone-100 text-stone-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.message, msg.id)}
                        className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
                        title="Listen to pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeakingId === msg.id ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-stone-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  ventMode ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {ventMode ? <HeartHandshake className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 border border-stone-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-xs text-stone-500 ml-1">
                  {ventMode
                    ? 'Listening attentively & holding space...'
                    : `${activeMentor.name} is thinking...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Optional Prompt Suggestions Chips */}
        <div className="px-3 sm:px-4 py-2 bg-stone-50 border-t border-stone-200/80 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
            {ventMode ? 'Vent Starters:' : 'Suggested:'}
          </span>

          {ventMode ? (
            <>
              <button
                onClick={() =>
                  handleSend(
                    "I just feel so overwhelmed with college expectations and exams. Can I just vent for a minute without getting an action plan?",
                    'reflect',
                    true
                  )
                }
                className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 text-xs font-medium shrink-0 transition-colors shadow-2xs text-left"
              >
                Feeling overwhelmed with college expectations...
              </button>
              <button
                onClick={() =>
                  handleSend(
                    "I'm feeling mentally tired and exhausted today. Everything feels a bit heavy.",
                    'reflect',
                    true
                  )
                }
                className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-medium shrink-0 transition-colors shadow-2xs text-left flex items-center gap-1"
              >
                <Wind className="w-3 h-3 text-teal-600" />
                <span>Mentally tired and drained...</span>
              </button>
              <button
                onClick={() =>
                  handleSend(
                    "I worked so hard on my project and it feels like nobody recognized the effort.",
                    'reflect',
                    true
                  )
                }
                className="px-3 py-1 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium shrink-0 transition-colors shadow-2xs text-left"
              >
                Nobody recognized my hard work...
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  handleSend(
                    "I'm feeling mentally tired and exhausted today. Everything feels a bit heavy.",
                    activeMentor.id
                  )
                }
                className="px-3 py-1 rounded-xl bg-teal-50/80 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-medium shrink-0 transition-colors shadow-2xs text-left flex items-center gap-1.5"
              >
                <Wind className="w-3 h-3 text-teal-600 shrink-0" />
                <span>I'm feeling mentally tired today...</span>
              </button>
              {activeMentor.starters.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(starter, activeMentor.id)}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 text-xs font-medium shrink-0 transition-colors shadow-2xs text-left max-w-xs truncate"
                  title={starter}
                >
                  {starter}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Input Form — Users can type any custom query */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                ventMode
                  ? `Safe Vent: Type whatever is on your mind, big or small. I'm listening...`
                  : `Ask your ${activeMentor.name} anything (${preferredName})...`
              }
              className={`flex-1 px-4 py-3 bg-stone-50 border rounded-2xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:bg-white transition-all ${
                ventMode
                  ? 'border-rose-200 focus:ring-2 focus:ring-rose-500'
                  : 'border-stone-200 focus:ring-2 focus:ring-emerald-600'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className={`p-3 text-white rounded-2xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
                ventMode
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4-Step Framework Modal */}
      {showFrameworkModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-700" />
                <h3 className="font-heading text-sm font-bold text-stone-900">
                  4-Step Confidence Framework
                </h3>
              </div>
              <button
                onClick={() => setShowFrameworkModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Transform anxiety into action by uncoupling automatic catastrophic thoughts from reality.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  1. The Situation:
                </label>
                <input
                  type="text"
                  value={frameworkSituation}
                  onChange={(e) => setFrameworkSituation(e.target.value)}
                  placeholder="e.g., I have to give a 3-minute presentation in class"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-800 block mb-1">
                  2. Automatic Thought (The Fear):
                </label>
                <input
                  type="text"
                  value={frameworkThought}
                  onChange={(e) => setFrameworkThought(e.target.value)}
                  placeholder="e.g., I will forget my words and everyone will laugh"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowFrameworkModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={submitFramework}
                disabled={!frameworkSituation.trim() || !frameworkThought.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40"
              >
                Analyze with GrowWise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breathing Exercise Modal */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </div>
  );
};
