import React, { useState, useEffect } from 'react';
import {
  Sprout,
  CheckCircle2,
  Circle,
  Compass,
  Sparkles,
  Award,
  ChevronRight,
  Filter,
  MessageSquare,
  X,
  HelpCircle,
  Wind,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DailyActivity, ConfidenceActivity } from '../../types';
import { api } from '../../services/apiClient';
import { StreakCounterCard } from '../common/StreakCounterCard';
import { BreathingExerciseModal } from '../common/BreathingExerciseModal';

export const GrowHub: React.FC = () => {
  const { stats, refreshStats } = useAuth();
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [confidenceActivities, setConfidenceActivities] = useState<ConfidenceActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  // Reflection modal for completed challenge
  const [reflectingActivity, setReflectingActivity] = useState<ConfidenceActivity | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [daily, conf] = await Promise.all([
        api.getDailyActivities(),
        api.getConfidenceActivities(),
      ]);
      setDailyActivities(daily);
      setConfidenceActivities(conf);
    } catch (e) {
      console.warn('Failed to load growth activities', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleDaily = async (id: string) => {
    try {
      const updated = await api.toggleDailyActivity(id);
      setDailyActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      refreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleConfidence = async (act: ConfidenceActivity) => {
    if (!act.completed) {
      // Prompt user to record reflection
      setReflectingActivity(act);
      setReflectionText('');
    } else {
      // Toggle off
      try {
        const updated = await api.toggleConfidenceActivity(act.id);
        setConfidenceActivities((prev) => prev.map((a) => (a.id === act.id ? updated : a)));
        refreshStats();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const submitReflection = async () => {
    if (!reflectingActivity) return;
    try {
      const updated = await api.toggleConfidenceActivity(
        reflectingActivity.id,
        reflectionText.trim() || 'Felt a bit nervous before, but proud of taking action!'
      );
      setConfidenceActivities((prev) =>
        prev.map((a) => (a.id === reflectingActivity.id ? updated : a))
      );
      setReflectingActivity(null);
      setReflectionText('');
      refreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredConfidence = confidenceActivities.filter(
    (act) => difficultyFilter === 'All' || act.difficulty === difficultyFilter
  );

  const totalPoints = confidenceActivities
    .filter((a) => a.completed)
    .reduce((sum, a) => sum + (a.points || 10), 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-stone-900">Grow & Build Confidence</h1>
            <p className="text-xs text-stone-500">"Small challenges. Bigger confidence."</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
          <Award className="w-4 h-4 text-emerald-700" />
          <div>
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Growth XP</span>
            <span className="text-xs font-bold text-emerald-900">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      {/* 1. Daily Growth Section */}
      <div className="space-y-4">
        <StreakCounterCard
          streak={stats?.dailyGrowthStreak}
          onRefresh={refreshStats}
        />

        {/* Mindful Breathing Reset Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-900/90 via-emerald-950 to-stone-900 text-white border border-teal-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading text-sm font-bold text-white">
                  Mindful Breathing Reset
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-800/80 text-teal-200">
                  Grounding
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                Feeling mentally tired or anxious? Take a 1-minute conscious breathing pause before your next challenge.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBreathingModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <Wind className="w-3.5 h-3.5 text-stone-950" />
            <span>Practice Breathing</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
              Daily Habits
            </span>
            <h2 className="font-heading text-lg font-bold text-stone-900 mt-1">Today's 3 Growth Practices</h2>
            <p className="text-xs text-stone-500">
              Designed to gently build self-awareness and presence every single day.
            </p>
          </div>

        <div className="space-y-2.5">
          {dailyActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => handleToggleDaily(act.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                act.completed
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                  : 'bg-stone-50/60 border-stone-200 hover:bg-stone-50 text-stone-800'
              }`}
            >
              <button type="button" className="mt-0.5 shrink-0 focus:outline-hidden">
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
                    <span className="text-[10px] text-emerald-700 font-semibold">✓ Completed</span>
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
      </div>

      {/* 2. Confidence Builder Challenges */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
              Confidence Roadmap
            </span>
            <h2 className="font-heading text-lg font-bold text-stone-900 mt-1">Real-World Confidence Challenges</h2>
            <p className="text-xs text-stone-500">
              Pick a challenge that stretches you just a tiny bit outside your comfort zone.
            </p>
          </div>

          {/* Difficulty Filter Chips */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  difficultyFilter === diff
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredConfidence.map((act) => (
            <div
              key={act.id}
              className={`p-4 rounded-2xl border transition-all ${
                act.completed
                  ? 'bg-stone-50/60 border-stone-200 opacity-90'
                  : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleConfidence(act)}
                    className="mt-0.5 focus:outline-hidden"
                  >
                    {act.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300 hover:text-amber-500" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          act.difficulty === 'Beginner'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.difficulty === 'Intermediate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {act.difficulty}
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold">• {act.category}</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        +{act.points} pts
                      </span>
                    </div>

                    <p
                      className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                        act.completed ? 'line-through text-stone-400' : 'text-stone-900'
                      }`}
                    >
                      {act.activity}
                    </p>

                    {act.user_reflection && (
                      <div className="mt-2 text-xs text-stone-600 bg-stone-100 p-2.5 rounded-xl border border-stone-200 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span>
                          <em>Your Reflection:</em> "{act.user_reflection}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleConfidence(act)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    act.completed
                      ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  }`}
                >
                  {act.completed ? 'Completed' : 'Tackle This'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge Completion & Reflection Modal */}
      {reflectingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 relative">
            <button
              onClick={() => setReflectingActivity(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-emerald-800">
              <Award className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-bold text-stone-900">Challenge Completed!</h3>
            </div>

            <p className="text-xs text-stone-600 mb-3 leading-relaxed">
              You stepped up: <strong>"{reflectingActivity.activity}"</strong> (+{reflectingActivity.points} pts)
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                How did it feel before vs. after you did it?
              </label>
              <textarea
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="e.g. My heart beat fast before raising my hand, but once I asked, nobody laughed and the professor explained it well!"
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => submitReflection()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Save My Growth Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Breathing Exercise Modal */}
      <BreathingExerciseModal
        isOpen={showBreathingModal}
        onClose={() => setShowBreathingModal(false)}
      />
    </div>
  );
};
