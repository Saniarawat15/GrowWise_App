import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquareQuote,
  Flame,
  BookOpen,
  Target,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Smile,
  ShieldCheck,
  Headphones,
  GraduationCap,
  Languages,
  Briefcase,
  Zap,
  HeartHandshake,
  Wind,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab, DailyActivity, MoodType, MentorMode } from '../../types';
import { api } from '../../services/apiClient';
import { StreakCounterCard } from '../common/StreakCounterCard';
import { MENTOR_MODE_LIST } from '../../data/mentorModes';
import { EnglishWeeklyActivityGraph } from './EnglishWeeklyActivityGraph';
import { BreathingExerciseModal } from '../common/BreathingExerciseModal';

interface HomeDashboardProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenCompanion: (initialPrompt?: string, mode?: string, ventMode?: boolean) => void;
  onOpenJournalEditor: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectTab,
  onOpenCompanion,
  onOpenJournalEditor,
}) => {
  const { user, stats, refreshStats } = useAuth();
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [quickCheckinDone, setQuickCheckinDone] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [lastSelectedMood, setLastSelectedMood] = useState<MoodType | null>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const preferredName = user?.nickname || (user?.name ? user.name.split(' ')[0] : 'Friend');

  // Load today's activities
  const loadDaily = async () => {
    setLoadingDaily(true);
    try {
      const data = await api.getDailyActivities();
      setDailyActivities(data);
    } catch (e) {
      console.warn('Failed to load daily activities', e);
    } finally {
      setLoadingDaily(false);
    }
  };

  useEffect(() => {
    loadDaily();
  }, []);

  const handleToggleActivity = async (id: string) => {
    try {
      const updated = await api.toggleDailyActivity(id);
      setDailyActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      refreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickMood = async (mood: MoodType) => {
    setLastSelectedMood(mood);
    try {
      await api.createJournalEntry({
        title: `Quick Check-in: Feeling ${mood}`,
        content: `Checked in today with mood: ${mood}. Taking things one step at a time.`,
        mood,
      });
      setQuickCheckinDone(true);
      refreshStats();
      setTimeout(() => setQuickCheckinDone(false), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const completedCount = dailyActivities.filter((a) => a.completed).length;
  const totalDaily = dailyActivities.length || 3;
  const progressPercent = totalDaily > 0 ? Math.round((completedCount / totalDaily) * 100) : 0;

  const renderModeIcon = (id: MentorMode) => {
    switch (id) {
      case 'life':
        return <Compass className="w-4 h-4 text-amber-600" />;
      case 'study':
        return <GraduationCap className="w-4 h-4 text-sky-600" />;
      case 'english':
        return <Languages className="w-4 h-4 text-teal-600" />;
      case 'career':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'motivation':
        return <Zap className="w-4 h-4 text-rose-600" />;
      case 'reflect':
      default:
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Personalized Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-44 h-44 rounded-full bg-emerald-700/20 pointer-events-none blur-xl" />

        <div className="relative z-10 max-w-xl">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
            {getGreeting()}, {preferredName}
          </h1>

          <p className="text-emerald-100/90 text-sm mt-1.5 leading-relaxed">
            &ldquo;Grow with confidence. Learn with purpose.&rdquo; Choose your daily AI Mentor mode or take a moment to safely vent.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenCompanion(undefined, 'life', false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              Chat with AI Mentor
            </button>
            <button
              onClick={() => onOpenCompanion('I need to vent safely without anyone trying to fix it immediately...', 'reflect', true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl border border-rose-400/40 shadow-xs transition-colors"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Safe Vent Sanctuary</span>
            </button>
            <button
              onClick={() => setShowBreathingModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-800/80 hover:bg-teal-700 text-teal-100 text-xs font-semibold rounded-xl border border-teal-500/40 shadow-xs transition-colors active:scale-95"
            >
              <Wind className="w-3.5 h-3.5 text-teal-300" />
              <span>1-Min Breathing Pause</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Daily Mentor Modes & Safe Vent Selector Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Daily AI Mentor Modes</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Choose the conversation style matching your daily needs or enter Safe Vent mode.
            </p>
          </div>
          <button
            onClick={() => onOpenCompanion(undefined, 'reflect', true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Safe Vent Mode</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {MENTOR_MODE_LIST.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onOpenCompanion(undefined, mode.id, false)}
              className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 hover:border-emerald-300 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="p-1.5 rounded-xl bg-white border border-stone-200 shadow-2xs group-hover:scale-105 transition-transform">
                  {renderModeIcon(mode.id)}
                </div>
                <span className="text-[10px] font-semibold text-stone-400 group-hover:text-emerald-700">
                  {mode.badge}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900 group-hover:text-emerald-950">
                  {mode.name}
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                  {mode.tagline}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Unobtrusive Quick Daily Check-in */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Unobtrusive Daily Check-in
            </h3>
          </div>
          <span className="text-[11px] text-stone-400">Takes 5 seconds</span>
        </div>

        {quickCheckinDone ? (
          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-medium flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Checked in! Saved privately to your journal. Keep growing!</span>
            </div>
            {(lastSelectedMood === 'low' || lastSelectedMood === 'difficult') && (
              <button
                onClick={() => setShowBreathingModal(true)}
                className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Take 1-Min Breathing Break</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-stone-600 font-medium hidden sm:inline">How are you feeling right now?</span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-around">
              {(
                [
                  { mood: 'great', emoji: '😊', label: 'Great' },
                  { mood: 'good', emoji: '🙂', label: 'Good' },
                  { mood: 'okay', emoji: '😐', label: 'Okay' },
                  { mood: 'low', emoji: '😔', label: 'Low' },
                  { mood: 'difficult', emoji: '😣', label: 'Tough' },
                ] as const
              ).map((item) => (
                <button
                  key={item.mood}
                  onClick={() => handleQuickMood(item.mood)}
                  className="flex flex-col items-center p-2 rounded-xl hover:bg-stone-100 text-stone-700 active:scale-95 transition-all text-center"
                  title={`Feeling ${item.label}`}
                >
                  <span className="text-xl sm:text-2xl">{item.emoji}</span>
                  <span className="text-[10px] text-stone-500 font-semibold mt-0.5">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mindful Breathing & Mental Fatigue Reset Card */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-5 sm:p-6 border border-teal-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-white">
                Mentally Tired or Overwhelmed?
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-800/80 text-teal-200 border border-teal-600/50">
                1-Min Reset
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-xl leading-relaxed">
              When study, work, or thoughts feel heavy, give your nervous system permission to pause. Gentle guided breathing with Box & 4-7-8 techniques.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBreathingModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2"
        >
          <Wind className="w-4 h-4 text-stone-950" />
          <span>Start Breathing Exercise</span>
        </button>
      </div>

      {/* 3. Today's Growth Section */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-stone-900 flex items-center gap-2">
              <span>Today's Growth</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {completedCount} / {totalDaily} completed
              </span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Three gentle daily practices to strengthen your mind, communication & confidence
            </p>
          </div>
          <button
            onClick={() => onSelectTab('grow')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>All Challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Dynamic Streak Counter Card */}
        <div className="mb-4">
          <StreakCounterCard
            streak={stats?.dailyGrowthStreak}
            onRefresh={refreshStats}
            compact={true}
          />
        </div>

        {/* 3 Activities Checklist */}
        <div className="space-y-2.5">
          {dailyActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => handleToggleActivity(act.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                act.completed
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                  : 'bg-stone-50/60 border-stone-200 hover:bg-stone-50 text-stone-800'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 focus:outline-hidden"
                aria-label={act.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {act.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-300 hover:text-stone-400" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      act.activity_type === 'Mind'
                        ? 'bg-purple-100 text-purple-800'
                        : act.activity_type === 'Communication'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {act.activity_type}
                  </span>
                  {act.completed && (
                    <span className="text-[10px] text-emerald-700 font-semibold">✓ Done</span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-medium leading-relaxed ${
                    act.completed ? 'line-through text-stone-400' : 'text-stone-800'
                  }`}
                >
                  {act.activity_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Weekly English Practice Activity Graph (Recharts) */}
      <EnglishWeeklyActivityGraph
        weeklyActivity={stats?.englishWeeklyActivity}
        onRefreshStats={refreshStats}
        onNavigateToPractice={() => onSelectTab('practice')}
      />

      {/* 5. Core Modules Cards (Section 6 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Companion Card */}
        <div
          onClick={() => onOpenCompanion()}
          className="group p-5 bg-white hover:bg-emerald-50/50 rounded-3xl border border-stone-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-stone-900 mb-1 flex items-center justify-between">
              <span>AI Growth Companion</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              "Talk, reflect and find a way forward." A supportive mentor that helps you build independent confidence.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
            <span>Ask for advice or practice</span>
          </div>
        </div>

        {/* English Practice Card */}
        <div
          onClick={() => onSelectTab('practice')}
          className="group p-5 bg-white hover:bg-teal-50/50 rounded-3xl border border-stone-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-stone-900 mb-1 flex items-center justify-between">
              <span>English Practice</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              "Practice English without fear of making mistakes." Speaking topics, vocabulary, grammar & interview prep.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-teal-700">
            <span>Score: {stats?.englishOverall || 70}% • Speaking & GDs</span>
          </div>
        </div>

        {/* Confidence Card */}
        <div
          onClick={() => onSelectTab('grow')}
          className="group p-5 bg-white hover:bg-amber-50/50 rounded-3xl border border-stone-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-stone-900 mb-1 flex items-center justify-between">
              <span>Confidence Builder</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              "Small challenges. Bigger confidence." Beginner, Intermediate & Advanced real-world challenges.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-semibold text-amber-800">
            <span>Confidence index: {stats?.confidencePercent || 64}%</span>
          </div>
        </div>

        {/* Journal Card */}
        <div
          onClick={() => onSelectTab('reflect')}
          className="group p-5 bg-white hover:bg-emerald-50/50 rounded-3xl border border-stone-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-stone-900 mb-1 flex items-center justify-between">
              <span>Private Journal</span>
              <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              "Write it down. Understand yourself." Private reflection space with gentle AI theme analysis.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
            <span>{stats?.journalCount || 3} entries saved</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenJournalEditor();
              }}
              className="text-emerald-800 underline font-bold"
            >
              + New Entry
            </button>
          </div>
        </div>
      </div>

      {/* 5. Goals Quick Widget */}
      <div
        onClick={() => onSelectTab('profile')}
        className="p-5 bg-stone-900 text-white rounded-3xl shadow-md cursor-pointer hover:bg-stone-800 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-bold text-sm text-white">Active Goals</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-semibold">
                {stats?.activeGoalsCount || 3} in progress
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              "Turn intentions into progress." Master presentations, interviews & spoken clarity.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-stone-400 shrink-0" />
      </div>

      {/* Philosophy Anchor Reminder */}
      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-center text-xs text-stone-500">
        🌱 <strong>GrowWise Principle:</strong> We help you build confidence to handle real life better, so you need this app less over time.
      </div>

      {/* Guided Mindful Breathing Exercise Modal */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </div>
  );
};
