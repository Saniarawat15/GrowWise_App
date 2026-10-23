import React, { useState } from 'react';
import { Flame, CheckCircle2, Circle, Sprout, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { DailyGrowthStreak } from '../../types';
import { api } from '../../services/apiClient';

interface StreakCounterCardProps {
  streak?: DailyGrowthStreak;
  onRefresh?: () => void;
  compact?: boolean;
  showSimulateButtons?: boolean;
}

export const StreakCounterCard: React.FC<StreakCounterCardProps> = ({
  streak,
  onRefresh,
  compact = false,
  showSimulateButtons = false,
}) => {
  const [simulating, setSimulating] = useState(false);

  // Fallback defaults if streak object not yet loaded
  const currentStreak = streak?.currentStreak ?? 0;
  const bestStreak = streak?.bestStreak ?? Math.max(currentStreak, 5);
  const isTodayCompleted = streak?.isTodayCompleted ?? false;
  const todayCompletedCount = streak?.todayCompletedCount ?? 0;
  const status = streak?.status ?? (currentStreak > 0 ? (isTodayCompleted ? 'completed_today' : 'pending_today') : 'broken');
  const message = streak?.message ?? (
    currentStreak > 0
      ? `🔥 ${currentStreak} day growth streak!`
      : "Missed a day? That's completely okay. Growth isn't ruined by one missed day. Take a breath and start again today."
  );

  const handleSimulateBreak = async () => {
    setSimulating(true);
    try {
      await api.simulateBreakStreak();
      onRefresh?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleRestoreDemo = async () => {
    setSimulating(true);
    try {
      await api.restoreDemoStreak();
      onRefresh?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  if (compact) {
    return (
      <div
        id="compact-streak-banner"
        className={`p-3.5 rounded-2xl border transition-all ${
          status === 'broken' || currentStreak === 0
            ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
            : isTodayCompleted
            ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/10 border-orange-300/70 text-stone-900'
            : 'bg-orange-50/70 border-orange-200 text-orange-950'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-xl ${
                status === 'broken' || currentStreak === 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-orange-100 text-orange-600'
              }`}
            >
              {status === 'broken' || currentStreak === 0 ? (
                <Sprout className="w-4 h-4 text-emerald-700" />
              ) : (
                <Flame className="w-4 h-4 fill-orange-500 text-orange-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-xs font-bold">
                  {currentStreak > 0 ? `🔥 ${currentStreak} Day Growth Streak` : '🌱 Fresh Start Today'}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-white/80 border border-stone-200">
                  {todayCompletedCount}/3 completed today
                </span>
              </div>
              <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">{message}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500 font-semibold shrink-0">
            <span>Best: {bestStreak}d</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="growth-streak-card"
      className={`rounded-3xl border transition-all p-5 sm:p-6 relative overflow-hidden ${
        status === 'broken' || currentStreak === 0
          ? 'bg-gradient-to-br from-stone-50 via-amber-50/40 to-emerald-50/30 border-amber-200/90 shadow-xs'
          : isTodayCompleted
          ? 'bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-emerald-500/15 border-orange-300 shadow-sm'
          : 'bg-gradient-to-br from-orange-500/10 via-stone-50 to-amber-50/40 border-orange-200/90 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left icon and titles */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl shrink-0 mt-0.5 shadow-xs ${
              status === 'broken' || currentStreak === 0
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-orange-100 text-orange-600'
            }`}
          >
            {status === 'broken' || currentStreak === 0 ? (
              <Sprout className="w-7 h-7 text-emerald-700" />
            ) : (
              <Flame className="w-7 h-7 fill-orange-500 text-orange-600 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-bold text-stone-900">
                {currentStreak > 0 ? `🔥 ${currentStreak} Day Growth Streak` : '🌱 Fresh Start • Day 1'}
              </h3>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isTodayCompleted
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentStreak > 0
                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {isTodayCompleted
                  ? '✓ All 3 Done Today'
                  : currentStreak > 0
                  ? 'Streak Active'
                  : 'Non-Guilt Model'}
              </span>
            </div>

            {/* Streak message with emphasis on non-guilt reassurance */}
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
              {status === 'broken' || currentStreak === 0 ? (
                <span className="italic">
                  "Missed a day? That's completely okay. Growth isn't ruined by one missed day. Take a breath and start again today."
                </span>
              ) : (
                message
              )}
            </p>

            {/* Today's 3 practices pill indicators */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-stone-500 mr-1">Today's Practices:</span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
                  todayCompletedCount >= 1
                    ? 'bg-purple-100 border-purple-200 text-purple-900'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {todayCompletedCount >= 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>1. Mind</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
                  todayCompletedCount >= 2
                    ? 'bg-blue-100 border-blue-200 text-blue-900'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {todayCompletedCount >= 2 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>2. Communication</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-medium ${
                  todayCompletedCount >= 3
                    ? 'bg-amber-100 border-amber-200 text-amber-900'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {todayCompletedCount >= 3 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span>3. Confidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side stats & milestones */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-200/60 shrink-0 gap-1.5">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-stone-500 block">Personal Best</span>
            <span className="font-heading text-lg font-bold text-stone-900">
              {bestStreak} Days
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-white/80 px-2.5 py-1 rounded-xl border border-stone-200/80">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Target: 3/3 daily</span>
          </div>
        </div>
      </div>

      {/* Reviewer / presentation interactive test controls */}
      {showSimulateButtons && (
        <div className="mt-4 pt-3.5 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>Interactive Demo Controls:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="simulate-break-streak-btn"
              type="button"
              disabled={simulating}
              onClick={handleSimulateBreak}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold transition-colors disabled:opacity-50"
            >
              Test Broken Streak (0d Non-Guilt)
            </button>
            <button
              id="restore-demo-streak-btn"
              type="button"
              disabled={simulating}
              onClick={handleRestoreDemo}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              Restore 4-Day Streak (2/3 Done)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
